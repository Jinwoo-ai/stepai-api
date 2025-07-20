import { Request, Response, NextFunction } from 'express';
import rankingService from '../services/rankingService';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    [key: string]: any;
  };
}

export const trackContentView = async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  try {
    // 콘텐츠 조회 API인지 확인
    const isContentView = req.method === 'GET' && 
      (req.path.match(/^\/api\/contents\/\d+$/) || 
       req.path.match(/^\/api\/contents\/\d+\/detail$/));

    if (isContentView) {
      const pathParts = req.path.split('/');
      const contentIdStr = pathParts[3]; // /api/contents/{id}에서 id 추출
      const contentId = contentIdStr ? parseInt(contentIdStr) : NaN;
      
      if (!isNaN(contentId)) {
        // IP 주소 가져오기
        const ipAddress = req.ip || 
                         req.connection.remoteAddress || 
                         req.socket.remoteAddress || 
                         (req as any).connection.socket?.remoteAddress || 
                         'unknown';

        // User-Agent 가져오기
        const userAgent = req.get('User-Agent') || 'unknown';

        // 사용자 ID (인증된 경우)
        const userId = req.user?.id;

        // 비동기로 조회 기록 저장 (응답을 블록하지 않음)
        rankingService.recordContentView(contentId, userId, ipAddress, userAgent)
          .then(success => {
            if (success) {
              console.log(`📊 콘텐츠 조회 기록 저장됨: content_id=${contentId}, user_id=${userId || 'anonymous'}`);
            } else {
              console.error(`❌ 콘텐츠 조회 기록 저장 실패: content_id=${contentId}`);
            }
          })
          .catch(error => {
            console.error('콘텐츠 조회 기록 저장 중 오류:', error);
          });
      }
    }

    next();
  } catch (error) {
    console.error('콘텐츠 조회 추적 미들웨어 오류:', error);
    next(); // 오류가 발생해도 요청 처리는 계속 진행
  }
};

// 콘텐츠 조회 통계를 위한 헬퍼 함수
export const getContentViewStats = async (contentId: number, days: number = 30) => {
  try {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    
    const filters = {
      ranking_type: 'content' as const,
      date_from: dateFrom,
      limit: 1
    };

    const rankings = await rankingService.getRankings(filters);
    const contentRanking = rankings.find(r => r.entity_id === contentId);
    
    return {
      view_count: contentRanking?.view_count || 0,
      avg_rating: contentRanking?.avg_rating || 0,
      rank: contentRanking?.rank || 0
    };
  } catch (error) {
    console.error('콘텐츠 조회 통계 조회 오류:', error);
    return {
      view_count: 0,
      avg_rating: 0,
      rank: 0
    };
  }
}; 