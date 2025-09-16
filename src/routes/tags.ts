import express from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getDatabaseConnection } from '../configs/database';

const router = express.Router();

// 테스트 엔드포인트
router.get('/test', (_req, res) => {
  res.json({ success: true, message: 'Tags API is working!' });
});

// 태그 목록 조회
router.get('/', async (_req, res) => {
  try {
    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      const [tags] = await connection.execute<RowDataPacket[]>(
        `SELECT t.*, 
                COUNT(DISTINCT ast.ai_service_id) as service_count,
                COUNT(DISTINCT avt.ai_video_id) as video_count
         FROM tags t
         LEFT JOIN ai_service_tags ast ON t.id = ast.tag_id
         LEFT JOIN ai_video_tags avt ON t.id = avt.tag_id
         GROUP BY t.id
         ORDER BY t.tag_count DESC, t.tag_name ASC`
      );

      res.json({
        success: true,
        data: tags
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching tags:', error);
    return res.status(500).json({
      success: false,
      error: '태그 조회 중 오류가 발생했습니다.'
    });
  }
});

// 특정 태그의 AI 서비스/비디오 목록 조회
router.get('/:id/items', async (req, res) => {
  try {
    const tagId = parseInt(req.params.id);
    
    if (isNaN(tagId)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 태그 ID입니다.'
      });
    }

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      // AI 서비스 목록
      const [services] = await connection.execute<RowDataPacket[]>(
        `SELECT s.id, s.ai_name, s.ai_type, s.created_at
         FROM ai_services s
         INNER JOIN ai_service_tags ast ON s.id = ast.ai_service_id
         WHERE ast.tag_id = ? AND s.deleted_at IS NULL
         ORDER BY s.ai_name`,
        [tagId]
      );

      // AI 비디오 목록
      const [videos] = await connection.execute<RowDataPacket[]>(
        `SELECT v.id, v.video_title, v.created_at
         FROM ai_videos v
         INNER JOIN ai_video_tags avt ON v.id = avt.ai_video_id
         WHERE avt.tag_id = ? AND v.deleted_at IS NULL
         ORDER BY v.video_title`,
        [tagId]
      );

      res.json({
        success: true,
        data: {
          services,
          videos
        }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching tag items:', error);
    return res.status(500).json({
      success: false,
      error: '태그 아이템 조회 중 오류가 발생했습니다.'
    });
  }
});

// 태그에서 AI 서비스 제거
router.delete('/:tagId/services/:serviceId', async (req, res) => {
  try {
    const tagId = parseInt(req.params.tagId);
    const serviceId = parseInt(req.params.serviceId);

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      await connection.execute(
        'DELETE FROM ai_service_tags WHERE tag_id = ? AND ai_service_id = ?',
        [tagId, serviceId]
      );

      // 태그 사용 횟수 업데이트
      await connection.execute(
        `UPDATE tags SET tag_count = (
          SELECT COUNT(*) FROM (
            SELECT 1 FROM ai_service_tags WHERE tag_id = ?
            UNION ALL
            SELECT 1 FROM ai_video_tags WHERE tag_id = ?
          ) as counts
        ) WHERE id = ?`,
        [tagId, tagId, tagId]
      );

      res.json({
        success: true,
        message: '태그에서 AI 서비스가 제거되었습니다.'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error removing service from tag:', error);
    return res.status(500).json({
      success: false,
      error: '태그에서 서비스 제거 중 오류가 발생했습니다.'
    });
  }
});

// 태그 생성
router.post('/', async (req, res) => {
  try {
    const { tag_name } = req.body;
    
    if (!tag_name || !tag_name.trim()) {
      return res.status(400).json({
        success: false,
        error: '태그명은 필수입니다.'
      });
    }

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      const [result] = await connection.execute<ResultSetHeader>(
        'INSERT INTO tags (tag_name, tag_count) VALUES (?, 0)',
        [tag_name.trim()]
      );

      res.status(201).json({
        success: true,
        data: { id: result.insertId },
        message: '태그가 생성되었습니다.'
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Error creating tag:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        error: '이미 존재하는 태그입니다.'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: '태그 생성 중 오류가 발생했습니다.'
      });
    }
  }
});

// 태그 수정
router.put('/:id', async (req, res) => {
  try {
    const tagId = parseInt(req.params.id);
    const { tag_name } = req.body;
    
    if (isNaN(tagId)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 태그 ID입니다.'
      });
    }
    
    if (!tag_name || !tag_name.trim()) {
      return res.status(400).json({
        success: false,
        error: '태그명은 필수입니다.'
      });
    }

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      const [result] = await connection.execute<ResultSetHeader>(
        'UPDATE tags SET tag_name = ? WHERE id = ?',
        [tag_name.trim(), tagId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: '태그를 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        message: '태그가 수정되었습니다.'
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Error updating tag:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        error: '이미 존재하는 태그입니다.'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: '태그 수정 중 오류가 발생했습니다.'
      });
    }
  }
});

// 태그 삭제
router.delete('/:id', async (req, res) => {
  try {
    const tagId = parseInt(req.params.id);
    
    if (isNaN(tagId)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 태그 ID입니다.'
      });
    }

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 관련 연결 먼저 삭제
      await connection.execute('DELETE FROM ai_service_tags WHERE tag_id = ?', [tagId]);
      await connection.execute('DELETE FROM ai_video_tags WHERE tag_id = ?', [tagId]);
      
      // 태그 삭제
      const [result] = await connection.execute<ResultSetHeader>(
        'DELETE FROM tags WHERE id = ?',
        [tagId]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          error: '태그를 찾을 수 없습니다.'
        });
      }
      
      await connection.commit();

      res.json({
        success: true,
        message: '태그가 삭제되었습니다.'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting tag:', error);
    return res.status(500).json({
      success: false,
      error: '태그 삭제 중 오류가 발생했습니다.'
    });
  }
});

// 태그에서 AI 비디오 제거
router.delete('/:tagId/videos/:videoId', async (req, res) => {
  try {
    const tagId = parseInt(req.params.tagId);
    const videoId = parseInt(req.params.videoId);

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      await connection.execute(
        'DELETE FROM ai_video_tags WHERE tag_id = ? AND ai_video_id = ?',
        [tagId, videoId]
      );

      // 태그 사용 횟수 업데이트
      await connection.execute(
        `UPDATE tags SET tag_count = (
          SELECT COUNT(*) FROM (
            SELECT 1 FROM ai_service_tags WHERE tag_id = ?
            UNION ALL
            SELECT 1 FROM ai_video_tags WHERE tag_id = ?
          ) as counts
        ) WHERE id = ?`,
        [tagId, tagId, tagId]
      );

      res.json({
        success: true,
        message: '태그에서 AI 비디오가 제거되었습니다.'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error removing video from tag:', error);
    return res.status(500).json({
      success: false,
      error: '태그에서 비디오 제거 중 오류가 발생했습니다.'
    });
  }
});

export default router;