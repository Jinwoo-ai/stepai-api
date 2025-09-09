import express from 'express';
import { RowDataPacket } from 'mysql2';
import { getDatabaseConnection } from '../configs/database';

const router = express.Router();

// 대시보드 통계 조회
router.get('/stats', async (req, res) => {
  try {
    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      // 전체 회원 수
      const [totalUsersResult] = await connection.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL'
      );
      const totalUsers = totalUsersResult[0]?.count || 0;

      // 신규 회원 수 (최근 30일)
      const [newUsersResult] = await connection.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND deleted_at IS NULL'
      );
      const newUsers = newUsersResult[0]?.count || 0;

      // 등록된 AI 서비스 수
      const [totalAIServicesResult] = await connection.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM ai_services WHERE deleted_at IS NULL'
      );
      const totalAIServices = totalAIServicesResult[0]?.count || 0;

      // 등록된 영상 수
      const [totalVideosResult] = await connection.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM ai_videos WHERE deleted_at IS NULL'
      );
      const totalVideos = totalVideosResult[0]?.count || 0;

      // 카테고리 수
      const [totalCategoriesResult] = await connection.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM categories WHERE category_status = "active"'
      );
      const totalCategories = totalCategoriesResult[0]?.count || 0;

      // Step Pick 서비스 수
      const [stepPickServicesResult] = await connection.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM ai_services WHERE is_step_pick = TRUE AND deleted_at IS NULL'
      );
      const stepPickServices = stepPickServicesResult[0]?.count || 0;

      // 활성 서비스 수
      const [activeServicesResult] = await connection.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM ai_services WHERE ai_status = "active" AND deleted_at IS NULL'
      );
      const activeServices = activeServicesResult[0]?.count || 0;

      // 큐레이션 수
      const [totalCurationsResult] = await connection.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM curations WHERE deleted_at IS NULL'
      );
      const totalCurations = totalCurationsResult[0]?.count || 0;

      // 총 조회수 (기본값 0으로 설정)
      const totalViews = 0;

      res.json({
        totalUsers,
        newUsers,
        totalAIServices,
        totalVideos,
        totalCategories,
        totalCurations,
        stepPickServices,
        activeServices,
        totalViews
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;