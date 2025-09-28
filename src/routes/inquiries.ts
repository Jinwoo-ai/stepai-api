import { Router, Request, Response } from 'express';
import { inquiryService } from '../services/inquiryService';
import { ApiResponse, PaginationParams } from '../types/database';

const router = Router();

// 고객문의 등록
router.post('/', async (req: Request, res: Response) => {
  try {
    const inquiry = await inquiryService.create(req.body);
    
    const response: ApiResponse = {
      success: true,
      data: inquiry,
      message: '고객문의가 성공적으로 등록되었습니다.'
    };
    
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    };
    
    res.status(400).json(response);
  }
});

// 고객문의 목록 조회
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const pagination: PaginationParams = { page, limit };
    
    const filters = {
      inquiry_type: req.query.inquiry_type as string,
      inquiry_status: req.query.inquiry_status as string,
      date_from: req.query.date_from ? new Date(req.query.date_from as string) : undefined,
      date_to: req.query.date_to ? new Date(req.query.date_to as string) : undefined
    };

    const result = await inquiryService.getList(pagination, filters);
    
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

// 고객문의 상세 조회
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const inquiry = await inquiryService.getById(id);
    
    const response: ApiResponse = {
      success: true,
      data: inquiry
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

// 고객문의 수정 (관리자용)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const inquiry = await inquiryService.update(id, req.body);
    
    const response: ApiResponse = {
      success: true,
      data: inquiry,
      message: '고객문의 정보가 성공적으로 수정되었습니다.'
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

// 고객문의 삭제 (관리자용)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await inquiryService.delete(id);
    
    const response: ApiResponse = {
      success: true,
      message: '고객문의가 성공적으로 삭제되었습니다.'
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

// 상태별 통계
router.get('/stats/status', async (req: Request, res: Response) => {
  try {
    const stats = await inquiryService.getStatusStats();
    
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

export default router;