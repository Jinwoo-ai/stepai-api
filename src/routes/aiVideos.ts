import express from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getDatabaseConnection } from '../configs/database';
import { authenticateAdmin, AdminAuthenticatedRequest } from '../middleware/adminAuth';

const router = express.Router();

// AI 영상 목록 조회
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 10;
    const search = req.query['search'] as string;
    const category_id = req.query['category_id'] ? parseInt(req.query['category_id'] as string) : undefined;
    const video_status = req.query['video_status'] as string;
    
    // 로그인된 사용자 ID 추출
    let userId = null;
    if (req.headers.authorization) {
      const token = req.headers.authorization.replace('Bearer ', '');
      if (!isNaN(parseInt(token))) {
        userId = parseInt(token);
      }
    }

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      const offset = (page - 1) * limit;
      const whereConditions: string[] = ['ai_videos.deleted_at IS NULL'];
      const queryParams: any[] = [];

      if (search) {
        whereConditions.push('(ai_videos.video_title LIKE ? OR ai_videos.video_description LIKE ?)');
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      if (category_id) {
        whereConditions.push('EXISTS (SELECT 1 FROM ai_video_categories avc WHERE avc.ai_video_id = ai_videos.id AND avc.category_id = ?)');
        queryParams.push(category_id);
      }

      if (video_status) {
        whereConditions.push('ai_videos.video_status = ?');
        queryParams.push(video_status);
      }

      const whereClause = whereConditions.join(' AND ');

      // 전체 개수 조회
      const [countResult] = await connection.execute<RowDataPacket[]>(
        `SELECT COUNT(DISTINCT ai_videos.id) as total FROM ai_videos WHERE ${whereClause}`,
        queryParams
      );

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      // AI 영상 목록 조회
      const [videos] = await connection.execute<RowDataPacket[]>(
        `SELECT DISTINCT ai_videos.* FROM ai_videos WHERE ${whereClause} 
         ORDER BY ai_videos.created_at DESC LIMIT ? OFFSET ?`,
        [...queryParams, limit, offset]
      );

      // 카테고리 정보 포함
      const videosWithCategories = [];
      for (const video of videos) {
        const [categories] = await connection.execute<RowDataPacket[]>(
          `SELECT c.id, c.category_name 
           FROM categories c 
           INNER JOIN ai_video_categories avc ON c.id = avc.category_id 
           WHERE avc.ai_video_id = ?`,
          [video.id]
        );
        
        // 태그 정보 포함
        const [tags] = await connection.execute<RowDataPacket[]>(
          `SELECT t.id, t.tag_name
           FROM tags t
           INNER JOIN ai_video_tags avt ON t.id = avt.tag_id
           WHERE avt.ai_video_id = ?
           ORDER BY t.tag_name`,
          [video.id]
        );
        
        // AI 서비스 정보 포함
        let aiServices = [];
        try {
          // 먼저 연결 테이블에서 서비스 ID들 조회
          const [serviceIds] = await connection.execute<RowDataPacket[]>(
            'SELECT ai_service_id, usage_order FROM ai_video_services WHERE ai_video_id = ? ORDER BY usage_order ASC',
            [video.id]
          );
          
          for (const serviceLink of serviceIds) {
            const [services] = await connection.execute<RowDataPacket[]>(
              'SELECT id, ai_name, ai_description, ai_logo, company_name, difficulty_level, is_step_pick, is_new FROM ai_services WHERE id = ?',
              [serviceLink.ai_service_id]
            );
            
            if (services.length > 0) {
              aiServices.push({
                ...services[0],
                usage_order: serviceLink.usage_order
              });
            }
          }
        } catch (serviceError) {
          console.error('AI services query error for video:', video.id, serviceError);
          aiServices = [];
        }
        
        let tagsString = tags.map(tag => tag['tag_name']).join(' #');
        if (tagsString) tagsString = '#' + tagsString;
        
        // 북마크 정보 추가
        let isBookmarked = false;
        if (userId) {
          const [bookmarkResult] = await connection.execute<RowDataPacket[]>(
            'SELECT id FROM user_favorite_videos WHERE user_id = ? AND ai_video_id = ?',
            [userId, video.id]
          );
          isBookmarked = bookmarkResult.length > 0;
        }
        
        videosWithCategories.push({
          ...video,
          categories: categories,
          ai_services: aiServices,
          tags: tagsString,
          tag_ids: tags.map(tag => tag['id']), // Admin 인터페이스에서 필요
          is_bookmarked: userId ? isBookmarked : undefined
        });
      }

      res.json({
        success: true,
        data: {
          data: videosWithCategories,
          pagination: {
            page,
            limit,
            total,
            totalPages
          }
        }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching AI videos:', error);
    res.status(500).json({
      success: false,
      error: 'AI 영상 조회 중 오류가 발생했습니다.'
    });
  }
});

// AI 영상 생성
router.post('/', authenticateAdmin, async (req: AdminAuthenticatedRequest, res) => {
  try {
    const { 
      video_title, 
      video_description, 
      video_url, 
      thumbnail_url, 
      duration, 
      video_status = 'active',
      is_visible = true,
      categories = [],
      ai_services = [],
      selected_tags = []
    } = req.body;

    if (!video_title || !video_url) {
      return res.status(400).json({
        success: false,
        error: '영상 제목과 URL은 필수입니다.'
      });
    }

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // AI 영상 생성
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO ai_videos (video_title, video_description, video_url, thumbnail_url, 
                               duration, video_status, is_visible) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [video_title, video_description || null, video_url, thumbnail_url || null, 
         duration || 0, video_status, is_visible]
      );

      const videoId = result.insertId;

      // 카테고리 연결
      if (categories && categories.length > 0) {
        for (const category of categories) {
          await connection.execute(
            'INSERT INTO ai_video_categories (ai_video_id, category_id) VALUES (?, ?)',
            [videoId, category.id || category.category_id]
          );
        }
      }

      // AI 서비스 연결
      if (ai_services && ai_services.length > 0) {
        for (let i = 0; i < ai_services.length; i++) {
          const service = ai_services[i];
          const serviceId = service.ai_service_id || service.id;
          if (serviceId) {
            await connection.execute(
              'INSERT INTO ai_video_services (ai_video_id, ai_service_id, usage_order) VALUES (?, ?, ?)',
              [videoId, serviceId, service.usage_order || i + 1]
            );
          }
        }
      }

      // 태그 처리
      if (selected_tags && selected_tags.length > 0) {
        for (const tagId of selected_tags) {
          await connection.execute(
            'INSERT IGNORE INTO ai_video_tags (ai_video_id, tag_id) VALUES (?, ?)',
            [videoId, tagId]
          );
        }
        
        // 태그 사용 횟수 업데이트 (선택된 태그들만)
        for (const tagId of selected_tags) {
          await connection.execute(
            'UPDATE tags SET tag_count = tag_count + 1 WHERE id = ?',
            [tagId]
          );
        }
      }

      await connection.commit();

      res.status(201).json({
        success: true,
        data: { id: videoId },
        message: 'AI 영상이 생성되었습니다.'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating AI video:', error);
    res.status(500).json({
      success: false,
      error: 'AI 영상 생성 중 오류가 발생했습니다.'
    });
  }
});

// AI 영상 수정
router.put('/:id', authenticateAdmin, async (req: AdminAuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const { 
      video_title, 
      video_description, 
      video_url, 
      thumbnail_url, 
      duration, 
      video_status,
      is_visible,
      categories = [],
      ai_services = [],
      selected_tags = []
    } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다.'
      });
    }

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // AI 영상 존재 확인
      const [existingVideos] = await connection.execute<RowDataPacket[]>(
        'SELECT id FROM ai_videos WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existingVideos.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'AI 영상을 찾을 수 없습니다.'
        });
      }

      // 기본 정보 업데이트
      const updateFields: string[] = [];
      const updateParams: any[] = [];

      const fieldsToUpdate = [
        'video_title', 'video_description', 'video_url', 'thumbnail_url', 
        'duration', 'video_status', 'is_visible'
      ];

      fieldsToUpdate.forEach(field => {
        if (req.body[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          updateParams.push(req.body[field]);
        }
      });

      if (updateFields.length > 0) {
        await connection.execute(
          `UPDATE ai_videos SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
          [...updateParams, id]
        );
      }

      // 카테고리 업데이트
      if (categories) {
        await connection.execute('DELETE FROM ai_video_categories WHERE ai_video_id = ?', [id]);
        for (const category of categories) {
          await connection.execute(
            'INSERT INTO ai_video_categories (ai_video_id, category_id) VALUES (?, ?)',
            [id, category.id || category.category_id]
          );
        }
      }

      // AI 서비스 업데이트
      if (ai_services !== undefined) {
        await connection.execute('DELETE FROM ai_video_services WHERE ai_video_id = ?', [id]);
        if (ai_services && ai_services.length > 0) {
          for (let i = 0; i < ai_services.length; i++) {
            const service = ai_services[i];
            const serviceId = service.ai_service_id || service.id;
            if (serviceId) {
              await connection.execute(
                'INSERT INTO ai_video_services (ai_video_id, ai_service_id, usage_order) VALUES (?, ?, ?)',
                [id, serviceId, service.usage_order || i + 1]
              );
            }
          }
        }
      }

      // 태그 업데이트
      if (selected_tags !== undefined) {
        // 기존 태그 조회 (업데이트할 태그들 파악용)
        const [oldTags] = await connection.execute<RowDataPacket[]>(
          'SELECT tag_id FROM ai_video_tags WHERE ai_video_id = ?',
          [id]
        );
        const oldTagIds = oldTags.map(tag => tag['tag_id']);
        
        // 기존 태그 연결 삭제
        await connection.execute('DELETE FROM ai_video_tags WHERE ai_video_id = ?', [id]);
        
        if (selected_tags && selected_tags.length > 0) {
          for (const tagId of selected_tags) {
            await connection.execute(
              'INSERT INTO ai_video_tags (ai_video_id, tag_id) VALUES (?, ?)',
              [id, tagId]
            );
          }
        }
        
        // 변경된 태그들만 사용 횟수 업데이트
        const affectedTagIds = [...new Set([...oldTagIds, ...selected_tags])];
        for (const tagId of affectedTagIds) {
          await connection.execute(
            `UPDATE tags SET tag_count = (
              SELECT COUNT(*) FROM ai_service_tags WHERE tag_id = ?
            ) + (
              SELECT COUNT(*) FROM ai_video_tags WHERE tag_id = ?
            ) WHERE id = ?`,
            [tagId, tagId, tagId]
          );
        }
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'AI 영상이 수정되었습니다.'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating AI video:', error);
    res.status(500).json({
      success: false,
      error: 'AI 영상 수정 중 오류가 발생했습니다.'
    });
  }
});

// AI 영상 삭제
router.delete('/:id', authenticateAdmin, async (req: AdminAuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다.'
      });
    }

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      const [result] = await connection.execute<ResultSetHeader>(
        'UPDATE ai_videos SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'AI 영상을 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        message: 'AI 영상이 삭제되었습니다.'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting AI video:', error);
    res.status(500).json({
      success: false,
      error: 'AI 영상 삭제 중 오류가 발생했습니다.'
    });
  }
});

// AI 영상 상세 조회
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // 로그인된 사용자 ID 추출
    let userId = null;
    if (req.headers.authorization) {
      const token = req.headers.authorization.replace('Bearer ', '');
      if (!isNaN(parseInt(token))) {
        userId = parseInt(token);
      }
    }

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다.'
      });
    }

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      // AI 영상 기본 정보 조회
      const [videos] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM ai_videos WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (videos.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'AI 영상을 찾을 수 없습니다.'
        });
      }

      const video = videos[0];

      // 카테고리 정보 조회
      const [categories] = await connection.execute<RowDataPacket[]>(
        `SELECT c.id, c.category_name 
         FROM categories c 
         INNER JOIN ai_video_categories avc ON c.id = avc.category_id 
         WHERE avc.ai_video_id = ?`,
        [id]
      );

      // AI 서비스 정보 조회
      const aiServices = [];
      try {
        const [serviceIds] = await connection.execute<RowDataPacket[]>(
          'SELECT ai_service_id, usage_order FROM ai_video_services WHERE ai_video_id = ? ORDER BY usage_order ASC',
          [id]
        );
        
        for (const serviceLink of serviceIds) {
          const [services] = await connection.execute<RowDataPacket[]>(
            'SELECT id, ai_name, ai_description, ai_logo, company_name, difficulty_level, is_step_pick, is_new FROM ai_services WHERE id = ?',
            [serviceLink.ai_service_id]
          );
          
          if (services.length > 0) {
            aiServices.push({
              ...services[0],
              usage_order: serviceLink.usage_order
            });
          }
        }
      } catch (serviceError) {
        console.error('AI services query error for video detail:', id, serviceError);
      }

      // 앞 영상 1개 조회 (이전 영상)
      const [prevVideos] = await connection.execute<RowDataPacket[]>(
        `SELECT id, video_title, thumbnail_url, duration, view_count 
         FROM ai_videos 
         WHERE id < ? AND deleted_at IS NULL AND video_status = 'active' AND is_visible = TRUE
         ORDER BY id DESC 
         LIMIT 1`,
        [id]
      );

      // 뒤 영상 2개 조회 (다음 영상)
      const [nextVideos] = await connection.execute<RowDataPacket[]>(
        `SELECT id, video_title, thumbnail_url, duration, view_count 
         FROM ai_videos 
         WHERE id > ? AND deleted_at IS NULL AND video_status = 'active' AND is_visible = TRUE
         ORDER BY id ASC 
         LIMIT 2`,
        [id]
      );

      // 북마크 정보 추가
      let isBookmarked = false;
      if (userId) {
        const [bookmarkResult] = await connection.execute<RowDataPacket[]>(
          'SELECT id FROM user_favorite_videos WHERE user_id = ? AND ai_video_id = ?',
          [userId, id]
        );
        isBookmarked = bookmarkResult.length > 0;
      }

      res.json({
        success: true,
        data: {
          ...video,
          categories: categories,
          ai_services: aiServices,
          related_videos: {
            previous: prevVideos.length > 0 ? prevVideos[0] : null,
            next: nextVideos
          },
          is_bookmarked: userId ? isBookmarked : undefined
        }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching AI video:', error);
    res.status(500).json({
      success: false,
      error: 'AI 영상 조회 중 오류가 발생했습니다.'
    });
  }
});

export default router;