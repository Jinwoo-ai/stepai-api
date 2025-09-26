import express from 'express';
import { getDatabaseConnection } from '../configs/database';

const router = express.Router();

// MY PICK 테이블 생성
router.post('/my-picks', async (req, res) => {
  const connection = await getDatabaseConnection().getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 사용자 관심 AI 서비스 테이블 생성
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_favorite_services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        ai_service_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_service (user_id, ai_service_id)
      )
    `);

    // 사용자 관심 영상 테이블 생성
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_favorite_videos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        ai_video_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (ai_video_id) REFERENCES ai_videos(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_video (user_id, ai_video_id)
      )
    `);

    // 인덱스 추가
    try {
      await connection.execute(`CREATE INDEX idx_user_favorite_services_user_id ON user_favorite_services(user_id)`);
    } catch (error) {
      console.log('Index already exists');
    }
    
    try {
      await connection.execute(`CREATE INDEX idx_user_favorite_videos_user_id ON user_favorite_videos(user_id)`);
    } catch (error) {
      console.log('Index already exists');
    }

    await connection.commit();
    
    res.json({
      success: true,
      message: 'MY PICK 테이블이 성공적으로 생성되었습니다.'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Database setup error:', error);
    res.status(500).json({
      success: false,
      error: 'MY PICK 테이블 생성 중 오류가 발생했습니다.',
      details: error.message
    });
  } finally {
    connection.release();
  }
});

export default router;