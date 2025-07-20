import { getDatabaseConnection } from '../configs/database';
import { Group, GroupCreateRequest, GroupUpdateRequest, GroupFilters, PaginationParams, ApiResponse, PaginatedResponse } from '../types/database';

class GroupService {
  private pool = getDatabaseConnection();

  // 그룹 생성
  async createGroup(groupData: GroupCreateRequest): Promise<ApiResponse<Group>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        // 그룹명 중복 확인
        const [existingGroups] = await connection.execute(
          'SELECT id FROM groups WHERE group_name = ? AND deleted_at IS NULL',
          [groupData.group_name]
        );

        if ((existingGroups as any[]).length > 0) {
          return {
            success: false,
            error: '이미 존재하는 그룹명입니다.'
          };
        }

        // 그룹 생성
        const [result] = await connection.execute(
          `INSERT INTO groups (group_name, group_description, group_logo, group_website, group_email, group_phone, group_address) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            groupData.group_name,
            groupData.group_description,
            groupData.group_logo,
            groupData.group_website,
            groupData.group_email,
            groupData.group_phone,
            groupData.group_address
          ]
        );

        const groupId = (result as any).insertId;

        // 생성된 그룹 조회
        const [groups] = await connection.execute(
          'SELECT * FROM groups WHERE id = ?',
          [groupId]
        );

        const group = (groups as any[])[0];

        return {
          success: true,
          data: group,
          message: '그룹이 성공적으로 생성되었습니다.'
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('그룹 생성 오류:', error);
      return {
        success: false,
        error: '그룹 생성 중 오류가 발생했습니다.'
      };
    }
  }

  // ID로 그룹 조회
  async getGroupById(id: number): Promise<ApiResponse<Group>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        const [groups] = await connection.execute(
          'SELECT * FROM groups WHERE id = ? AND deleted_at IS NULL',
          [id]
        );

        if ((groups as any[]).length === 0) {
          return {
            success: false,
            error: '그룹을 찾을 수 없습니다.'
          };
        }

        return {
          success: true,
          data: (groups as any[])[0]
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('그룹 조회 오류:', error);
      return {
        success: false,
        error: '그룹 조회 중 오류가 발생했습니다.'
      };
    }
  }

  // 그룹 목록 조회
  async getGroups(params: PaginationParams, filters: GroupFilters = {}): Promise<ApiResponse<PaginatedResponse<Group>>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        const { page, limit } = params;
        const offset = (page - 1) * limit;

        // WHERE 조건 구성
        const whereConditions: string[] = ['deleted_at IS NULL'];
        const queryParams: any[] = [];

        if (filters.group_status) {
          whereConditions.push('group_status = ?');
          queryParams.push(filters.group_status);
        }

        const whereClause = whereConditions.join(' AND ');

        // 전체 개수 조회
        const [countResult] = await connection.execute(
          `SELECT COUNT(*) as total FROM groups WHERE ${whereClause}`,
          queryParams
        );

        const total = (countResult as any[])[0].total;
        const totalPages = Math.ceil(total / limit);

        // 그룹 목록 조회
        const [groups] = await connection.execute(
          `SELECT * FROM groups WHERE ${whereClause} 
           ORDER BY created_at DESC LIMIT ? OFFSET ?`,
          [...queryParams, limit, offset]
        );

        return {
          success: true,
          data: {
            data: groups as Group[],
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
      console.error('그룹 목록 조회 오류:', error);
      return {
        success: false,
        error: '그룹 목록 조회 중 오류가 발생했습니다.'
      };
    }
  }

  // 그룹 정보 수정
  async updateGroup(id: number, groupData: GroupUpdateRequest): Promise<ApiResponse<Group>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        // 그룹 존재 확인
        const [existingGroups] = await connection.execute(
          'SELECT id FROM groups WHERE id = ? AND deleted_at IS NULL',
          [id]
        );

        if ((existingGroups as any[]).length === 0) {
          return {
            success: false,
            error: '그룹을 찾을 수 없습니다.'
          };
        }

        // 업데이트할 필드 구성
        const updateFields: string[] = [];
        const updateParams: any[] = [];

        if (groupData.group_name) {
          updateFields.push('group_name = ?');
          updateParams.push(groupData.group_name);
        }

        if (groupData.group_description !== undefined) {
          updateFields.push('group_description = ?');
          updateParams.push(groupData.group_description);
        }

        if (groupData.group_logo !== undefined) {
          updateFields.push('group_logo = ?');
          updateParams.push(groupData.group_logo);
        }

        if (groupData.group_website !== undefined) {
          updateFields.push('group_website = ?');
          updateParams.push(groupData.group_website);
        }

        if (groupData.group_email !== undefined) {
          updateFields.push('group_email = ?');
          updateParams.push(groupData.group_email);
        }

        if (groupData.group_phone !== undefined) {
          updateFields.push('group_phone = ?');
          updateParams.push(groupData.group_phone);
        }

        if (groupData.group_address !== undefined) {
          updateFields.push('group_address = ?');
          updateParams.push(groupData.group_address);
        }

        if (groupData.group_status) {
          updateFields.push('group_status = ?');
          updateParams.push(groupData.group_status);
        }

        if (updateFields.length === 0) {
          return {
            success: false,
            error: '수정할 데이터가 없습니다.'
          };
        }

        // 그룹 정보 업데이트
        await connection.execute(
          `UPDATE groups SET ${updateFields.join(', ')} WHERE id = ?`,
          [...updateParams, id]
        );

        // 업데이트된 그룹 조회
        const [groups] = await connection.execute(
          'SELECT * FROM groups WHERE id = ?',
          [id]
        );

        return {
          success: true,
          data: (groups as any[])[0],
          message: '그룹 정보가 성공적으로 수정되었습니다.'
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('그룹 수정 오류:', error);
      return {
        success: false,
        error: '그룹 수정 중 오류가 발생했습니다.'
      };
    }
  }

  // 그룹 삭제 (소프트 삭제)
  async deleteGroup(id: number): Promise<ApiResponse<void>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        // 그룹 존재 확인
        const [existingGroups] = await connection.execute(
          'SELECT id FROM groups WHERE id = ? AND deleted_at IS NULL',
          [id]
        );

        if ((existingGroups as any[]).length === 0) {
          return {
            success: false,
            error: '그룹을 찾을 수 없습니다.'
          };
        }

        // 소프트 삭제
        await connection.execute(
          'UPDATE groups SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
          [id]
        );

        return {
          success: true,
          message: '그룹이 성공적으로 삭제되었습니다.'
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('그룹 삭제 오류:', error);
      return {
        success: false,
        error: '그룹 삭제 중 오류가 발생했습니다.'
      };
    }
  }

  // 그룹 검색
  async searchGroups(searchTerm: string): Promise<ApiResponse<Group[]>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        const [groups] = await connection.execute(
          `SELECT * FROM groups 
           WHERE (group_name LIKE ? OR group_description LIKE ?) 
           AND deleted_at IS NULL 
           ORDER BY created_at DESC`,
          [`%${searchTerm}%`, `%${searchTerm}%`]
        );

        return {
          success: true,
          data: groups as Group[]
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('그룹 검색 오류:', error);
      return {
        success: false,
        error: '그룹 검색 중 오류가 발생했습니다.'
      };
    }
  }

  // 그룹 통계 조회
  async getGroupStats(): Promise<ApiResponse<any>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        // 전체 그룹 수
        const [totalResult] = await connection.execute(
          'SELECT COUNT(*) as total FROM groups WHERE deleted_at IS NULL'
        );

        // 그룹 상태별 통계
        const [statusStats] = await connection.execute(
          `SELECT group_status, COUNT(*) as count 
           FROM groups WHERE deleted_at IS NULL 
           GROUP BY group_status`
        );

        // 최근 생성된 그룹 수 (최근 30일)
        const [recentResult] = await connection.execute(
          `SELECT COUNT(*) as recent 
           FROM groups 
           WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
           AND deleted_at IS NULL`
        );

        // 그룹별 전문가 수
        const [expertStats] = await connection.execute(
          `SELECT g.group_name, COUNT(e.id) as expert_count 
           FROM groups g 
           LEFT JOIN experts e ON g.id = e.group_id AND e.deleted_at IS NULL 
           WHERE g.deleted_at IS NULL 
           GROUP BY g.id, g.group_name`
        );

        return {
          success: true,
          data: {
            total: (totalResult as any[])[0].total,
            statusStats: statusStats as any[],
            recentGroups: (recentResult as any[])[0].recent,
            expertStats: expertStats as any[]
          }
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('그룹 통계 조회 오류:', error);
      return {
        success: false,
        error: '그룹 통계 조회 중 오류가 발생했습니다.'
      };
    }
  }
}

export default new GroupService(); 