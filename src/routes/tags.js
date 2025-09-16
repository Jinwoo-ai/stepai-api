const express = require('express');
const { getDatabaseConnection } = require('../configs/database');

const router = express.Router();

// 테스트 엔드포인트
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Tags API is working!' });
});

// 태그 목록 조회
router.get('/', async (req, res) => {
  try {
    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      const [tags] = await connection.execute(
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
    res.status(500).json({
      success: false,
      error: '태그 조회 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;