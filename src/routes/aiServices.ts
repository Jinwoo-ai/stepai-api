import express from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getDatabaseConnection } from '../configs/database';

const router = express.Router();

// AI 서비스 목록 조회
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 10;
    const search = req.query['search'] as string;
    const category_id = req.query['category_id'] ? parseInt(req.query['category_id'] as string) : undefined;
    const ai_status = req.query['ai_status'] as string;
    const is_step_pick = req.query['is_step_pick'] as string;
    const include_categories = req.query['include_categories'] === 'true';

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      const offset = (page - 1) * limit;
      const whereConditions: string[] = ['ai_services.deleted_at IS NULL'];
      const queryParams: any[] = [];

      if (search) {
        whereConditions.push('(ai_services.ai_name LIKE ? OR ai_services.ai_description LIKE ?)');
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      if (category_id) {
        whereConditions.push('EXISTS (SELECT 1 FROM ai_service_categories ac WHERE ac.ai_service_id = ai_services.id AND ac.category_id = ?)');
        queryParams.push(category_id);
      }

      if (ai_status) {
        whereConditions.push('ai_services.ai_status = ?');
        queryParams.push(ai_status);
      }

      if (is_step_pick) {
        whereConditions.push('ai_services.is_step_pick = ?');
        queryParams.push(is_step_pick === 'true');
      }

      const whereClause = whereConditions.join(' AND ');

      // 전체 개수 조회
      const [countResult] = await connection.execute<RowDataPacket[]>(
        `SELECT COUNT(DISTINCT ai_services.id) as total FROM ai_services WHERE ${whereClause}`,
        queryParams
      );

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      // AI 서비스 목록 조회
      const [services] = await connection.execute<RowDataPacket[]>(
        `SELECT DISTINCT ai_services.* FROM ai_services WHERE ${whereClause} 
         ORDER BY ai_services.created_at DESC LIMIT ? OFFSET ?`,
        [...queryParams, limit, offset]
      );

      // 카테고리 정보 포함
      const servicesWithCategories = [];
      for (const service of services) {
        let serviceData = { ...service };
        
        if (include_categories) {
          const [categories] = await connection.execute<RowDataPacket[]>(
            `SELECT c.id, c.category_name, ac.is_main_category 
             FROM categories c 
             INNER JOIN ai_service_categories ac ON c.id = ac.category_id 
             WHERE ac.ai_service_id = ?`,
            [service.id]
          );
          serviceData.categories = categories;
        }
        
        servicesWithCategories.push(serviceData);
      }

      res.json({
        success: true,
        data: {
          data: servicesWithCategories,
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
    console.error('Error fetching AI services:', error);
    res.status(500).json({
      success: false,
      error: 'AI 서비스 조회 중 오류가 발생했습니다.'
    });
  }
});

// AI 서비스 생성
router.post('/', async (req, res) => {
  try {
    const { 
      ai_name, 
      ai_description, 
      ai_type, 
      ai_website, 
      ai_logo, 
      pricing_model, 
      pricing_info, 
      difficulty_level, 
      ai_status = 'active',
      is_visible = true,
      is_step_pick = false,
      nationality,
      categories = [],
      contents = [],
      sns = [],
      similar_service_ids = []
    } = req.body;

    if (!ai_name || !ai_type) {
      return res.status(400).json({
        success: false,
        error: 'AI 서비스명과 타입은 필수입니다.'
      });
    }

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // AI 서비스 생성
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO ai_services (ai_name, ai_description, ai_type, ai_website, ai_logo, 
                                 pricing_model, pricing_info, difficulty_level, ai_status, 
                                 is_visible, is_step_pick, nationality) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [ai_name, ai_description || null, ai_type, ai_website || null, ai_logo || null,
         pricing_model || 'free', pricing_info || null, difficulty_level || 'beginner',
         ai_status, is_visible, is_step_pick, nationality || null]
      );

      const serviceId = result.insertId;

      // 카테고리 연결
      if (categories && categories.length > 0) {
        for (const category of categories) {
          await connection.execute(
            'INSERT INTO ai_service_categories (ai_service_id, category_id, is_main_category) VALUES (?, ?, ?)',
            [serviceId, category.id || category.category_id, category.is_main_category || false]
          );
        }
      }

      // 콘텐츠 저장
      if (contents && contents.length > 0) {
        for (const content of contents) {
          if (content.content_text && content.content_text.trim()) {
            await connection.execute(
              'INSERT INTO ai_service_contents (ai_service_id, content_type, content_title, content_text, content_order) VALUES (?, ?, ?, ?, ?)',
              [serviceId, content.content_type, content.content_title || '', content.content_text, content.content_order || 1]
            );
          }
        }
      }

      // SNS 저장
      if (sns && sns.length > 0) {
        for (const snsItem of sns) {
          if (snsItem.sns_url && snsItem.sns_url.trim()) {
            await connection.execute(
              'INSERT INTO ai_service_sns (ai_service_id, sns_type, sns_url, sns_order) VALUES (?, ?, ?, ?)',
              [serviceId, snsItem.sns_type, snsItem.sns_url, snsItem.sns_order || 1]
            );
          }
        }
      }

      // 유사 서비스 연결
      if (similar_service_ids && similar_service_ids.length > 0) {
        for (const similarId of similar_service_ids) {
          await connection.execute(
            'INSERT INTO ai_service_similar_services (ai_service_id, similar_service_id) VALUES (?, ?)',
            [serviceId, similarId]
          );
        }
      }

      await connection.commit();

      res.status(201).json({
        success: true,
        data: { id: serviceId },
        message: 'AI 서비스가 생성되었습니다.'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating AI service:', error);
    res.status(500).json({
      success: false,
      error: 'AI 서비스 생성 중 오류가 발생했습니다.'
    });
  }
});

// AI 서비스 수정
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { 
      ai_name, 
      ai_description, 
      ai_type, 
      ai_website, 
      ai_logo, 
      pricing_model, 
      pricing_info, 
      difficulty_level, 
      ai_status,
      is_visible,
      is_step_pick,
      nationality,
      categories = []
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

      // AI 서비스 존재 확인
      const [existingServices] = await connection.execute<RowDataPacket[]>(
        'SELECT id FROM ai_services WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existingServices.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'AI 서비스를 찾을 수 없습니다.'
        });
      }

      // 기본 정보 업데이트
      const updateFields: string[] = [];
      const updateParams: any[] = [];

      const fieldsToUpdate = [
        'ai_name', 'ai_description', 'ai_type', 'ai_website', 'ai_logo',
        'pricing_model', 'pricing_info', 'difficulty_level', 'ai_status',
        'is_visible', 'is_step_pick', 'nationality'
      ];

      fieldsToUpdate.forEach(field => {
        if (req.body[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          updateParams.push(req.body[field]);
        }
      });

      if (updateFields.length > 0) {
        await connection.execute(
          `UPDATE ai_services SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
          [...updateParams, id]
        );
      }

      // 카테고리 업데이트
      if (categories) {
        await connection.execute('DELETE FROM ai_service_categories WHERE ai_service_id = ?', [id]);
        for (const category of categories) {
          await connection.execute(
            'INSERT INTO ai_service_categories (ai_service_id, category_id, is_main_category) VALUES (?, ?, ?)',
            [id, category.category_id || category.id, category.is_main || category.is_main_category || false]
          );
        }
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'AI 서비스가 수정되었습니다.'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating AI service:', error);
    res.status(500).json({
      success: false,
      error: 'AI 서비스 수정 중 오류가 발생했습니다.'
    });
  }
});

// AI 서비스 삭제
router.delete('/:id', async (req, res) => {
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
        'UPDATE ai_services SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'AI 서비스를 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        message: 'AI 서비스가 삭제되었습니다.'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting AI service:', error);
    res.status(500).json({
      success: false,
      error: 'AI 서비스 삭제 중 오류가 발생했습니다.'
    });
  }
});

// AI 서비스 검색
router.get('/search', async (req, res) => {
  try {
    const q = req.query['q'] as string;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: '검색어가 필요합니다.'
      });
    }

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      const [services] = await connection.execute<RowDataPacket[]>(
        `SELECT id, ai_name FROM ai_services 
         WHERE (ai_name LIKE ? OR ai_description LIKE ?) 
         AND deleted_at IS NULL AND ai_status = 'active'
         ORDER BY ai_name ASC LIMIT 20`,
        [`%${q}%`, `%${q}%`]
      );

      res.json({
        success: true,
        data: services
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error searching AI services:', error);
    res.status(500).json({
      success: false,
      error: 'AI 서비스 검색 중 오류가 발생했습니다.'
    });
  }
});

// AI 서비스 콘텐츠 조회
router.get('/:id/contents', async (req, res) => {
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
      const [contents] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM ai_service_contents WHERE ai_service_id = ? ORDER BY content_order',
        [id]
      );

      res.json(contents);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching AI service contents:', error);
    res.status(500).json({
      success: false,
      error: 'AI 서비스 콘텐츠 조회 중 오류가 발생했습니다.'
    });
  }
});

// AI 서비스 콘텐츠 저장
router.post('/:id/contents', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { content_type, content_title, content_text, content_order } = req.body;

    if (isNaN(id) || !content_type) {
      return res.status(400).json({
        success: false,
        error: 'AI 서비스 ID와 콘텐츠 타입은 필수입니다.'
      });
    }

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      // 기존 콘텐츠 삭제 후 새로 추가
      await connection.execute(
        'DELETE FROM ai_service_contents WHERE ai_service_id = ? AND content_type = ?',
        [id, content_type]
      );

      const [result] = await connection.execute<ResultSetHeader>(
        'INSERT INTO ai_service_contents (ai_service_id, content_type, content_title, content_text, content_order) VALUES (?, ?, ?, ?, ?)',
        [id, content_type, content_title || '', content_text || '', content_order || 1]
      );

      res.status(201).json({
        success: true,
        data: { id: result.insertId },
        message: '콘텐츠가 저장되었습니다.'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error saving content:', error);
    res.status(500).json({
      success: false,
      error: '콘텐츠 저장 중 오류가 발생했습니다.'
    });
  }
});



export default router;