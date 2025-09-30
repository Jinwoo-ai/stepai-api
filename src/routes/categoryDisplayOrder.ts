import express from 'express';
import { pool } from '../configs/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = express.Router();

/**
 * @swagger
 * /api/category-display-order/available-services:
 *   get:
 *     summary: 카테고리에 추가 가능한 AI 서비스 목록 조회
 *     tags: [Category Display Order]
 *     parameters:
 *       - in: query
 *         name: category_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 카테고리 ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 검색어
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: 조회할 서비스 수
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/available-services', async (req, res) => {
  try {
    const categoryId = parseInt(req.query.category_id as string);
    const search = req.query.search as string || '';
    const limit = parseInt(req.query.limit as string) || 50;

    let query = `
      SELECT 
        ais.id,
        ais.ai_name,
        COALESCE(ais.ai_name_en, '') as ai_name_en,
        ais.ai_description,
        ais.ai_logo,
        ais.company_name,
        ais.pricing_info,
        ais.difficulty_level,
        ais.is_step_pick,
        ais.is_new
      FROM ai_services ais
      WHERE ais.ai_status = 'active'
        AND ais.id NOT IN (
          SELECT ai_service_id 
          FROM ai_service_category_display_order 
          WHERE category_id = ?
        )
    `;

    const params: any[] = [categoryId];

    if (search) {
      query += ` AND (ais.ai_name LIKE ? OR COALESCE(ais.ai_name_en, '') LIKE ? OR COALESCE(ais.company_name, '') LIKE ? OR COALESCE(ais.company_name_en, '') LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY ais.ai_name ASC LIMIT ?`;
    params.push(limit);

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('사용 가능한 서비스 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '사용 가능한 서비스 조회에 실패했습니다.'
    });
  }
});

/**
 * @swagger
 * /api/category-display-order/{categoryId}:
 *   get:
 *     summary: 카테고리별 AI 서비스 표시 순서 조회
 *     tags: [Category Display Order]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 카테고리 ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 조회할 서비스 수
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       ai_service_id:
 *                         type: integer
 *                       display_order:
 *                         type: integer
 *                       is_featured:
 *                         type: boolean
 *                       ai_service:
 *                         $ref: '#/components/schemas/AIService'
 */
router.get('/:categoryId', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    const limit = parseInt(req.query.limit as string) || 20;

    const query = `
      SELECT 
        asdo.id,
        asdo.ai_service_id,
        asdo.display_order,
        asdo.is_featured,
        ais.ai_name,
        COALESCE(ais.ai_name_en, '') as ai_name_en,
        ais.ai_description,
        ais.ai_logo,
        ais.company_name,
        ais.pricing_info,
        ais.difficulty_level,
        ais.is_step_pick,
        ais.is_new
      FROM ai_service_category_display_order asdo
      JOIN ai_services ais ON asdo.ai_service_id = ais.id
      WHERE asdo.category_id = ? AND ais.ai_status = 'active'
      ORDER BY asdo.is_featured DESC, asdo.display_order ASC
      LIMIT ?
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query, [categoryId, limit]);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('카테고리 표시 순서 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '카테고리 표시 순서 조회에 실패했습니다.'
    });
  }
});

/**
 * @swagger
 * /api/category-display-order/{categoryId}/services:
 *   post:
 *     summary: 카테고리에 AI 서비스 추가 및 순서 설정
 *     tags: [Category Display Order]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 카테고리 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ai_service_id:
 *                 type: integer
 *                 description: AI 서비스 ID
 *               display_order:
 *                 type: integer
 *                 description: 표시 순서
 *               is_featured:
 *                 type: boolean
 *                 description: 상단 고정 여부
 *     responses:
 *       201:
 *         description: 성공
 */
router.post('/:categoryId/services', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    const { ai_service_id, display_order = 0, is_featured = false } = req.body;

    // 중복 체크
    const checkQuery = `
      SELECT id FROM ai_service_category_display_order 
      WHERE category_id = ? AND ai_service_id = ?
    `;
    const [existing] = await pool.execute<RowDataPacket[]>(checkQuery, [categoryId, ai_service_id]);

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: '이미 해당 카테고리에 등록된 서비스입니다.'
      });
    }

    // 새로운 순서 삽입
    const insertQuery = `
      INSERT INTO ai_service_category_display_order 
      (category_id, ai_service_id, display_order, is_featured)
      VALUES (?, ?, ?, ?)
    `;
    
    await pool.execute<ResultSetHeader>(insertQuery, [categoryId, ai_service_id, display_order, is_featured]);

    res.status(201).json({
      success: true,
      message: '카테고리에 AI 서비스가 추가되었습니다.'
    });
  } catch (error) {
    console.error('AI 서비스 추가 실패:', error);
    res.status(500).json({
      success: false,
      error: 'AI 서비스 추가에 실패했습니다.'
    });
  }
});

/**
 * @swagger
 * /api/category-display-order/{categoryId}/reorder:
 *   put:
 *     summary: 카테고리 내 AI 서비스 순서 변경
 *     tags: [Category Display Order]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 카테고리 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               services:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     ai_service_id:
 *                       type: integer
 *                     display_order:
 *                       type: integer
 *                     is_featured:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: 성공
 */
router.put('/:categoryId/reorder', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const categoryId = parseInt(req.params.categoryId);
    const { services } = req.body;

    await connection.beginTransaction();

    // 순서 업데이트
    for (const service of services) {
      const updateQuery = `
        UPDATE ai_service_category_display_order 
        SET display_order = ?, is_featured = ?
        WHERE category_id = ? AND ai_service_id = ?
      `;
      
      await connection.execute(updateQuery, [
        service.display_order,
        service.is_featured || false,
        categoryId,
        service.ai_service_id
      ]);
    }

    await connection.commit();

    res.json({
      success: true,
      message: '순서가 성공적으로 변경되었습니다.'
    });
  } catch (error) {
    await connection.rollback();
    console.error('순서 변경 실패:', error);
    res.status(500).json({
      success: false,
      error: '순서 변경에 실패했습니다.'
    });
  } finally {
    connection.release();
  }
});

/**
 * @swagger
 * /api/category-display-order/{categoryId}/services/{serviceId}:
 *   delete:
 *     summary: 카테고리에서 AI 서비스 제거
 *     tags: [Category Display Order]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 카테고리 ID
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: AI 서비스 ID
 *     responses:
 *       200:
 *         description: 성공
 */
router.delete('/:categoryId/services/:serviceId', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    const serviceId = parseInt(req.params.serviceId);

    const deleteQuery = `
      DELETE FROM ai_service_category_display_order 
      WHERE category_id = ? AND ai_service_id = ?
    `;
    
    const [result] = await pool.execute<ResultSetHeader>(deleteQuery, [categoryId, serviceId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: '해당 카테고리에서 서비스를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      message: '카테고리에서 AI 서비스가 제거되었습니다.'
    });
  } catch (error) {
    console.error('AI 서비스 제거 실패:', error);
    res.status(500).json({
      success: false,
      error: 'AI 서비스 제거에 실패했습니다.'
    });
  }
});

export default router;