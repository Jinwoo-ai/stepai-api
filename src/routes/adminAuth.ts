import { Router, Request, Response } from 'express';
import { userService } from '../services/userService';
import { authenticateAdmin, AdminAuthenticatedRequest } from '../middleware/adminAuth';
import { ApiResponse, AdminLoginRequest, AdminSetPasswordRequest } from '../types/database';
import { PasswordUtils } from '../utils/password';
import mysql from 'mysql2/promise';
import { dbConfig } from '../configs/database';

const router = Router();

// 이메일 확인
router.post('/check-email', async (req: Request, res: Response) => {
  try {
    const { email }: AdminLoginRequest = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: '이메일이 필요합니다.'
      });
    }

    const connection = await mysql.createConnection(dbConfig);
    
    try {
      const [rows] = await connection.execute(
        'SELECT id, email, password, user_type FROM users WHERE email = ? AND deleted_at IS NULL',
        [email]
      );

      const users = rows as any[];
      
      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          error: '존재하지 않는 이메일입니다.'
        });
      }

      const user = users[0];
      
      if (user.user_type !== 'admin') {
        return res.status(403).json({
          success: false,
          error: '관리자 권한이 필요합니다.'
        });
      }

      res.json({
        success: true,
        data: {
          hasPassword: !!user.password
        }
      });
    } finally {
      await connection.end();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '이메일 확인 중 오류가 발생했습니다.'
    });
  }
});

// 비밀번호 설정
router.post('/set-password', async (req: Request, res: Response) => {
  try {
    const { email, password }: AdminSetPasswordRequest = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: '이메일과 비밀번호가 필요합니다.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: '비밀번호는 6자 이상이어야 합니다.'
      });
    }

    const connection = await mysql.createConnection(dbConfig);
    
    try {
      const [rows] = await connection.execute(
        'SELECT id, user_type FROM users WHERE email = ? AND deleted_at IS NULL',
        [email]
      );

      const users = rows as any[];
      
      if (users.length === 0 || users[0].user_type !== 'admin') {
        return res.status(403).json({
          success: false,
          error: '관리자 권한이 필요합니다.'
        });
      }

      const hashedPassword = await PasswordUtils.hash(password);
      
      await connection.execute(
        'UPDATE users SET password = ? WHERE email = ?',
        [hashedPassword, email]
      );

      res.json({
        success: true,
        message: '비밀번호가 설정되었습니다.'
      });
    } finally {
      await connection.end();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '비밀번호 설정 중 오류가 발생했습니다.'
    });
  }
});

// 관리자 로그인
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password }: AdminLoginRequest = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: '이메일과 비밀번호가 필요합니다.'
      });
    }

    const connection = await mysql.createConnection(dbConfig);
    
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM users WHERE email = ? AND user_type = "admin" AND deleted_at IS NULL',
        [email]
      );

      const users = rows as any[];
      
      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          error: '이메일 또는 비밀번호가 올바르지 않습니다.'
        });
      }

      const user = users[0];
      
      if (!user.password) {
        return res.status(400).json({
          success: false,
          error: '비밀번호가 설정되지 않았습니다.'
        });
      }

      const isValidPassword = await PasswordUtils.verify(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: '이메일 또는 비밀번호가 올바르지 않습니다.'
        });
      }

      // 토큰 생성
      const { TokenService } = await import('../utils/jwt');
      const { token, expiresAt } = TokenService.generateToken();
      
      await connection.execute(
        'INSERT INTO access_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [user.id, token, expiresAt]
      );

      // 비밀번호 제거 후 응답
      delete user.password;

      res.json({
        success: true,
        data: {
          user,
          token,
          expiresAt
        },
        message: '관리자 로그인이 성공적으로 처리되었습니다.'
      });
    } finally {
      await connection.end();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '로그인 처리 중 오류가 발생했습니다.'
    });
  }
});

// 관리자 로그아웃
router.post('/logout', authenticateAdmin, async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      await userService.logout(token);
    }
    
    const response: ApiResponse = {
      success: true,
      message: '관리자 로그아웃이 성공적으로 처리되었습니다.'
    };
    
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '로그아웃 처리 중 오류가 발생했습니다.'
    };
    
    res.status(400).json(response);
  }
});

// 관리자 정보 확인
router.get('/me', authenticateAdmin, async (req: AdminAuthenticatedRequest, res: Response) => {
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
      error: error instanceof Error ? error.message : '사용자 정보 조회 중 오류가 발생했습니다.'
    };
    
    res.status(404).json(response);
  }
});

export default router;