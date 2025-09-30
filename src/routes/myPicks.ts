import express from 'express';
import { getDatabaseConnection } from '../configs/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = express.Router();

// 사용자 관심 AI 서비스 목록 조회
router.get('/services', async (req, res) => {
  try {
    const userId = req.headers['user-id'] as string;
    if (!userId) {
      return res.status(401).json({ success: false, error: '로그인이 필요합니다.' });
    }

    const pool = getDatabaseConnection();
    const query = `
      SELECT 
        ufs.id,
        ufs.ai_service_id,
        ufs.created_at,
        ais.ai_name,
        ais.ai_description,
        ais.ai_logo,
        ais.company_name,
        ais.is_step_pick,
        ais.is_new
      FROM user_favorite_services ufs
      JOIN ai_services ais ON ufs.ai_service_id = ais.id
      WHERE ufs.user_id = ? AND ais.ai_status = 'active'
      ORDER BY ufs.created_at DESC
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query, [userId]);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('관심 서비스 조회 실패:', error);
    res.status(500).json({ success: false, error: '관심 서비스 조회에 실패했습니다.' });
  }
});

// AI 서비스 관심 등록
router.post('/services/:serviceId', async (req, res) => {
  try {
    const userId = req.headers['user-id'] as string;
    const serviceId = parseInt(req.params.serviceId);

    if (!userId) {
      return res.status(401).json({ success: false, error: '로그인이 필요합니다.' });
    }

    if (!serviceId || isNaN(serviceId)) {
      return res.status(400).json({ success: false, error: '유효하지 않은 서비스 ID입니다.' });
    }

    const pool = getDatabaseConnection();
    
    // AI 서비스가 존재하는지 확인
    const [serviceExists] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM ai_services WHERE id = ? AND ai_status = "active"',
      [serviceId]
    );

    if (serviceExists.length === 0) {
      return res.status(404).json({ success: false, error: '존재하지 않는 AI 서비스입니다.' });
    }
    
    // 이미 등록되어 있는지 확인
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM user_favorite_services WHERE user_id = ? AND ai_service_id = ?',
      [userId, serviceId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: '이미 관심 등록된 서비스입니다.' });
    }

    // 관심 등록
    await pool.execute(
      'INSERT INTO user_favorite_services (user_id, ai_service_id) VALUES (?, ?)',
      [userId, serviceId]
    );

    res.json({ success: true, message: '관심 서비스로 등록되었습니다.' });
  } catch (error) {
    console.error('관심 서비스 등록 실패:', error);
    res.status(500).json({ success: false, error: '관심 서비스 등록에 실패했습니다.' });
  }
});

// AI 서비스 관심 해제
router.delete('/services/:serviceId', async (req, res) => {
  try {
    const userId = req.headers['user-id'] as string;
    const serviceId = parseInt(req.params.serviceId);

    if (!userId) {
      return res.status(401).json({ success: false, error: '로그인이 필요합니다.' });
    }

    if (!serviceId || isNaN(serviceId)) {
      return res.status(400).json({ success: false, error: '유효하지 않은 서비스 ID입니다.' });
    }

    const pool = getDatabaseConnection();
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM user_favorite_services WHERE user_id = ? AND ai_service_id = ?',
      [userId, serviceId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: '관심 등록되지 않은 서비스입니다.' });
    }

    res.json({ success: true, message: '관심 서비스에서 제거되었습니다.' });
  } catch (error) {
    console.error('관심 서비스 해제 실패:', error);
    res.status(500).json({ success: false, error: '관심 서비스 해제에 실패했습니다.' });
  }
});

// 사용자 관심 영상 목록 조회
router.get('/videos', async (req, res) => {
  try {
    const userId = req.headers['user-id'] as string;
    if (!userId) {
      return res.status(401).json({ success: false, error: '로그인이 필요합니다.' });
    }

    const pool = getDatabaseConnection();
    const query = `
      SELECT 
        ufv.id,
        ufv.ai_video_id,
        ufv.created_at,
        av.video_title,
        av.video_description,
        av.thumbnail_url,
        av.duration as video_duration,
        av.view_count
      FROM user_favorite_videos ufv
      JOIN ai_videos av ON ufv.ai_video_id = av.id
      WHERE ufv.user_id = ? AND av.video_status = 'active'
      ORDER BY ufv.created_at DESC
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query, [userId]);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('관심 영상 조회 실패:', error);
    res.status(500).json({ success: false, error: '관심 영상 조회에 실패했습니다.' });
  }
});

// 영상 관심 등록
router.post('/videos/:videoId', async (req, res) => {
  try {
    const userId = req.headers['user-id'] as string;
    const videoId = parseInt(req.params.videoId);

    if (!userId) {
      return res.status(401).json({ success: false, error: '로그인이 필요합니다.' });
    }

    if (!videoId || isNaN(videoId)) {
      return res.status(400).json({ success: false, error: '유효하지 않은 영상 ID입니다.' });
    }

    const pool = getDatabaseConnection();
    
    // AI 영상이 존재하는지 확인
    const [videoExists] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM ai_videos WHERE id = ? AND video_status = "active"',
      [videoId]
    );

    if (videoExists.length === 0) {
      return res.status(404).json({ success: false, error: '존재하지 않는 AI 영상입니다.' });
    }
    
    // 이미 등록되어 있는지 확인
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM user_favorite_videos WHERE user_id = ? AND ai_video_id = ?',
      [userId, videoId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: '이미 관심 등록된 영상입니다.' });
    }

    // 관심 등록
    await pool.execute(
      'INSERT INTO user_favorite_videos (user_id, ai_video_id) VALUES (?, ?)',
      [userId, videoId]
    );

    res.json({ success: true, message: '관심 영상으로 등록되었습니다.' });
  } catch (error) {
    console.error('관심 영상 등록 실패:', error);
    res.status(500).json({ success: false, error: '관심 영상 등록에 실패했습니다.' });
  }
});

// 영상 관심 해제
router.delete('/videos/:videoId', async (req, res) => {
  try {
    const userId = req.headers['user-id'] as string;
    const videoId = parseInt(req.params.videoId);

    if (!userId) {
      return res.status(401).json({ success: false, error: '로그인이 필요합니다.' });
    }

    if (!videoId || isNaN(videoId)) {
      return res.status(400).json({ success: false, error: '유효하지 않은 영상 ID입니다.' });
    }

    const pool = getDatabaseConnection();
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM user_favorite_videos WHERE user_id = ? AND ai_video_id = ?',
      [userId, videoId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: '관심 등록되지 않은 영상입니다.' });
    }

    res.json({ success: true, message: '관심 영상에서 제거되었습니다.' });
  } catch (error) {
    console.error('관심 영상 해제 실패:', error);
    res.status(500).json({ success: false, error: '관심 영상 해제에 실패했습니다.' });
  }
});

// 통합 관심 목록 조회
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['user-id'] as string;
    if (!userId) {
      return res.status(401).json({ success: false, error: '로그인이 필요합니다.' });
    }

    const pool = getDatabaseConnection();
    
    // 관심 서비스 조회
    const servicesQuery = `
      SELECT 
        'service' as type,
        ufs.ai_service_id as item_id,
        ufs.created_at,
        ais.ai_name as title,
        ais.ai_description as description,
        ais.ai_logo as image_url,
        ais.company_name
      FROM user_favorite_services ufs
      JOIN ai_services ais ON ufs.ai_service_id = ais.id
      WHERE ufs.user_id = ? AND ais.ai_status = 'active'
    `;

    // 관심 영상 조회
    const videosQuery = `
      SELECT 
        'video' as type,
        ufv.ai_video_id as item_id,
        ufv.created_at,
        av.video_title as title,
        av.video_description as description,
        av.thumbnail_url as image_url,
        NULL as company_name
      FROM user_favorite_videos ufv
      JOIN ai_videos av ON ufv.ai_video_id = av.id
      WHERE ufv.user_id = ? AND av.video_status = 'active'
    `;

    const [services] = await pool.execute<RowDataPacket[]>(servicesQuery, [userId]);
    const [videos] = await pool.execute<RowDataPacket[]>(videosQuery, [userId]);

    // 통합하여 최신순 정렬
    const allItems = [...services, ...videos].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    res.json({ 
      success: true, 
      data: {
        services: services,
        videos: videos,
        all: allItems
      }
    });
  } catch (error) {
    console.error('관심 목록 조회 실패:', error);
    res.status(500).json({ success: false, error: '관심 목록 조회에 실패했습니다.' });
  }
});

export default router;