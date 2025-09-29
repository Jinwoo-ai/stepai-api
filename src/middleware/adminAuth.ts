import { Request, Response, NextFunction } from 'express';
import mysql from 'mysql2/promise';
import { dbConfig } from '../configs/database';
import { TokenService } from '../utils/jwt';

export interface AdminAuthenticatedRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    user_type: string;
  };
}

export const authenticateAdmin = async (req: AdminAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: '관리자 인증 토큰이 필요합니다.'
      });
    }

    const connection = await mysql.createConnection(dbConfig);
    
    try {
      // 토큰으로 관리자 사용자 조회
      const [tokenRows] = await connection.execute(`
        SELECT t.user_id, t.expires_at, u.name, u.email, u.user_type
        FROM access_tokens t
        JOIN users u ON t.user_id = u.id
        WHERE t.token = ? AND u.deleted_at IS NULL AND u.user_type = 'admin'
      `, [token]);

      const tokenData = (tokenRows as any[])[0];

      if (!tokenData) {
        return res.status(403).json({
          success: false,
          error: '관리자 권한이 필요합니다.'
        });
      }

      // 토큰 만료 확인
      if (TokenService.isTokenExpired(new Date(tokenData.expires_at))) {
        // 만료된 토큰 삭제
        await connection.execute('DELETE FROM access_tokens WHERE token = ?', [token]);
        
        return res.status(401).json({
          success: false,
          error: '토큰이 만료되었습니다.'
        });
      }

      // 관리자 정보를 request에 추가
      req.user = {
        id: tokenData.user_id,
        name: tokenData.name,
        email: tokenData.email,
        user_type: tokenData.user_type
      };

      next();
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(500).json({
      success: false,
      error: '관리자 인증 처리 중 오류가 발생했습니다.'
    });
  }
};