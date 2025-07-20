import { getDatabaseConnection } from '../configs/database';
import { User, UserCreateRequest, UserUpdateRequest, UserFilters, PaginationParams, ApiResponse, PaginatedResponse } from '../types/database';
import bcrypt from 'bcrypt';

class UserService {
  private pool = getDatabaseConnection();

  // 사용자 생성
  async createUser(userData: UserCreateRequest): Promise<ApiResponse<User>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        // 이메일 중복 확인
        const [existingUsers] = await connection.execute(
          'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL',
          [userData.email]
        );

        if ((existingUsers as any[]).length > 0) {
          return {
            success: false,
            error: '이미 존재하는 이메일입니다.'
          };
        }

        // 비밀번호 해시화
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(userData.password, saltRounds);

        // 사용자 생성
        const [result] = await connection.execute(
          `INSERT INTO users (username, email, password_hash, user_type) 
           VALUES (?, ?, ?, ?)`,
          [userData.username, userData.email, passwordHash, userData.user_type || 'client']
        );

        const userId = (result as any).insertId;

        // 생성된 사용자 조회
        const [users] = await connection.execute(
          'SELECT * FROM users WHERE id = ?',
          [userId]
        );

        const user = (users as any[])[0];

        return {
          success: true,
          data: user,
          message: '사용자가 성공적으로 생성되었습니다.'
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('사용자 생성 오류:', error);
      return {
        success: false,
        error: '사용자 생성 중 오류가 발생했습니다.'
      };
    }
  }

  // ID로 사용자 조회
  async getUserById(id: number): Promise<ApiResponse<User>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        const [users] = await connection.execute(
          'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL',
          [id]
        );

        if ((users as any[]).length === 0) {
          return {
            success: false,
            error: '사용자를 찾을 수 없습니다.'
          };
        }

        return {
          success: true,
          data: (users as any[])[0]
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('사용자 조회 오류:', error);
      return {
        success: false,
        error: '사용자 조회 중 오류가 발생했습니다.'
      };
    }
  }

  // 사용자 목록 조회
  async getUsers(params: PaginationParams, filters: UserFilters = {}): Promise<ApiResponse<PaginatedResponse<User>>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        const { page, limit } = params;
        const offset = (page - 1) * limit;

        // WHERE 조건 구성
        const whereConditions: string[] = ['deleted_at IS NULL'];
        const queryParams: any[] = [];

        if (filters.user_type) {
          whereConditions.push('user_type = ?');
          queryParams.push(filters.user_type);
        }

        if (filters.user_status) {
          whereConditions.push('user_status = ?');
          queryParams.push(filters.user_status);
        }

        const whereClause = whereConditions.join(' AND ');

        // 전체 개수 조회
        const [countResult] = await connection.execute(
          `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`,
          queryParams
        );

        const total = (countResult as any[])[0].total;
        const totalPages = Math.ceil(total / limit);

        // 사용자 목록 조회
        const [users] = await connection.execute(
          `SELECT * FROM users WHERE ${whereClause} 
           ORDER BY created_at DESC LIMIT ? OFFSET ?`,
          [...queryParams, limit, offset]
        );

        return {
          success: true,
          data: {
            data: users as User[],
            pagination: {
              page,
              limit,
              total,
              totalPages
            }
          }
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('사용자 목록 조회 오류:', error);
      return {
        success: false,
        error: '사용자 목록 조회 중 오류가 발생했습니다.'
      };
    }
  }

  // 사용자 정보 수정
  async updateUser(id: number, userData: UserUpdateRequest): Promise<ApiResponse<User>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        // 사용자 존재 확인
        const [existingUsers] = await connection.execute(
          'SELECT id FROM users WHERE id = ? AND deleted_at IS NULL',
          [id]
        );

        if ((existingUsers as any[]).length === 0) {
          return {
            success: false,
            error: '사용자를 찾을 수 없습니다.'
          };
        }

        // 업데이트할 필드 구성
        const updateFields: string[] = [];
        const updateParams: any[] = [];

        if (userData.username) {
          updateFields.push('username = ?');
          updateParams.push(userData.username);
        }

        if (userData.email) {
          updateFields.push('email = ?');
          updateParams.push(userData.email);
        }

        if (userData.user_type) {
          updateFields.push('user_type = ?');
          updateParams.push(userData.user_type);
        }

        if (userData.user_status) {
          updateFields.push('user_status = ?');
          updateParams.push(userData.user_status);
        }

        if (updateFields.length === 0) {
          return {
            success: false,
            error: '수정할 데이터가 없습니다.'
          };
        }

        // 사용자 정보 업데이트
        await connection.execute(
          `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
          [...updateParams, id]
        );

        // 업데이트된 사용자 조회
        const [users] = await connection.execute(
          'SELECT * FROM users WHERE id = ?',
          [id]
        );

        return {
          success: true,
          data: (users as any[])[0],
          message: '사용자 정보가 성공적으로 수정되었습니다.'
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('사용자 수정 오류:', error);
      return {
        success: false,
        error: '사용자 수정 중 오류가 발생했습니다.'
      };
    }
  }

  // 사용자 삭제 (소프트 삭제)
  async deleteUser(id: number): Promise<ApiResponse<void>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        // 사용자 존재 확인
        const [existingUsers] = await connection.execute(
          'SELECT id FROM users WHERE id = ? AND deleted_at IS NULL',
          [id]
        );

        if ((existingUsers as any[]).length === 0) {
          return {
            success: false,
            error: '사용자를 찾을 수 없습니다.'
          };
        }

        // 소프트 삭제
        await connection.execute(
          'UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
          [id]
        );

        return {
          success: true,
          message: '사용자가 성공적으로 삭제되었습니다.'
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('사용자 삭제 오류:', error);
      return {
        success: false,
        error: '사용자 삭제 중 오류가 발생했습니다.'
      };
    }
  }

  // 사용자 검색
  async searchUsers(searchTerm: string): Promise<ApiResponse<User[]>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        const [users] = await connection.execute(
          `SELECT * FROM users 
           WHERE (username LIKE ? OR email LIKE ?) 
           AND deleted_at IS NULL 
           ORDER BY created_at DESC`,
          [`%${searchTerm}%`, `%${searchTerm}%`]
        );

        return {
          success: true,
          data: users as User[]
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('사용자 검색 오류:', error);
      return {
        success: false,
        error: '사용자 검색 중 오류가 발생했습니다.'
      };
    }
  }

  // 사용자 통계 조회
  async getUserStats(): Promise<ApiResponse<any>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        // 전체 사용자 수
        const [totalResult] = await connection.execute(
          'SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL'
        );

        // 사용자 타입별 통계
        const [typeStats] = await connection.execute(
          `SELECT user_type, COUNT(*) as count 
           FROM users WHERE deleted_at IS NULL 
           GROUP BY user_type`
        );

        // 사용자 상태별 통계
        const [statusStats] = await connection.execute(
          `SELECT user_status, COUNT(*) as count 
           FROM users WHERE deleted_at IS NULL 
           GROUP BY user_status`
        );

        // 최근 가입자 수 (최근 30일)
        const [recentResult] = await connection.execute(
          `SELECT COUNT(*) as recent 
           FROM users 
           WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
           AND deleted_at IS NULL`
        );

        return {
          success: true,
          data: {
            total: (totalResult as any[])[0].total,
            typeStats: typeStats as any[],
            statusStats: statusStats as any[],
            recentUsers: (recentResult as any[])[0].recent
          }
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('사용자 통계 조회 오류:', error);
      return {
        success: false,
        error: '사용자 통계 조회 중 오류가 발생했습니다.'
      };
    }
  }
}

export default new UserService(); 