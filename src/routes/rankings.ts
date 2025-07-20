import express from 'express';
import rankingService from '../services/rankingService';
import { RankingFilters, RankingWeightUpdate } from '../types/database';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Rankings
 *   description: 랭킹 시스템 API
 */

/**
 * @swagger
 * /api/rankings/{type}:
 *   get:
 *     summary: 랭킹 조회
 *     tags: [Rankings]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [ai_service, content, expert, category]
 *         description: 랭킹 타입
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: 시작 날짜 (YYYY-MM-DD)
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: 종료 날짜 (YYYY-MM-DD)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 조회할 랭킹 수
 *     responses:
 *       200:
 *         description: 랭킹 조회 성공
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
router.get('/:type', async (req, res) => {
  try {
    const rankingType = req.params.type as 'ai_service' | 'content' | 'expert' | 'category';
    
    if (!['ai_service', 'content', 'expert', 'category'].includes(rankingType)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 랭킹 타입입니다.'
      });
    }

    const dateFrom = req.query['date_from'] ? new Date(req.query['date_from'] as string) : undefined;
    const dateTo = req.query['date_to'] ? new Date(req.query['date_to'] as string) : undefined;
    const limit = req.query['limit'] ? parseInt(req.query['limit'] as string) : 10;

    const filters: RankingFilters = {
      ranking_type: rankingType,
      limit,
      ...(dateFrom && { date_from: dateFrom }),
      ...(dateTo && { date_to: dateTo })
    };

    const results = await rankingService.getRankings(filters);
    
    return res.json({
      success: true,
      data: results,
      message: `${rankingType} 랭킹 조회 성공`
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * @swagger
 * /api/rankings/calculate:
 *   post:
 *     summary: 랭킹 계산 및 저장
 *     tags: [Rankings]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date_from:
 *                 type: string
 *                 format: date
 *                 description: 시작 날짜 (YYYY-MM-DD)
 *               date_to:
 *                 type: string
 *                 format: date
 *                 description: 종료 날짜 (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: 랭킹 계산 성공
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
router.post('/calculate', async (req, res) => {
  try {
    const dateFrom = req.body.date_from ? new Date(req.body.date_from) : undefined;
    const dateTo = req.body.date_to ? new Date(req.body.date_to) : undefined;

    const success = await rankingService.calculateAndSaveAllRankings(dateFrom, dateTo);
    
    if (success) {
      return res.json({
        success: true,
        message: '랭킹 계산 및 저장이 완료되었습니다.'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: '랭킹 계산 중 오류가 발생했습니다.'
      });
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
 * /api/rankings/weights/{type}:
 *   get:
 *     summary: 랭킹 가중치 조회
 *     tags: [Rankings]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [ai_service, content, expert, category]
 *         description: 랭킹 타입
 *     responses:
 *       200:
 *         description: 랭킹 가중치 조회 성공
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
router.get('/weights/:type', async (req, res) => {
  try {
    const rankingType = req.params.type;
    
    if (!['ai_service', 'content', 'expert', 'category'].includes(rankingType)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 랭킹 타입입니다.'
      });
    }

    const weights = await rankingService.getRankingWeights(rankingType);
    
    return res.json({
      success: true,
      data: weights,
      message: `${rankingType} 랭킹 가중치 조회 성공`
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * @swagger
 * /api/rankings/weights:
 *   put:
 *     summary: 랭킹 가중치 업데이트
 *     tags: [Rankings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ranking_type:
 *                 type: string
 *                 enum: [ai_service, content, expert, category]
 *                 description: 랭킹 타입
 *               weight_name:
 *                 type: string
 *                 description: 가중치 이름
 *               weight_value:
 *                 type: number
 *                 description: 가중치 값
 *               weight_description:
 *                 type: string
 *                 description: 가중치 설명
 *             required:
 *               - ranking_type
 *               - weight_name
 *               - weight_value
 *     responses:
 *       200:
 *         description: 랭킹 가중치 업데이트 성공
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
router.put('/weights', async (req, res) => {
  try {
    const update: RankingWeightUpdate = req.body;
    
    if (!update.ranking_type || !update.weight_name || update.weight_value === undefined) {
      return res.status(400).json({
        success: false,
        error: '필수 필드가 누락되었습니다.'
      });
    }

    const success = await rankingService.updateRankingWeight(update);
    
    if (success) {
      return res.json({
        success: true,
        message: '랭킹 가중치가 업데이트되었습니다.'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: '랭킹 가중치 업데이트 중 오류가 발생했습니다.'
      });
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
 * /api/rankings/record-view:
 *   post:
 *     summary: 콘텐츠 조회 기록
 *     tags: [Rankings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content_id:
 *                 type: integer
 *                 description: 콘텐츠 ID
 *               user_id:
 *                 type: integer
 *                 description: 사용자 ID (선택사항)
 *               ip_address:
 *                 type: string
 *                 description: IP 주소 (선택사항)
 *               user_agent:
 *                 type: string
 *                 description: 사용자 에이전트 (선택사항)
 *             required:
 *               - content_id
 *     responses:
 *       200:
 *         description: 조회 기록 성공
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
router.post('/record-view', async (req, res) => {
  try {
    const { content_id, user_id, ip_address, user_agent } = req.body;
    
    if (!content_id) {
      return res.status(400).json({
        success: false,
        error: '콘텐츠 ID가 필요합니다.'
      });
    }

    const success = await rankingService.recordContentView(
      content_id, 
      user_id, 
      ip_address, 
      user_agent
    );
    
    if (success) {
      return res.json({
        success: true,
        message: '조회 기록이 저장되었습니다.'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: '조회 기록 저장 중 오류가 발생했습니다.'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
});

export default router; 