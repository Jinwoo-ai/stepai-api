import express from 'express';
import { getDatabaseConnection } from '../configs/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = express.Router();

/**
 * @swagger
 * /api/curations:
 *   get:
 *     summary: 큐레이션 목록 조회
 *     tags: [Curations]
 */
router.get('/', async (req, res) => {
  try {
    const pool = getDatabaseConnection();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search as string || '';
    
    let query = `
      SELECT 
        c.id,
        c.curation_title,
        c.curation_description,
        c.curation_thumbnail,
        c.curation_order,
        c.curation_status,
        c.created_at,
        c.updated_at,
        COUNT(cas.ai_service_id) as service_count
      FROM curations c
      LEFT JOIN curation_ai_services cas ON c.id = cas.curation_id
      WHERE c.curation_status != 'deleted'
    `;
    
    const params: any[] = [];
    
    if (search) {
      query += ` AND (c.curation_title LIKE ? OR c.curation_description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ` GROUP BY c.id, c.curation_title, c.curation_description, c.curation_thumbnail, c.curation_order, c.curation_status, c.created_at, c.updated_at`;
    
    // 총 개수 조회
    const countQuery = `
      SELECT COUNT(*) as total
      FROM curations c
      WHERE c.curation_status != 'deleted'
      ${search ? 'AND (c.curation_title LIKE ? OR c.curation_description LIKE ?)' : ''}
    `;
    const [countResult] = await pool.execute<RowDataPacket[]>(countQuery, search ? [`%${search}%`, `%${search}%`] : []);
    const total = countResult[0].total;
    
    // 페이지네이션 적용
    query += ` ORDER BY c.curation_order ASC, c.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    
    res.json({
      success: true,
      data: {
        data: rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('큐레이션 목록 조회 실패:', error);
    res.status(500).json({ success: false, error: '큐레이션 목록 조회에 실패했습니다.' });
  }
});

/**
 * @swagger
 * /api/curations/{id}:
 *   get:
 *     summary: 큐레이션 상세 조회
 *     tags: [Curations]
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 큐레이션 ID입니다.'
      });
    }

    const pool = getDatabaseConnection();
    const query = `
      SELECT 
        id,
        curation_title,
        curation_description,
        curation_thumbnail,
        curation_order,
        curation_status,
        created_at,
        updated_at
      FROM curations
      WHERE id = ? AND curation_status != 'deleted'
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '큐레이션을 찾을 수 없습니다.'
      });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('큐레이션 상세 조회 실패:', error);
    res.status(500).json({ success: false, error: '큐레이션 상세 조회에 실패했습니다.' });
  }
});

/**
 * @swagger
 * /api/curations:
 *   post:
 *     summary: 큐레이션 생성
 *     tags: [Curations]
 */
router.post('/', async (req, res) => {
  try {
    const { curation_title, curation_description, curation_thumbnail, curation_order } = req.body;
    
    if (!curation_title) {
      return res.status(400).json({
        success: false,
        error: '큐레이션 제목은 필수입니다.'
      });
    }

    const pool = getDatabaseConnection();
    const query = `
      INSERT INTO curations (
        curation_title, 
        curation_description, 
        curation_thumbnail, 
        curation_order,
        curation_status
      ) VALUES (?, ?, ?, ?, 'active')
    `;

    const [result] = await pool.execute<ResultSetHeader>(query, [
      curation_title,
      curation_description || null,
      curation_thumbnail || null,
      curation_order || 0
    ]);
    
    res.json({
      success: true,
      data: {
        id: result.insertId,
        curation_title,
        curation_description,
        curation_thumbnail,
        curation_order: curation_order || 0,
        curation_status: 'active'
      },
      message: '큐레이션이 성공적으로 생성되었습니다.'
    });
  } catch (error) {
    console.error('큐레이션 생성 실패:', error);
    res.status(500).json({ success: false, error: '큐레이션 생성에 실패했습니다.' });
  }
});

/**
 * @swagger
 * /api/curations/{id}:
 *   put:
 *     summary: 큐레이션 수정
 *     tags: [Curations]
 */
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { curation_title, curation_description, curation_thumbnail, curation_order, curation_status } = req.body;
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 큐레이션 ID입니다.'
      });
    }
    
    if (!curation_title) {
      return res.status(400).json({
        success: false,
        error: '큐레이션 제목은 필수입니다.'
      });
    }

    const pool = getDatabaseConnection();
    const query = `
      UPDATE curations SET
        curation_title = ?,
        curation_description = ?,
        curation_thumbnail = ?,
        curation_order = ?,
        curation_status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND curation_status != 'deleted'
    `;

    const [result] = await pool.execute<ResultSetHeader>(query, [
      curation_title,
      curation_description || null,
      curation_thumbnail || null,
      curation_order || 0,
      curation_status || 'active',
      id
    ]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: '큐레이션을 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      message: '큐레이션이 성공적으로 수정되었습니다.'
    });
  } catch (error) {
    console.error('큐레이션 수정 실패:', error);
    res.status(500).json({ success: false, error: '큐레이션 수정에 실패했습니다.' });
  }
});

/**
 * @swagger
 * /api/curations/{id}:
 *   delete:
 *     summary: 큐레이션 삭제
 *     tags: [Curations]
 */
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 큐레이션 ID입니다.'
      });
    }

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 큐레이션에 포함된 서비스들 먼저 삭제
      await connection.execute(
        'DELETE FROM curation_ai_services WHERE curation_id = ?',
        [id]
      );
      
      // 큐레이션 소프트 삭제
      const [result] = await connection.execute<ResultSetHeader>(
        'UPDATE curations SET curation_status = "deleted", deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
      
      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          error: '큐레이션을 찾을 수 없습니다.'
        });
      }
      
      await connection.commit();
      res.json({
        success: true,
        message: '큐레이션이 성공적으로 삭제되었습니다.'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('큐레이션 삭제 실패:', error);
    res.status(500).json({ success: false, error: '큐레이션 삭제에 실패했습니다.' });
  }
});

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

/**
 * @swagger
 * /api/curations/{curationId}/services:
 *   post:
 *     summary: 큐레이션에 AI 서비스 추가
 *     tags: [Curations]
 */
router.post('/:curationId/services', async (req, res) => {
  try {
    const curationId = parseInt(req.params.curationId);
    const { ai_service_id, service_order } = req.body;
    
    if (isNaN(curationId) || !ai_service_id) {
      return res.status(400).json({
        success: false,
        error: '큐레이션 ID와 AI 서비스 ID는 필수입니다.'
      });
    }

    const pool = getDatabaseConnection();
    const query = `
      INSERT INTO curation_ai_services (curation_id, ai_service_id, service_order)
      VALUES (?, ?, ?)
    `;

    const [result] = await pool.execute<ResultSetHeader>(query, [
      curationId,
      ai_service_id,
      service_order || 0
    ]);
    
    res.json({
      success: true,
      data: {
        id: result.insertId,
        curation_id: curationId,
        ai_service_id,
        service_order: service_order || 0
      },
      message: '큐레이션에 AI 서비스가 성공적으로 추가되었습니다.'
    });
  } catch (error) {
    console.error('큐레이션 서비스 추가 실패:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ success: false, error: '이미 큐레이션에 포함된 서비스입니다.' });
    } else {
      res.status(500).json({ success: false, error: '큐레이션 서비스 추가에 실패했습니다.' });
    }
  }
});

/**
 * @swagger
 * /api/curations/{curationId}/services/{serviceId}:
 *   delete:
 *     summary: 큐레이션에서 AI 서비스 제거
 *     tags: [Curations]
 */
router.delete('/:curationId/services/:serviceId', async (req, res) => {
  try {
    const curationId = parseInt(req.params.curationId);
    const serviceId = parseInt(req.params.serviceId);
    
    if (isNaN(curationId) || isNaN(serviceId)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다.'
      });
    }

    const pool = getDatabaseConnection();
    const query = `
      DELETE FROM curation_ai_services 
      WHERE curation_id = ? AND ai_service_id = ?
    `;

    const [result] = await pool.execute<ResultSetHeader>(query, [curationId, serviceId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: '큐레이션에서 해당 서비스를 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      message: '큐레이션에서 AI 서비스가 성공적으로 제거되었습니다.'
    });
  } catch (error) {
    console.error('큐레이션 서비스 제거 실패:', error);
    res.status(500).json({ success: false, error: '큐레이션 서비스 제거에 실패했습니다.' });
  }
});

export default router;