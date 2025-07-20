import express from 'express';
import expertService from '../services/expertService';
import { ExpertCreateRequest, ExpertUpdateRequest, ExpertFilters, ExpertListOptions, PaginationParams } from '../types/database';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Experts
 *   description: AI 전문가 관리 API
 */

/**
 * @swagger
 * /api/experts:
 *   post:
 *     summary: 전문가 생성
 *     tags: [Experts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: 사용자 ID
 *               group_id:
 *                 type: integer
 *                 description: 그룹 ID (선택사항)
 *               expert_name:
 *                 type: string
 *                 description: 전문가명
 *               expert_title:
 *                 type: string
 *                 description: 전문가 직함
 *               expert_bio:
 *                 type: string
 *                 description: 전문가 소개
 *               expert_avatar:
 *                 type: string
 *                 description: 전문가 프로필 이미지 URL
 *               expert_website:
 *                 type: string
 *                 description: 전문가 웹사이트
 *               expert_email:
 *                 type: string
 *                 description: 전문가 이메일
 *               expert_phone:
 *                 type: string
 *                 description: 전문가 전화번호
 *               expert_location:
 *                 type: string
 *                 description: 전문가 위치
 *             required:
 *               - user_id
 *               - expert_name
 *     responses:
 *       201:
 *         description: 전문가가 성공적으로 생성됨
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
    const expertData: ExpertCreateRequest = req.body;
    
    // 필수 필드 검증
    if (!expertData.user_id || !expertData.expert_name) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID와 전문가명은 필수입니다.'
      });
    }

    const result = await expertService.createExpert(expertData);
    
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
 * /api/experts/{id}:
 *   get:
 *     summary: ID로 전문가 조회
 *     tags: [Experts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 전문가 ID
 *     responses:
 *       200:
 *         description: 전문가 정보 조회 성공
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
 *         description: 전문가를 찾을 수 없음
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

    const result = await expertService.getExpertById(id);
    
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
 * /api/experts/{id}/detail:
 *   get:
 *     summary: 전문가 상세 조회 (관련 데이터 포함)
 *     tags: [Experts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 전문가 ID
 *     responses:
 *       200:
 *         description: 전문가 상세 정보 조회 성공
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
 *         description: 전문가를 찾을 수 없음
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

    const result = await expertService.getExpertDetailById(id);
    
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
 * /api/experts:
 *   get:
 *     summary: 전문가 목록 조회
 *     tags: [Experts]
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
 *         name: expert_status
 *         schema:
 *           type: string
 *           enum: [active, inactive, pending, deleted]
 *         description: 전문가 상태 필터
 *       - in: query
 *         name: expert_location
 *         schema:
 *           type: string
 *         description: 전문가 위치 필터
 *       - in: query
 *         name: group_id
 *         schema:
 *           type: integer
 *         description: 그룹 ID 필터
 *       - in: query
 *         name: include_user
 *         schema:
 *           type: boolean
 *         description: 사용자 정보 포함 여부
 *       - in: query
 *         name: include_group
 *         schema:
 *           type: boolean
 *         description: 그룹 정보 포함 여부
 *       - in: query
 *         name: include_contents
 *         schema:
 *           type: boolean
 *         description: 콘텐츠 정보 포함 여부
 *       - in: query
 *         name: include_ai_services
 *         schema:
 *           type: boolean
 *         description: AI 서비스 정보 포함 여부
 *     responses:
 *       200:
 *         description: 전문가 목록 조회 성공
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
    const expert_status = req.query['expert_status'] as string;
    const expert_location = req.query['expert_location'] as string;
    const group_id = req.query['group_id'] ? parseInt(req.query['group_id'] as string) : undefined;

    // 관련 데이터 포함 옵션 파싱
    const include_user = req.query['include_user'] === 'true';
    const include_group = req.query['include_group'] === 'true';
    const include_contents = req.query['include_contents'] === 'true';
    const include_ai_services = req.query['include_ai_services'] === 'true';

    const params: PaginationParams = { page, limit };
    const filters: ExpertFilters = {};
    const options: ExpertListOptions = {};
    
    if (expert_status) filters.expert_status = expert_status;
    if (expert_location) filters.expert_location = expert_location;
    if (group_id) filters.group_id = group_id;

    // 관련 데이터 포함 옵션 설정
    if (include_user) options.include_user = true;
    if (include_group) options.include_group = true;
    if (include_contents) options.include_contents = true;
    if (include_ai_services) options.include_ai_services = true;

    const result = await expertService.getExperts(params, filters, options);
    
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
 * /api/experts/search:
 *   get:
 *     summary: 전문가 검색
 *     tags: [Experts]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: 검색어
 *     responses:
 *       200:
 *         description: 전문가 검색 성공
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

    const result = await expertService.searchExperts(searchTerm);
    
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
 * /api/experts/{id}:
 *   put:
 *     summary: 전문가 정보 수정
 *     tags: [Experts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 전문가 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               group_id:
 *                 type: integer
 *                 description: 그룹 ID
 *               expert_name:
 *                 type: string
 *                 description: 전문가명
 *               expert_title:
 *                 type: string
 *                 description: 전문가 직함
 *               expert_bio:
 *                 type: string
 *                 description: 전문가 소개
 *               expert_avatar:
 *                 type: string
 *                 description: 전문가 프로필 이미지 URL
 *               expert_website:
 *                 type: string
 *                 description: 전문가 웹사이트
 *               expert_email:
 *                 type: string
 *                 description: 전문가 이메일
 *               expert_phone:
 *                 type: string
 *                 description: 전문가 전화번호
 *               expert_location:
 *                 type: string
 *                 description: 전문가 위치
 *               expert_status:
 *                 type: string
 *                 enum: [active, inactive, pending, deleted]
 *                 description: 전문가 상태
 *     responses:
 *       200:
 *         description: 전문가 정보 수정 성공
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
 *         description: 전문가를 찾을 수 없음
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
    const expertData: ExpertUpdateRequest = req.body;
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다.'
      });
    }

    const result = await expertService.updateExpert(id, expertData);
    
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
 * /api/experts/{id}:
 *   delete:
 *     summary: 전문가 삭제 (소프트 삭제)
 *     tags: [Experts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 전문가 ID
 *     responses:
 *       200:
 *         description: 전문가 삭제 성공
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
 *         description: 전문가를 찾을 수 없음
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

    const result = await expertService.deleteExpert(id);
    
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
 * /api/experts/stats/overview:
 *   get:
 *     summary: 전문가 통계 조회
 *     tags: [Experts]
 *     responses:
 *       200:
 *         description: 전문가 통계 조회 성공
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
    const result = await expertService.getExpertStats();
    
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