import { getDatabaseConnection } from '../configs/database';
import { User, ApiResponse, PaginationParams, PaginatedResponse, UserFilters } from '../types/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class UserService {
  private db = getDatabaseConnection();

  // 사용자 생성
  async createUser(userData: User): Promise<ApiResponse<User>> {
    try {
      const [result] = await this.db.execute<ResultSetHeader>(
        'INSERT INTO users (username, email, password_hash, user_status) VALUES (?, ?, ?, ?)',
        [userData.username, userData.email, userData.password_hash, userData.user_status]
      );

      const newUser = { ...userData, id: result.insertId };
      return {
        success: true,
        data: newUser,
        message: '사용자가 성공적으로 생성되었습니다.'
      };
    } catch (error) {
      return {
        success: false,
        error: `사용자 생성 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // 사용자 조회 (ID로)
  async getUserById(id: number): Promise<ApiResponse<User>> {
    try {
      const [rows] = await this.db.execute<RowDataPacket[]>(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );

      if (rows.length === 0) {
        return {
          success: false,
          error: '사용자를 찾을 수 없습니다.'
        };
      }

      return {
        success: true,
        data: rows[0] as User
      };
    } catch (error) {
      return {
        success: false,
        error: `사용자 조회 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // 사용자 조회 (이메일로)
  async getUserByEmail(email: string): Promise<ApiResponse<User>> {
    try {
      const [rows] = await this.db.execute<RowDataPacket[]>(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (rows.length === 0) {
        return {
          success: false,
          error: '사용자를 찾을 수 없습니다.'
        };
      }

      return {
        success: true,
        data: rows[0] as User
      };
    } catch (error) {
      return {
        success: false,
        error: `사용자 조회 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // 사용자 목록 조회 (페이지네이션)
  async getUsers(params: PaginationParams, filters?: UserFilters): Promise<ApiResponse<PaginatedResponse<User>>> {
    try {
      const { page, limit } = params;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE 1=1';
      const queryParams: any[] = [];

      if (filters?.user_status) {
        whereClause += ' AND user_status = ?';
        queryParams.push(filters.user_status);
      }

      if (filters?.email) {
        whereClause += ' AND email LIKE ?';
        queryParams.push(`%${filters.email}%`);
      }

      // 전체 개수 조회
      const [countRows] = await this.db.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as total FROM users ${whereClause}`,
        queryParams
      );
      const total = countRows[0]?.['total'] as number || 0;

      // 데이터 조회
      const [rows] = await this.db.execute<RowDataPacket[]>(
        `SELECT * FROM users ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...queryParams, limit, offset]
      );

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          data: rows as User[],
          pagination: {
            page,
            limit,
            total,
            totalPages
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `사용자 목록 조회 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // 사용자 정보 수정
  async updateUser(id: number, userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (userData.username !== undefined) {
        updateFields.push('username = ?');
        updateValues.push(userData.username);
      }
      if (userData.email !== undefined) {
        updateFields.push('email = ?');
        updateValues.push(userData.email);
      }
      if (userData.password_hash !== undefined) {
        updateFields.push('password_hash = ?');
        updateValues.push(userData.password_hash);
      }
      if (userData.user_status !== undefined) {
        updateFields.push('user_status = ?');
        updateValues.push(userData.user_status);
      }

      if (updateFields.length === 0) {
        return {
          success: false,
          error: '수정할 데이터가 없습니다.'
        };
      }

      updateValues.push(id);

      const [result] = await this.db.execute<ResultSetHeader>(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      if (result.affectedRows === 0) {
        return {
          success: false,
          error: '사용자를 찾을 수 없습니다.'
        };
      }

      // 수정된 사용자 정보 조회
      const getUserResult = await this.getUserById(id);
      return getUserResult;
    } catch (error) {
      return {
        success: false,
        error: `사용자 수정 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // 사용자 삭제
  async deleteUser(id: number): Promise<ApiResponse<null>> {
    try {
      const [result] = await this.db.execute<ResultSetHeader>(
        'DELETE FROM users WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        return {
          success: false,
          error: '사용자를 찾을 수 없습니다.'
        };
      }

      return {
        success: true,
        message: '사용자가 성공적으로 삭제되었습니다.'
      };
    } catch (error) {
      return {
        success: false,
        error: `사용자 삭제 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export default new UserService(); 