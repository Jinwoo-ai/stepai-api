import { Router, Request, Response } from 'express';
import { userService } from '../services/userService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse, PaginationParams } from '../types/database';

const router = Router();

// SNS 로그인/회원가입
router.post('/sns-login', async (req: Request, res: Response) => {
  try {
    const result = await userService.snsLogin(req.body);
    
    const response: ApiResponse = {
      success: true,
      data: {
        user: result.user,
        token: result.token,
        expiresAt: result.expiresAt
      },
      message: 'SNS 로그인이 성공적으로 처리되었습니다.'
    };
    
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    };
    
    res.status(400).json(response);
  }
});

// 로그아웃
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      await userService.logout(token);
    }
    
    const response: ApiResponse = {
      success: true,
      message: '로그아웃이 성공적으로 처리되었습니다.'
    };
    
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    };
    
    res.status(400).json(response);
  }
});

// 내 정보 조회 (특정 경로를 먼저 정의)
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await userService.getById(userId);
    
    const response: ApiResponse = {
      success: true,
      data: user
    };
    
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    };
    
    res.status(404).json(response);
  }
});

// 내 정보 수정
router.put('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await userService.update(userId, req.body);
    
    const response: ApiResponse = {
      success: true,
      data: user,
      message: '사용자 정보가 성공적으로 수정되었습니다.'
    };
    
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    };
    
    res.status(400).json(response);
  }
});

// 회원탈퇴
router.delete('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await userService.withdraw(userId);
    
    const response: ApiResponse = {
      success: true,
      message: '회원탈퇴가 성공적으로 처리되었습니다.'
    };
    
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    };
    
    res.status(400).json(response);
  }
});

// 사용자 통계 (관리자용)
router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    const stats = await userService.getStats();
    
    const response: ApiResponse = {
      success: true,
      data: stats
    };
    
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    };
    
    res.status(500).json(response);
  }
});

// 사용자 목록 조회 (관리자용)
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const pagination: PaginationParams = { page, limit };
    
    const filters = {
      user_type: req.query.user_type as string,
      user_status: req.query.user_status as string,
      sns_type: req.query.sns_type as string,
      industry: req.query.industry as string,
      job_role: req.query.job_role as string
    };

    const result = await userService.getList(pagination, filters);
    
    const response: ApiResponse = {
      success: true,
      data: result
    };
    
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    };
    
    res.status(500).json(response);
  }
});

// 사용자 상세 조회 (관리자용)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const user = await userService.getById(id);
    
    const response: ApiResponse = {
      success: true,
      data: user
    };
    
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    };
    
    res.status(404).json(response);
  }
});

// 사용자 수정 (관리자용)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const user = await userService.update(id, req.body);
    
    const response: ApiResponse = {
      success: true,
      data: user,
      message: '사용자 정보가 성공적으로 수정되었습니다.'
    };
    
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    };
    
    res.status(400).json(response);
  }
});

// 사용자 삭제 (관리자용)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await userService.delete(id);
    
    const response: ApiResponse = {
      success: true,
      message: '사용자가 성공적으로 삭제되었습니다.'
    };
    
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    };
    
    res.status(404).json(response);
  }
});

export default router;