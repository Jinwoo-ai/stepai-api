import express from 'express';
import aiServiceContentService from '../services/aiServiceContent';
import { AIServiceContent, PaginationParams } from '../types/database';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AI Service Contents
 *   description: AI 서비스 콘텐츠 관리 API
 */

/**
 * @swagger
 * /api/ai-service-contents:
 *   post:
 *     summary: AI 서비스 콘텐츠 생성
 *     tags: [AI Service Contents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AIServiceContent'
 *     responses:
 *       201:
 *         description: AI 서비스 콘텐츠가 성공적으로 생성됨
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.post('/', async (req, res) => {
  try {
    const contentData: AIServiceContent = req.body;
    
    // 필수 필드 검증
    if (!contentData.ai_service_id || !contentData.content_title || !contentData.content_type) {
      return res.status(400).json({
        success: false,
        error: 'AI 서비스 ID, 콘텐츠 제목, 콘텐츠 타입은 필수입니다.'
      });
    }

    const result = await aiServiceContentService.createAIServiceContent(contentData);
    
    if (result.success) {
      return res.status(201).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * @swagger
 * /api/ai-service-contents/{id}:
 *   get:
 *     summary: ID로 AI 서비스 콘텐츠 조회
 *     tags: [AI Service Contents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: AI 서비스 콘텐츠 ID
 *     responses:
 *       200:
 *         description: AI 서비스 콘텐츠 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: AI 서비스 콘텐츠를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다.'
      });
    }

    const result = await aiServiceContentService.getAIServiceContentById(id);
    
    if (result.success) {
      return res.json(result);
    } else {
      return res.status(404).json(result);
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * @swagger
 * /api/ai-service-contents:
 *   get:
 *     summary: AI 서비스 콘텐츠 목록 조회
 *     tags: [AI Service Contents]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 페이지당 항목 수
 *       - in: query
 *         name: ai_service_id
 *         schema:
 *           type: integer
 *         description: AI 서비스 ID 필터
 *       - in: query
 *         name: content_type
 *         schema:
 *           type: string
 *         description: 콘텐츠 타입 필터
 *     responses:
 *       200:
 *         description: AI 서비스 콘텐츠 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 10;
    const ai_service_id = req.query['ai_service_id'] ? parseInt(req.query['ai_service_id'] as string) : undefined;
    const content_type = req.query['content_type'] as string;

    const params: PaginationParams = { page, limit };
    const filters: any = {};
    
    if (ai_service_id) filters.ai_service_id = ai_service_id;
    if (content_type) filters.content_type = content_type;

    const result = await aiServiceContentService.getAIServiceContents(params, filters);
    
    if (result.success) {
      return res.json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * @swagger
 * /api/ai-service-contents/{id}:
 *   put:
 *     summary: AI 서비스 콘텐츠 정보 수정
 *     tags: [AI Service Contents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: AI 서비스 콘텐츠 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content_title:
 *                 type: string
 *                 description: 콘텐츠 제목
 *               content_url:
 *                 type: string
 *                 description: 콘텐츠 URL
 *               content_type:
 *                 type: string
 *                 description: 콘텐츠 타입
 *               content_description:
 *                 type: string
 *                 description: 콘텐츠 설명
 *               content_order_index:
 *                 type: integer
 *                 description: 콘텐츠 순서
 *     responses:
 *       200:
 *         description: AI 서비스 콘텐츠 정보 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: AI 서비스 콘텐츠를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const contentData = req.body;
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다.'
      });
    }

    const result = await aiServiceContentService.updateAIServiceContent(id, contentData);
    
    if (result.success) {
      return res.json(result);
    } else {
      return res.status(404).json(result);
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * @swagger
 * /api/ai-service-contents/{id}:
 *   delete:
 *     summary: AI 서비스 콘텐츠 삭제
 *     tags: [AI Service Contents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: AI 서비스 콘텐츠 ID
 *     responses:
 *       200:
 *         description: AI 서비스 콘텐츠 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: AI 서비스 콘텐츠를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다.'
      });
    }

    const result = await aiServiceContentService.deleteAIServiceContent(id);
    
    if (result.success) {
      return res.json(result);
    } else {
      return res.status(404).json(result);
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
});

export default router; 