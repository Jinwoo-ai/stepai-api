import express from 'express';
import { RowDataPacket } from 'mysql2';
import { getDatabaseConnection } from '../configs/database';

const router = express.Router();

console.log('Simple tags router loaded!');

router.use((req, res, next) => {
  console.log(`Simple tags router: ${req.method} ${req.path}`);
  next();
});

router.get('/test', (_req, res) => {
  res.json({ success: true, message: 'Simple tags working!' });
});

router.get('/:id/items', async (req, res) => {
  console.log('Simple /:id/items hit with params:', req.params);
  
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
        `SELECT s.id, s.ai_name, s.created_at
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

      console.log(`Found ${services.length} services and ${videos.length} videos for tag ${tagId}`);

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
    res.status(500).json({
      success: false,
      error: '태그 아이템 조회 중 오류가 발생했습니다.'
    });
  }
});

export default router;