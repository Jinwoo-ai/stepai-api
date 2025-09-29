import express from 'express';
import { getDatabaseConnection } from '../configs/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { authenticateAdmin, AdminAuthenticatedRequest } from '../middleware/adminAuth';

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
    const pool = getDatabaseConnection();
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
router.put('/videos', authenticateAdmin, async (req: AdminAuthenticatedRequest, res) => {
  const pool = getDatabaseConnection();
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
    const pool = getDatabaseConnection();
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
router.put('/curations', authenticateAdmin, async (req: AdminAuthenticatedRequest, res) => {
  const pool = getDatabaseConnection();
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
 *     summary: 메인페이지 STEP PICK 설정 조회 (카테고리별)
 *     tags: [Homepage Settings]
 */
router.get('/step-pick', async (req, res) => {
  try {
    const pool = getDatabaseConnection();
    const categoryId = req.query.category_id as string;
    
    // 로그인된 사용자 ID 추출
    let userId = null;
    if (req.headers.authorization) {
      const token = req.headers.authorization.replace('Bearer ', '');
      if (!isNaN(parseInt(token))) {
        userId = parseInt(token);
      }
    }
    
    let query = `
      SELECT 
        hsp.id,
        hsp.ai_service_id,
        hsp.category_id,
        hsp.display_order,
        hsp.is_active,
        ais.ai_name,
        COALESCE(ais.ai_name_en, '') as ai_name_en,
        ais.ai_description,
        ais.ai_logo,
        ais.company_name,
        c.category_name`;
    
    if (userId) {
      query += `,
        CASE WHEN uf.id IS NOT NULL THEN true ELSE false END as is_bookmarked`;
    }
    
    query += `
      FROM homepage_step_pick_services hsp
      JOIN ai_services ais ON hsp.ai_service_id = ais.id
      LEFT JOIN categories c ON hsp.category_id = c.id`;
    
    if (userId) {
      query += `
      LEFT JOIN user_favorite_services uf ON ais.id = uf.ai_service_id AND uf.user_id = ?`;
    }
    
    query += `
      WHERE hsp.is_active = TRUE`;
    
    const params: any[] = [];
    if (userId) {
      params.push(userId);
    }
    
    if (categoryId) {
      query += ` AND hsp.category_id = ?`;
      params.push(categoryId);
    }
    
    query += ` ORDER BY hsp.category_id ASC, hsp.display_order ASC`;

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    
    // 북마크 정보 처리
    const processedRows = rows.map(row => ({
      ...row,
      is_bookmarked: userId ? !!row.is_bookmarked : undefined
    }));
    
    res.json({ success: true, data: processedRows });
  } catch (error) {
    console.error('메인페이지 STEP PICK 조회 실패:', error);
    res.status(500).json({ success: false, error: '메인페이지 STEP PICK 조회에 실패했습니다.' });
  }
});

/**
 * @swagger
 * /api/homepage-settings/step-pick:
 *   put:
 *     summary: 메인페이지 STEP PICK 설정 업데이트 (카테고리별)
 *     tags: [Homepage Settings]
 */
router.put('/step-pick', authenticateAdmin, async (req: AdminAuthenticatedRequest, res) => {
  const pool = getDatabaseConnection();
  const connection = await pool.getConnection();
  
  try {
    const { services, category_id } = req.body;
    
    // 카테고리별 설정이므로 category_id가 필수
    if (!category_id) {
      return res.status(400).json({ 
        success: false, 
        error: '카테고리를 선택하고 편집해주세요.' 
      });
    }
    
    await connection.beginTransaction();

    // 특정 카테고리의 기존 설정만 삭제
    await connection.execute('DELETE FROM homepage_step_pick_services WHERE category_id = ?', [category_id]);

    // UPSERT 방식으로 데이터 삽입
    for (const service of services) {
      await connection.execute(
        `INSERT INTO homepage_step_pick_services (ai_service_id, category_id, display_order, is_active) 
         VALUES (?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE 
         category_id = VALUES(category_id), 
         display_order = VALUES(display_order), 
         is_active = VALUES(is_active)`,
        [service.ai_service_id, category_id, service.display_order, service.is_active]
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
    const pool = getDatabaseConnection();
    const query = `
      SELECT 
        id,
        section_type,
        section_title,
        section_description,
        is_category_based,
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
 * /api/homepage-settings/trends:
 *   put:
 *     summary: 트렌드 섹션 설정 업데이트
 *     tags: [Homepage Settings]
 */
router.put('/trends', authenticateAdmin, async (req: AdminAuthenticatedRequest, res) => {
  const pool = getDatabaseConnection();
  const connection = await pool.getConnection();
  
  try {
    const { sections } = req.body;
    await connection.beginTransaction();

    for (const section of sections) {
      if (section.id) {
        // 기존 섹션 업데이트
        await connection.execute(
          'UPDATE trend_sections SET section_title = ?, section_description = ?, is_category_based = ?, is_active = ?, display_order = ? WHERE id = ?',
          [
            section.section_title, 
            section.section_description, 
            section.is_category_based !== undefined ? section.is_category_based : true, 
            section.is_active, 
            section.display_order, 
            section.id
          ]
        );
      } else {
        // 새 섹션 생성
        await connection.execute(
          'INSERT INTO trend_sections (section_type, section_title, section_description, is_category_based, is_active, display_order) VALUES (?, ?, ?, ?, ?, ?)',
          [
            section.section_type, 
            section.section_title, 
            section.section_description, 
            section.is_category_based !== undefined ? section.is_category_based : true, 
            section.is_active, 
            section.display_order
          ]
        );
      }
    }

    await connection.commit();
    res.json({ success: true, message: '트렌드 섹션 설정이 업데이트되었습니다.' });
  } catch (error) {
    await connection.rollback();
    console.error('트렌드 섹션 설정 실패:', error);
    res.status(500).json({ success: false, error: '트렌드 섹션 설정에 실패했습니다.' });
  } finally {
    connection.release();
  }
});

/**
 * @swagger
 * /api/homepage-settings/trends/{sectionId}:
 *   delete:
 *     summary: 트렌드 섹션 삭제
 *     tags: [Homepage Settings]
 */
router.delete('/trends/:sectionId', authenticateAdmin, async (req: AdminAuthenticatedRequest, res) => {
  const pool = getDatabaseConnection();
  const connection = await pool.getConnection();
  
  try {
    const sectionId = parseInt(req.params.sectionId);
    await connection.beginTransaction();

    // 관련 서비스들 먼저 삭제
    await connection.execute('DELETE FROM trend_section_services WHERE trend_section_id = ?', [sectionId]);
    
    // 섹션 삭제
    await connection.execute('DELETE FROM trend_sections WHERE id = ?', [sectionId]);

    await connection.commit();
    res.json({ success: true, message: '트렌드 섹션이 삭제되었습니다.' });
  } catch (error) {
    await connection.rollback();
    console.error('트렌드 섹션 삭제 실패:', error);
    res.status(500).json({ success: false, error: '트렌드 섹션 삭제에 실패했습니다.' });
  } finally {
    connection.release();
  }
});

/**
 * @swagger
 * /api/homepage-settings/trends/{sectionId}/services:
 *   get:
 *     summary: 트렌드 섹션별 서비스 조회 (카테고리별 지원)
 *     tags: [Homepage Settings]
 */
router.get('/trends/:sectionId/services', async (req, res) => {
  try {
    const pool = getDatabaseConnection();
    const sectionId = parseInt(req.params.sectionId);
    const categoryId = req.query.category_id as string;
    // Authorization 헤더에서 사용자 ID 추출 (실제로는 토큰 검증 로직 필요)
    let userId = null;
    if (req.headers.authorization) {
      const token = req.headers.authorization.replace('Bearer ', '');
      // 실제 구현에서는 토큰을 검증하고 사용자 ID를 추출해야 함
      // 여기서는 간단히 숫자인 경우만 처리
      if (!isNaN(parseInt(token))) {
        userId = parseInt(token);
      }
    }
    
    let query = `
      SELECT 
        tss.id,
        tss.ai_service_id,
        tss.category_id,
        tss.display_order,
        tss.is_featured,
        tss.is_active,
        ais.ai_name,
        COALESCE(ais.ai_name_en, '') as ai_name_en,
        ais.ai_description,
        ais.ai_logo,
        ais.company_name,
        ais.is_step_pick,
        ais.created_at,
        ais.is_new,
        c.category_name,
        mc.id as main_category_id,
        mc.category_name as main_category_name,
        GROUP_CONCAT(DISTINCT t.tag_name) as tags
    `;
    
    // 로그인된 유저인 경우 북마크 정보 추가
    if (userId) {
      query += `,
        CASE WHEN uf.id IS NOT NULL THEN true ELSE false END as is_bookmarked`;
    }
    
    query += `
      FROM trend_section_services tss
      JOIN ai_services ais ON tss.ai_service_id = ais.id
      LEFT JOIN categories c ON tss.category_id = c.id
      LEFT JOIN ai_service_categories ascat ON ais.id = ascat.ai_service_id AND ascat.is_main_category = 1
      LEFT JOIN categories mc ON ascat.category_id = mc.id
      LEFT JOIN ai_service_tags ast ON ais.id = ast.ai_service_id
      LEFT JOIN tags t ON ast.tag_id = t.id
    `;
    
    // 로그인된 유저인 경우 user_favorite_services 테이블 조인
    if (userId) {
      query += `
      LEFT JOIN user_favorite_services uf ON ais.id = uf.ai_service_id AND uf.user_id = ?
      `;
    }
    
    query += `
      WHERE tss.trend_section_id = ? AND tss.is_active = TRUE
    `;
    
    const params: any[] = [];
    if (userId) {
      params.push(userId);
    }
    params.push(sectionId);
    
    if (categoryId) {
      query += ` AND tss.category_id = ?`;
      params.push(categoryId);
    }
    
    query += `
      GROUP BY tss.id, tss.ai_service_id, tss.category_id, tss.display_order, tss.is_featured, tss.is_active, 
               ais.ai_name, ais.ai_description, ais.ai_logo, ais.company_name, ais.is_step_pick, ais.is_new, 
               c.category_name, mc.id, mc.category_name`;
    
    if (userId) {
      query += `, uf.id`;
    }
    
    query += `
      ORDER BY tss.category_id ASC, tss.is_featured DESC, tss.display_order ASC
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    
    // 각 서비스의 모든 카테고리 정보 조회 및 처리
    const processedRows = [];
    for (const row of rows) {
      const [allCategories] = await pool.execute<RowDataPacket[]>(
        `SELECT c.id, c.category_name, ascat.is_main_category
         FROM ai_service_categories ascat
         INNER JOIN categories c ON ascat.category_id = c.id
         WHERE ascat.ai_service_id = ?
         ORDER BY ascat.is_main_category DESC, c.category_name`,
        [row.ai_service_id]
      );
      
      processedRows.push({
        ...row,
        category_id: row.main_category_id,
        category_name: row.main_category_name,
        categories: allCategories,
        tags: row.tags ? row.tags.split(',') : [],
        is_new: !!row.is_new,
        is_bookmarked: userId ? !!row.is_bookmarked : undefined,
        created_at: undefined // 클라이언트에서는 숨김
      });
    }
    
    res.json({ success: true, data: processedRows });
  } catch (error) {
    console.error('트렌드 섹션 서비스 조회 실패:', error);
    res.status(500).json({ success: false, error: '트렌드 섹션 서비스 조회에 실패했습니다.' });
  }
});

/**
 * @swagger
 * /api/homepage-settings/trends/{sectionId}/services:
 *   put:
 *     summary: 트렌드 섹션별 서비스 설정 업데이트 (카테고리별 지원)
 *     tags: [Homepage Settings]
 */
router.put('/trends/:sectionId/services', authenticateAdmin, async (req: AdminAuthenticatedRequest, res) => {
  const pool = getDatabaseConnection();
  const connection = await pool.getConnection();
  
  try {
    const sectionId = parseInt(req.params.sectionId);
    const { services, category_id } = req.body;
    
    // 트렌드 섹션이 카테고리 기반인지 확인
    const [sectionInfo] = await pool.execute<RowDataPacket[]>(
      'SELECT is_category_based FROM trend_sections WHERE id = ?',
      [sectionId]
    );
    
    if (sectionInfo.length > 0 && sectionInfo[0].is_category_based && !category_id) {
      return res.status(400).json({ 
        success: false, 
        error: '카테고리를 선택하고 편집해주세요.' 
      });
    }
    
    await connection.beginTransaction();

    // 특정 카테고리의 기존 설정만 삭제
    if (category_id) {
      await connection.execute('DELETE FROM trend_section_services WHERE trend_section_id = ? AND category_id = ?', [sectionId, category_id]);
    } else {
      await connection.execute('DELETE FROM trend_section_services WHERE trend_section_id = ? AND category_id IS NULL', [sectionId]);
    }

    for (const service of services) {
      await connection.execute(
        'INSERT INTO trend_section_services (trend_section_id, ai_service_id, category_id, display_order, is_featured, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [sectionId, service.ai_service_id, category_id || null, service.display_order, service.is_featured, service.is_active]
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
    const pool = getDatabaseConnection();
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
    const pool = getDatabaseConnection();
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
    const pool = getDatabaseConnection();
    const search = req.query.search as string || '';
    const sectionId = req.query.section_id as string;
    const categoryId = req.query.category_id as string;
    const isStepPick = req.query.is_step_pick as string;
    const limit = parseInt(req.query.limit as string) || 50;

    let query = `
      SELECT 
        ais.id,
        ais.ai_name,
        COALESCE(ais.ai_name_en, '') as ai_name_en,
        ais.ai_description,
        ais.ai_logo,
        ais.company_name,
        ais.is_step_pick,
        ais.is_new
      FROM ai_services ais
      WHERE ais.ai_status = 'active'
    `;

    const params: any[] = [];

    if (sectionId && categoryId) {
      query += ` AND ais.id NOT IN (SELECT ai_service_id FROM trend_section_services WHERE trend_section_id = ? AND category_id = ? AND is_active = TRUE)`;
      params.push(sectionId, categoryId);
    } else if (sectionId) {
      query += ` AND ais.id NOT IN (SELECT ai_service_id FROM trend_section_services WHERE trend_section_id = ? AND is_active = TRUE)`;
      params.push(sectionId);
    }

    // 카테고리별 필터링
    if (categoryId) {
      query += ` AND ais.id IN (SELECT ai_service_id FROM ai_service_categories WHERE category_id = ? AND is_main_category = TRUE)`;
      params.push(categoryId);
    }

    // STEP PICK 필터 추가
    if (isStepPick === 'true') {
      query += ` AND ais.is_step_pick = TRUE`;
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

/**
 * @swagger
 * /api/homepage-settings:
 *   get:
 *     summary: 메인페이지 전체 설정 조회 (videos, curations, step-pick 포함)
 *     tags: [Homepage Settings]
 */
router.get('/', async (req, res) => {
  try {
    const pool = getDatabaseConnection();
    const categoryId = req.query.category_id as string;
    
    // 로그인된 사용자 ID 추출
    let userId = null;
    if (req.headers.authorization) {
      const token = req.headers.authorization.replace('Bearer ', '');
      if (!isNaN(parseInt(token))) {
        userId = parseInt(token);
      }
    }
    
    // 1. 영상 데이터 조회
    const [homepageVideosCount] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM homepage_videos WHERE is_active = TRUE'
    );
    
    let videos = [];
    if (homepageVideosCount[0].count > 0) {
      const [videosResult] = await pool.execute<RowDataPacket[]>(`
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
      `);
      videos = videosResult;
    }
    
    // 2. 큐레이션 데이터 조회
    const [curationsResult] = await pool.execute<RowDataPacket[]>(`
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
    `);
    
    // 3. STEP PICK 데이터 조회 (카테고리별 필터링 지원)
    let stepPickQuery = `
      SELECT 
        hsp.id,
        hsp.ai_service_id,
        hsp.category_id,
        hsp.display_order,
        hsp.is_active,
        ais.ai_name,
        COALESCE(ais.ai_name_en, '') as ai_name_en,
        ais.ai_description,
        ais.ai_logo,
        ais.company_name,
        ais.is_step_pick,
        ais.is_new,
        c.category_name,
        mc.id as main_category_id,
        mc.category_name as main_category_name`;
    
    if (userId) {
      stepPickQuery += `,
        CASE WHEN uf.id IS NOT NULL THEN true ELSE false END as is_bookmarked`;
    }
    
    stepPickQuery += `
      FROM homepage_step_pick_services hsp
      JOIN ai_services ais ON hsp.ai_service_id = ais.id
      LEFT JOIN categories c ON hsp.category_id = c.id
      LEFT JOIN ai_service_categories ascat ON ais.id = ascat.ai_service_id AND ascat.is_main_category = 1
      LEFT JOIN categories mc ON ascat.category_id = mc.id`;
    
    if (userId) {
      stepPickQuery += `
      LEFT JOIN user_favorite_services uf ON ais.id = uf.ai_service_id AND uf.user_id = ?`;
    }
    
    stepPickQuery += `
      WHERE hsp.is_active = TRUE`;
    
    const stepPickParams: any[] = [];
    if (userId) {
      stepPickParams.push(userId);
    }
    if (categoryId) {
      stepPickQuery += ` AND hsp.category_id = ?`;
      stepPickParams.push(categoryId);
    }
    
    stepPickQuery += ` ORDER BY hsp.category_id ASC, hsp.display_order ASC`;
    
    const [stepPickResult] = await pool.execute<RowDataPacket[]>(stepPickQuery, stepPickParams);
    
    // 각 STEP PICK 서비스의 모든 카테고리 정보 조회 및 북마크 정보 처리
    for (const service of stepPickResult) {
      const [allCategories] = await pool.execute<RowDataPacket[]>(
        `SELECT c.id, c.category_name, ascat.is_main_category
         FROM ai_service_categories ascat
         INNER JOIN categories c ON ascat.category_id = c.id
         WHERE ascat.ai_service_id = ?
         ORDER BY ascat.is_main_category DESC, c.category_name`,
        [service.ai_service_id]
      );
      service.categories = allCategories;
      service.category_id = service.main_category_id;
      service.category_name = service.main_category_name;
      
      // 북마크 정보 처리
      if (userId) {
        service.is_bookmarked = !!service.is_bookmarked;
      }
    }
    
    // 4. 트렌드 섹션 데이터 조회
    const [trendsResult] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        id,
        section_type,
        section_title,
        section_description,
        is_category_based,
        is_active,
        display_order
      FROM trend_sections
      ORDER BY display_order ASC
    `);
    
    res.json({
      success: true,
      data: {
        videos: videos,
        curations: curationsResult,
        stepPick: stepPickResult,
        trends: trendsResult
      }
    });
  } catch (error) {
    console.error('메인페이지 설정 조회 실패:', error);
    res.status(500).json({ success: false, error: '메인페이지 설정 조회에 실패했습니다.' });
  }
});

/**
 * @swagger
 * /api/homepage-settings/main-categories:
 *   get:
 *     summary: 메인 카테고리 목록 조회
 *     tags: [Homepage Settings]
 */
router.get('/main-categories', async (req, res) => {
  try {
    const pool = getDatabaseConnection();
    const query = `
      SELECT id, category_name, category_icon
      FROM categories
      WHERE parent_id IS NULL AND category_status = 'active'
      ORDER BY category_order ASC
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('메인 카테고리 조회 실패:', error);
    res.status(500).json({ success: false, error: '메인 카테고리 조회에 실패했습니다.' });
  }
});

export default router;