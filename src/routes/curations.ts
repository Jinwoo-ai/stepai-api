import express from 'express';
import { getDatabaseConnection } from '../configs/database';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

/**
 * @swagger
 * /api/curations/{curationId}/services:
 *   get:
 *     summary: 큐레이션에 포함된 AI 서비스 목록 조회
 *     tags: [Curations]
 */
router.get('/:curationId/services', async (req, res) => {
  try {
    const curationId = parseInt(req.params.curationId);
    
    if (isNaN(curationId)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 큐레이션 ID입니다.'
      });
    }

    const pool = getDatabaseConnection();
    const query = `
      SELECT 
        cas.id,
        cas.ai_service_id,
        cas.service_order,
        ais.ai_name,
        ais.ai_description,
        ais.ai_logo,
        ais.company_name,
        ais.pricing_info,
        ais.difficulty_level,
        ais.is_step_pick
      FROM curation_ai_services cas
      JOIN ai_services ais ON cas.ai_service_id = ais.id
      WHERE cas.curation_id = ? AND ais.ai_status = 'active'
      ORDER BY cas.service_order ASC
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query, [curationId]);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('큐레이션 서비스 조회 실패:', error);
    res.status(500).json({ success: false, error: '큐레이션 서비스 조회에 실패했습니다.' });
  }
});

export default router;