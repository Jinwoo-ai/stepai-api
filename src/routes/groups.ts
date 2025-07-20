import express from 'express';
import groupService from '../services/groupService';
import { GroupCreateRequest, GroupUpdateRequest, GroupFilters, PaginationParams } from '../types/database';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: 전문가 그룹 관리 API
 */

/**
 * @swagger
 * /api/groups:
 *   post:
 *     summary: 그룹 생성
 *     tags: [Groups]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               group_name:
 *                 type: string
 *                 description: 그룹명
 *               group_description:
 *                 type: string
 *                 description: 그룹 설명
 *               group_logo:
 *                 type: string
 *                 description: 그룹 로고 URL
 *               group_website:
 *                 type: string
 *                 description: 그룹 웹사이트
 *               group_email:
 *                 type: string
 *                 description: 그룹 이메일
 *               group_phone:
 *                 type: string
 *                 description: 그룹 전화번호
 *               group_address:
 *                 type: string
 *                 description: 그룹 주소
 *             required:
 *               - group_name
 *     responses:
 *       201:
 *         description: 그룹이 성공적으로 생성됨
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
    const groupData: GroupCreateRequest = req.body;
    
    // 필수 필드 검증
    if (!groupData.group_name) {
      return res.status(400).json({
        success: false,
        error: '그룹명은 필수입니다.'
      });
    }

    const result = await groupService.createGroup(groupData);
    
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
 * /api/groups/{id}:
 *   get:
 *     summary: ID로 그룹 조회
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 그룹 ID
 *     responses:
 *       200:
 *         description: 그룹 정보 조회 성공
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
 *         description: 그룹을 찾을 수 없음
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

    const result = await groupService.getGroupById(id);
    
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
 * /api/groups:
 *   get:
 *     summary: 그룹 목록 조회
 *     tags: [Groups]
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
 *         name: group_status
 *         schema:
 *           type: string
 *           enum: [active, inactive, pending, deleted]
 *         description: 그룹 상태 필터
 *     responses:
 *       200:
 *         description: 그룹 목록 조회 성공
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
    const group_status = req.query['group_status'] as string;

    const params: PaginationParams = { page, limit };
    const filters: GroupFilters = {};
    
    if (group_status) filters.group_status = group_status;

    const result = await groupService.getGroups(params, filters);
    
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
 * /api/groups/search:
 *   get:
 *     summary: 그룹 검색
 *     tags: [Groups]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: 검색어
 *     responses:
 *       200:
 *         description: 그룹 검색 성공
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

    const result = await groupService.searchGroups(searchTerm);
    
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
 * /api/groups/{id}:
 *   put:
 *     summary: 그룹 정보 수정
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 그룹 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               group_name:
 *                 type: string
 *                 description: 그룹명
 *               group_description:
 *                 type: string
 *                 description: 그룹 설명
 *               group_logo:
 *                 type: string
 *                 description: 그룹 로고 URL
 *               group_website:
 *                 type: string
 *                 description: 그룹 웹사이트
 *               group_email:
 *                 type: string
 *                 description: 그룹 이메일
 *               group_phone:
 *                 type: string
 *                 description: 그룹 전화번호
 *               group_address:
 *                 type: string
 *                 description: 그룹 주소
 *               group_status:
 *                 type: string
 *                 enum: [active, inactive, pending, deleted]
 *                 description: 그룹 상태
 *     responses:
 *       200:
 *         description: 그룹 정보 수정 성공
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
 *         description: 그룹을 찾을 수 없음
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
    const groupData: GroupUpdateRequest = req.body;
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다.'
      });
    }

    const result = await groupService.updateGroup(id, groupData);
    
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
 * /api/groups/{id}:
 *   delete:
 *     summary: 그룹 삭제 (소프트 삭제)
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 그룹 ID
 *     responses:
 *       200:
 *         description: 그룹 삭제 성공
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
 *         description: 그룹을 찾을 수 없음
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

    const result = await groupService.deleteGroup(id);
    
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
 * /api/groups/stats/overview:
 *   get:
 *     summary: 그룹 통계 조회
 *     tags: [Groups]
 *     responses:
 *       200:
 *         description: 그룹 통계 조회 성공
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
    const result = await groupService.getGroupStats();
    
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