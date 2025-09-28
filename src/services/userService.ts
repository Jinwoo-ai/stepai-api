import mysql from 'mysql2/promise';
import { dbConfig } from '../configs/database';
import { TokenService } from '../utils/jwt';
import { WebhookService } from './webhookService';
import { 
  User, 
  UserSns,
  UserWithSns,
  UserCreateRequest, 
  UserUpdateRequest, 
  UserFilters,
  PaginatedResponse,
  PaginationParams,
  SnsLoginRequest
} from '../types/database';

interface LoginResponse {
  user: UserWithSns;
  token: string;
  expiresAt: Date;
}

export class UserService {
  private async getConnection() {
    return await mysql.createConnection(dbConfig);
  }

  // SNS 로그인/회원가입
  async snsLogin(data: SnsLoginRequest): Promise<LoginResponse> {
    const connection = await this.getConnection();
    try {
      // 기존 SNS 계정 확인
      const [snsRows] = await connection.execute(
        'SELECT user_id FROM user_sns WHERE sns_type = ? AND sns_user_id = ?',
        [data.sns_type, data.sns_user_id]
      );

      let userId: number;
      let isNewUser = false;

      if ((snsRows as any[]).length > 0) {
        // 기존 사용자
        userId = (snsRows as any[])[0].user_id;
      } else {
        // 새 사용자 생성 - 필수 필드만 체크
        if (!data.name || !data.email || !data.sns_type || !data.sns_user_id) {
          throw new Error('필수 정보가 누락되었습니다. (name, email, sns_type, sns_user_id)');
        }
        
        const [userResult] = await connection.execute(
          `INSERT INTO users (name, email, industry, job_role, job_level, experience_years) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            data.name, 
            data.email, 
            data.industry || null, 
            data.job_role || null, 
            data.job_level || null, 
            data.experience_years || null
          ]
        );

        userId = (userResult as any).insertId;
        isNewUser = true;

        // SNS 정보 저장
        await connection.execute(
          'INSERT INTO user_sns (user_id, sns_type, sns_user_id) VALUES (?, ?, ?)',
          [userId, data.sns_type, data.sns_user_id]
        );
      }

      // 액세스 토큰 생성
      const { token, expiresAt } = TokenService.generateToken();
      await connection.execute(
        'INSERT INTO access_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [userId, token, expiresAt]
      );

      const user = await this.getById(userId);
      
      // 새 사용자인 경우 웹훅 전송
      if (isNewUser) {
        // 웹훅은 비동기로 전송하되 에러가 발생해도 회원가입 프로세스는 계속 진행
        WebhookService.sendUserCreatedWebhook({
          id: user.id,
          name: user.name,
          email: user.email,
          industry: user.industry,
          jobRole: user.job_role,
          jobLevel: user.job_level,
          experienceYears: user.experience_years,
          userType: user.user_type,
          userStatus: user.user_status,
          createdAt: user.created_at.toISOString(),
          updatedAt: user.updated_at.toISOString()
        }).catch(error => {
          console.error('웹훅 전송 중 오류 발생:', error);
        });
      }
      
      return { user, token, expiresAt };
    } finally {
      await connection.end();
    }
  }

  // ID로 사용자 조회 (SNS 정보 포함)
  async getById(id: number): Promise<UserWithSns> {
    const connection = await this.getConnection();
    try {
      const [userRows] = await connection.execute(
        'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL',
        [id]
      );
      
      const users = userRows as User[];
      if (users.length === 0) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      const [snsRows] = await connection.execute(
        'SELECT * FROM user_sns WHERE user_id = ?',
        [id]
      );

      const user = users[0] as UserWithSns;
      user.sns_accounts = snsRows as UserSns[];
      
      return user;
    } finally {
      await connection.end();
    }
  }

  // 사용자 목록 조회 (페이지네이션)
  async getList(
    pagination: PaginationParams,
    filters: UserFilters = {}
  ): Promise<PaginatedResponse<UserWithSns>> {
    const connection = await this.getConnection();
    try {
      let whereClause = 'WHERE u.deleted_at IS NULL';
      const params: any[] = [];

      if (filters.user_type) {
        whereClause += ' AND u.user_type = ?';
        params.push(filters.user_type);
      }

      if (filters.user_status) {
        whereClause += ' AND u.user_status = ?';
        params.push(filters.user_status);
      }

      if (filters.sns_type) {
        whereClause += ' AND s.sns_type = ?';
        params.push(filters.sns_type);
      }

      if (filters.industry) {
        whereClause += ' AND u.industry = ?';
        params.push(filters.industry);
      }

      if (filters.job_role) {
        whereClause += ' AND u.job_role = ?';
        params.push(filters.job_role);
      }

      // 총 개수 조회
      const [countRows] = await connection.execute(
        `SELECT COUNT(DISTINCT u.id) as total 
         FROM users u 
         LEFT JOIN user_sns s ON u.id = s.user_id 
         ${whereClause}`,
        params
      );
      const total = (countRows as any)[0].total;

      // 데이터 조회
      const offset = (pagination.page - 1) * pagination.limit;
      const [rows] = await connection.execute(
        `SELECT u.*, 
                GROUP_CONCAT(CONCAT(s.sns_type, ':', s.sns_user_id) SEPARATOR ',') as sns_info
         FROM users u 
         LEFT JOIN user_sns s ON u.id = s.user_id 
         ${whereClause}
         GROUP BY u.id
         ORDER BY u.created_at DESC 
         LIMIT ? OFFSET ?`,
        [...params, pagination.limit, offset]
      );

      const users = (rows as any[]).map(row => {
        const user = { ...row } as UserWithSns;
        if (row.sns_info) {
          user.sns_accounts = row.sns_info.split(',').map((info: string) => {
            const [sns_type, sns_user_id] = info.split(':');
            return { sns_type, sns_user_id };
          });
        } else {
          user.sns_accounts = [];
        }
        delete (user as any).sns_info;
        return user;
      });

      return {
        data: users,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit)
        }
      };
    } finally {
      await connection.end();
    }
  }

  // 사용자 수정
  async update(id: number, data: UserUpdateRequest): Promise<UserWithSns> {
    const connection = await this.getConnection();
    try {
      const updateFields: string[] = [];
      const params: any[] = [];

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${key} = ?`);
          params.push(value);
        }
      });

      if (updateFields.length === 0) {
        throw new Error('수정할 데이터가 없습니다.');
      }

      params.push(id);

      await connection.execute(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        params
      );

      return await this.getById(id);
    } finally {
      await connection.end();
    }
  }

  // 사용자 삭제 (소프트 삭제)
  async delete(id: number): Promise<void> {
    const connection = await this.getConnection();
    try {
      await connection.execute(
        'UPDATE users SET deleted_at = NOW() WHERE id = ?',
        [id]
      );
    } finally {
      await connection.end();
    }
  }

  // 회원탈퇴 (본인 계정)
  async withdraw(userId: number): Promise<void> {
    const connection = await this.getConnection();
    try {
      await connection.beginTransaction();

      // 사용자 정보 소프트 삭제
      await connection.execute(
        'UPDATE users SET user_status = "deleted", deleted_at = NOW() WHERE id = ?',
        [userId]
      );

      // 모든 액세스 토큰 삭제
      await connection.execute(
        'DELETE FROM access_tokens WHERE user_id = ?',
        [userId]
      );

      // 사용자 관련 데이터는 유지 (리뷰, 즐겨찾기 등)
      // 필요시 추가 정리 작업 수행

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      await connection.end();
    }
  }

  // 토큰 무효화 (로그아웃)
  async logout(token: string): Promise<void> {
    const connection = await this.getConnection();
    try {
      await connection.execute(
        'DELETE FROM access_tokens WHERE token = ?',
        [token]
      );
    } finally {
      await connection.end();
    }
  }

  // 통계
  async getStats(): Promise<Record<string, number>> {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN user_status = 'active' THEN 1 END) as active_users,
          COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_signups
        FROM users 
        WHERE deleted_at IS NULL
      `);

      return (rows as any[])[0];
    } finally {
      await connection.end();
    }
  }
}

export const userService = new UserService();