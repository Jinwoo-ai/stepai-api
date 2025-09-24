import express from 'express';
import { pool } from '../configs/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = express.Router();

/**
 * @swagger
 * /api/homepage-settings/videos:
 *   get:
 *     summary: 메인페이지 영상 설정 조회
 *     tags: [Homepage Settings]
 */
router.get('/videos', async (req, res) => {
  try {
    // homepage_videos 테이블에 데이터가 없을 수 있으므로 우선 빈 배열 반환
    const [homepageVideos] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM homepage_videos WHERE is_active = TRUE'
    );
    
    if (homepageVideos[0].count === 0) {
      // 설정된 영상이 없으면 빈 배열 반환
      return res.json({ success: true, data: [] });
    }

    const query = `
      SELECT 
        hv.id,
        hv.ai_video_id,
        hv.display_order,
        hv.is_active,
        v.video_title,
        v.video_description,
        v.thumbnail_url,
        v.duration as video_duration,
        v.view_count
      FROM homepage_videos hv
      JOIN ai_videos v ON hv.ai_video_id = v.id
      WHERE hv.is_active = TRUE AND v.video_status = 'active'
      ORDER BY hv.display_order ASC
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('메인페이지 영상 조회 실패:', error);
    res.status(500).json({ success: false, error: '메인페이지 영상 조회에 실패했습니다.' });
  }
});

/**
 * @swagger
 * /api/homepage-settings/videos:
 *   put:
 *     summary: 메인페이지 영상 설정 업데이트
 *     tags: [Homepage Settings]
 */
router.put('/videos', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { videos } = req.body;
    await connection.beginTransaction();

    // 기존 설정 삭제
    await connection.execute('DELETE FROM homepage_videos');

    // 새로운 설정 삽입
    for (const video of videos) {
      await connection.execute(
        'INSERT INTO homepage_videos (ai_video_id, display_order, is_active) VALUES (?, ?, ?)',
        [video.ai_video_id, video.display_order, video.is_active]
      );
    }

    await connection.commit();
    res.json({ success: true, message: '메인페이지 영상 설정이 업데이트되었습니다.' });
  } catch (error) {
    await connection.rollback();
    console.error('메인페이지 영상 설정 실패:', error);
    res.status(500).json({ success: false, error: '메인페이지 영상 설정에 실패했습니다.' });
  } finally {
    connection.release();
  }
});

/**
 * @swagger
 * /api/homepage-settings/curations:
 *   get:
 *     summary: 메인페이지 큐레이션 설정 조회
 *     tags: [Homepage Settings]
 */
router.get('/curations', async (req, res) => {
  try {
    const query = `
      SELECT 
        hc.id,
        hc.curation_id,
        hc.display_order,
        hc.is_active,
        c.curation_title,
        c.curation_description,
        c.curation_thumbnail
      FROM homepage_curations hc
      JOIN curations c ON hc.curation_id = c.id
      WHERE hc.is_active = TRUE
      ORDER BY hc.display_order ASC
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('메인페이지 큐레이션 조회 실패:', error);
    res.status(500).json({ success: false, error: '메인페이지 큐레이션 조회에 실패했습니다.' });
  }
});

/**
 * @swagger
 * /api/homepage-settings/curations:
 *   put:
 *     summary: 메인페이지 큐레이션 설정 업데이트
 *     tags: [Homepage Settings]
 */
router.put('/curations', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { curations } = req.body;
    await connection.beginTransaction();

    await connection.execute('DELETE FROM homepage_curations');

    for (const curation of curations) {
      await connection.execute(
        'INSERT INTO homepage_curations (curation_id, display_order, is_active) VALUES (?, ?, ?)',
        [curation.curation_id, curation.display_order, curation.is_active]
      );
    }

    await connection.commit();
    res.json({ success: true, message: '메인페이지 큐레이션 설정이 업데이트되었습니다.' });
  } catch (error) {
    await connection.rollback();
    console.error('메인페이지 큐레이션 설정 실패:', error);
    res.status(500).json({ success: false, error: '메인페이지 큐레이션 설정에 실패했습니다.' });
  } finally {
    connection.release();
  }
});

/**
 * @swagger
 * /api/homepage-settings/step-pick:
 *   get:
 *     summary: 메인페이지 STEP PICK 설정 조회
 *     tags: [Homepage Settings]
 */
router.get('/step-pick', async (req, res) => {
  try {
    const query = `
      SELECT 
        hsp.id,
        hsp.ai_service_id,
        hsp.display_order,
        hsp.is_active,
        ais.ai_name,
        ais.ai_description,
        ais.ai_logo,
        ais.company_name
      FROM homepage_step_pick_services hsp
      JOIN ai_services ais ON hsp.ai_service_id = ais.id
      WHERE hsp.is_active = TRUE
      ORDER BY hsp.display_order ASC
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('메인페이지 STEP PICK 조회 실패:', error);
    res.status(500).json({ success: false, error: '메인페이지 STEP PICK 조회에 실패했습니다.' });
  }
});

/**
 * @swagger
 * /api/homepage-settings/step-pick:
 *   put:
 *     summary: 메인페이지 STEP PICK 설정 업데이트
 *     tags: [Homepage Settings]
 */
router.put('/step-pick', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { services } = req.body;
    await connection.beginTransaction();

    await connection.execute('DELETE FROM homepage_step_pick_services');

    for (const service of services) {
      await connection.execute(
        'INSERT INTO homepage_step_pick_services (ai_service_id, display_order, is_active) VALUES (?, ?, ?)',
        [service.ai_service_id, service.display_order, service.is_active]
      );
    }

    await connection.commit();
    res.json({ success: true, message: '메인페이지 STEP PICK 설정이 업데이트되었습니다.' });
  } catch (error) {
    await connection.rollback();
    console.error('메인페이지 STEP PICK 설정 실패:', error);
    res.status(500).json({ success: false, error: '메인페이지 STEP PICK 설정에 실패했습니다.' });
  } finally {
    connection.release();
  }
});

/**
 * @swagger
 * /api/homepage-settings/trends:
 *   get:
 *     summary: 트렌드 섹션 목록 조회
 *     tags: [Homepage Settings]
 */
router.get('/trends', async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        section_type,
        section_title,
        section_description,
        is_active,
        display_order
      FROM trend_sections
      ORDER BY display_order ASC
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('트렌드 섹션 조회 실패:', error);
    res.status(500).json({ success: false, error: '트렌드 섹션 조회에 실패했습니다.' });
  }
});

/**
 * @swagger
 * /api/homepage-settings/trends/{sectionId}/services:
 *   get:
 *     summary: 트렌드 섹션별 서비스 조회
 *     tags: [Homepage Settings]
 */
router.get('/trends/:sectionId/services', async (req, res) => {
  try {
    const sectionId = parseInt(req.params.sectionId);
    const query = `
      SELECT 
        tss.id,
        tss.ai_service_id,
        tss.display_order,
        tss.is_featured,
        tss.is_active,
        ais.ai_name,
        ais.ai_description,
        ais.ai_logo,
        ais.company_name,
        ais.is_step_pick
      FROM trend_section_services tss
      JOIN ai_services ais ON tss.ai_service_id = ais.id
      WHERE tss.trend_section_id = ? AND tss.is_active = TRUE
      ORDER BY tss.is_featured DESC, tss.display_order ASC
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query, [sectionId]);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('트렌드 섹션 서비스 조회 실패:', error);
    res.status(500).json({ success: false, error: '트렌드 섹션 서비스 조회에 실패했습니다.' });
  }
});

/**
 * @swagger
 * /api/homepage-settings/trends/{sectionId}/services:
 *   put:
 *     summary: 트렌드 섹션별 서비스 설정 업데이트
 *     tags: [Homepage Settings]
 */
router.put('/trends/:sectionId/services', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const sectionId = parseInt(req.params.sectionId);
    const { services } = req.body;
    
    await connection.beginTransaction();

    await connection.execute('DELETE FROM trend_section_services WHERE trend_section_id = ?', [sectionId]);

    for (const service of services) {
      await connection.execute(
        'INSERT INTO trend_section_services (trend_section_id, ai_service_id, display_order, is_featured, is_active) VALUES (?, ?, ?, ?, ?)',
        [sectionId, service.ai_service_id, service.display_order, service.is_featured, service.is_active]
      );
    }

    await connection.commit();
    res.json({ success: true, message: '트렌드 섹션 서비스 설정이 업데이트되었습니다.' });
  } catch (error) {
    await connection.rollback();
    console.error('트렌드 섹션 서비스 설정 실패:', error);
    res.status(500).json({ success: false, error: '트렌드 섹션 서비스 설정에 실패했습니다.' });
  } finally {
    connection.release();
  }
});

/**
 * @swagger
 * /api/homepage-settings/available-videos:
 *   get:
 *     summary: 추가 가능한 영상 목록 조회
 *     tags: [Homepage Settings]
 */
router.get('/available-videos', async (req, res) => {
  try {
    const search = req.query.search as string || '';
    const limit = parseInt(req.query.limit as string) || 50;

    let query = `
      SELECT 
        v.id,
        v.video_title,
        v.video_description,
        v.thumbnail_url,
        v.duration as video_duration,
        v.view_count
      FROM ai_videos v
      WHERE v.video_status = 'active' AND v.is_visible = TRUE
    `;

    const params: any[] = [];

    if (search) {
      query += ` AND (v.video_title LIKE ? OR v.video_description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY v.created_at DESC LIMIT ?`;
    params.push(limit);

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('사용 가능한 영상 조회 실패:', error);
    res.status(500).json({ success: false, error: '사용 가능한 영상 조회에 실패했습니다.' });
  }
});

/**
 * @swagger
 * /api/homepage-settings/available-curations:
 *   get:
 *     summary: 추가 가능한 큐레이션 목록 조회
 *     tags: [Homepage Settings]
 */
router.get('/available-curations', async (req, res) => {
  try {
    const search = req.query.search as string || '';
    const limit = parseInt(req.query.limit as string) || 50;

    let query = `
      SELECT 
        c.id,
        c.curation_title,
        c.curation_description,
        c.curation_thumbnail
      FROM curations c
      WHERE c.curation_status = 'active'
        AND c.id NOT IN (SELECT curation_id FROM homepage_curations WHERE is_active = TRUE)
    `;

    const params: any[] = [];

    if (search) {
      query += ` AND (c.curation_title LIKE ? OR c.curation_description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY c.created_at DESC LIMIT ?`;
    params.push(limit);

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('사용 가능한 큐레이션 조회 실패:', error);
    res.status(500).json({ success: false, error: '사용 가능한 큐레이션 조회에 실패했습니다.' });
  }
});

/**
 * @swagger
 * /api/homepage-settings/available-services:
 *   get:
 *     summary: 추가 가능한 AI 서비스 목록 조회
 *     tags: [Homepage Settings]
 */
router.get('/available-services', async (req, res) => {
  try {
    const search = req.query.search as string || '';
    const sectionId = req.query.section_id as string;
    const limit = parseInt(req.query.limit as string) || 50;

    let query = `
      SELECT 
        ais.id,
        ais.ai_name,
        ais.ai_description,
        ais.ai_logo,
        ais.company_name,
        ais.is_step_pick
      FROM ai_services ais
      WHERE ais.ai_status = 'active'
    `;

    const params: any[] = [];

    if (sectionId) {
      query += ` AND ais.id NOT IN (SELECT ai_service_id FROM trend_section_services WHERE trend_section_id = ? AND is_active = TRUE)`;
      params.push(sectionId);
    }

    if (search) {
      query += ` AND (ais.ai_name LIKE ? OR ais.ai_description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY ais.ai_name ASC LIMIT ?`;
    params.push(limit);

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('사용 가능한 서비스 조회 실패:', error);
    res.status(500).json({ success: false, error: '사용 가능한 서비스 조회에 실패했습니다.' });
  }
});

export default router;