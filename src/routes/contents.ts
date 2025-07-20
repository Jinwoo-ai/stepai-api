import express from 'express';
import contentService from '../services/contentService';
import { ContentCreateRequest, ContentUpdateRequest, ContentFilters, ContentListOptions, PaginationParams } from '../types/database';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Contents
 *   description: 콘텐츠 관리 API
 */

/**
 * @swagger
 * /api/contents:
 *   post:
 *     summary: 콘텐츠 생성
 *     tags: [Contents]
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
 *               content_description:
 *                 type: string
 *                 description: 콘텐츠 설명
 *               content_url:
 *                 type: string
 *                 description: 콘텐츠 URL
 *               content_type:
 *                 type: string
 *                 description: 콘텐츠 타입
 *               content_order_index:
 *                 type: integer
 *                 description: 콘텐츠 순서
 *               category_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 카테고리 ID 배열
 *               tag_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 태그 ID 배열
 *               ai_service_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: AI 서비스 ID 배열
 *             required:
 *               - content_title
 *               - content_type
 *     responses:
 *       201:
 *         description: 콘텐츠가 성공적으로 생성됨
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
    const contentData: ContentCreateRequest = req.body;
    
    // 필수 필드 검증
    if (!contentData.content_title || !contentData.content_type) {
      return res.status(400).json({
        success: false,
        error: '콘텐츠 제목과 타입은 필수입니다.'
      });
    }

    const result = await contentService.createContent(contentData);
    
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
 * /api/contents/{id}:
 *   get:
 *     summary: ID로 콘텐츠 조회
 *     tags: [Contents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 콘텐츠 ID
 *     responses:
 *       200:
 *         description: 콘텐츠 정보 조회 성공
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
 *         description: 콘텐츠를 찾을 수 없음
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

    const result = await contentService.getContentById(id);
    
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
 * /api/contents/{id}/detail:
 *   get:
 *     summary: 콘텐츠 상세 조회 (관련 데이터 포함)
 *     tags: [Contents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 콘텐츠 ID
 *     responses:
 *       200:
 *         description: 콘텐츠 상세 정보 조회 성공
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
 *         description: 콘텐츠를 찾을 수 없음
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
router.get('/:id/detail', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다.'
      });
    }

    const result = await contentService.getContentDetailById(id);
    
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
 * /api/contents:
 *   get:
 *     summary: 콘텐츠 목록 조회
 *     tags: [Contents]
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
 *         name: content_status
 *         schema:
 *           type: string
 *           enum: [active, inactive, pending, deleted]
 *         description: 콘텐츠 상태 필터
 *       - in: query
 *         name: content_type
 *         schema:
 *           type: string
 *         description: 콘텐츠 타입 필터
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *         description: 카테고리 ID 필터
 *       - in: query
 *         name: tag_id
 *         schema:
 *           type: integer
 *         description: 태그 ID 필터
 *       - in: query
 *         name: ai_service_id
 *         schema:
 *           type: integer
 *         description: AI 서비스 ID 필터
 *       - in: query
 *         name: include_categories
 *         schema:
 *           type: boolean
 *         description: 카테고리 정보 포함 여부
 *       - in: query
 *         name: include_tags
 *         schema:
 *           type: boolean
 *         description: 태그 정보 포함 여부
 *       - in: query
 *         name: include_ai_services
 *         schema:
 *           type: boolean
 *         description: AI 서비스 정보 포함 여부
 *       - in: query
 *         name: include_experts
 *         schema:
 *           type: boolean
 *         description: 전문가 정보 포함 여부
 *     responses:
 *       200:
 *         description: 콘텐츠 목록 조회 성공
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
    const content_status = req.query['content_status'] as string;
    const content_type = req.query['content_type'] as string;
    const category_id = req.query['category_id'] ? parseInt(req.query['category_id'] as string) : undefined;
    const tag_id = req.query['tag_id'] ? parseInt(req.query['tag_id'] as string) : undefined;
    const ai_service_id = req.query['ai_service_id'] ? parseInt(req.query['ai_service_id'] as string) : undefined;

    // 관련 데이터 포함 옵션 파싱
    const include_categories = req.query['include_categories'] === 'true';
    const include_tags = req.query['include_tags'] === 'true';
    const include_ai_services = req.query['include_ai_services'] === 'true';
    const include_experts = req.query['include_experts'] === 'true';

    const params: PaginationParams = { page, limit };
    const filters: ContentFilters = {};
    const options: ContentListOptions = {};
    
    if (content_status) filters.content_status = content_status;
    if (content_type) filters.content_type = content_type;
    if (category_id) filters.category_id = category_id;
    if (tag_id) filters.tag_id = tag_id;
    if (ai_service_id) filters.ai_service_id = ai_service_id;

    // 관련 데이터 포함 옵션 설정
    if (include_categories) options.include_categories = true;
    if (include_tags) options.include_tags = true;
    if (include_ai_services) options.include_ai_services = true;
    if (include_experts) options.include_experts = true;

    const result = await contentService.getContents(params, filters, options);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * @swagger
 * /api/contents/search:
 *   get:
 *     summary: 콘텐츠 검색
 *     tags: [Contents]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: 검색어
 *     responses:
 *       200:
 *         description: 콘텐츠 검색 성공
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
router.get('/search', async (req, res) => {
  try {
    const searchTerm = req.query['q'] as string;
    
    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        error: '검색어가 필요합니다.'
      });
    }

    const result = await contentService.searchContents(searchTerm);
    
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
 * /api/contents/{id}:
 *   put:
 *     summary: 콘텐츠 정보 수정
 *     tags: [Contents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 콘텐츠 ID
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
 *               content_description:
 *                 type: string
 *                 description: 콘텐츠 설명
 *               content_url:
 *                 type: string
 *                 description: 콘텐츠 URL
 *               content_type:
 *                 type: string
 *                 description: 콘텐츠 타입
 *               content_order_index:
 *                 type: integer
 *                 description: 콘텐츠 순서
 *               content_status:
 *                 type: string
 *                 enum: [active, inactive, pending, deleted]
 *                 description: 콘텐츠 상태
 *     responses:
 *       200:
 *         description: 콘텐츠 정보 수정 성공
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
 *         description: 콘텐츠를 찾을 수 없음
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
    const contentData: ContentUpdateRequest = req.body;
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다.'
      });
    }

    const result = await contentService.updateContent(id, contentData);
    
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
 * /api/contents/{id}:
 *   delete:
 *     summary: 콘텐츠 삭제 (소프트 삭제)
 *     tags: [Contents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 콘텐츠 ID
 *     responses:
 *       200:
 *         description: 콘텐츠 삭제 성공
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
 *         description: 콘텐츠를 찾을 수 없음
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

    const result = await contentService.deleteContent(id);
    
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
 * /api/contents/stats/overview:
 *   get:
 *     summary: 콘텐츠 통계 조회
 *     tags: [Contents]
 *     responses:
 *       200:
 *         description: 콘텐츠 통계 조회 성공
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
router.get('/stats/overview', async (_req, res) => {
  try {
    const result = await contentService.getContentStats();
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
});

export default router; 