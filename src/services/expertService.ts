import { getDatabaseConnection } from '../configs/database';
import { Expert, ExpertCreateRequest, ExpertUpdateRequest, ExpertFilters, ExpertListOptions, ExpertWithRelations, PaginationParams, ApiResponse, PaginatedResponse } from '../types/database';

class ExpertService {
  private pool = getDatabaseConnection();

  // 전문가 생성
  async createExpert(expertData: ExpertCreateRequest): Promise<ApiResponse<Expert>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        // 사용자 존재 확인
        const [users] = await connection.execute(
          'SELECT id FROM users WHERE id = ? AND deleted_at IS NULL',
          [expertData.user_id]
        );

        if ((users as any[]).length === 0) {
          return {
            success: false,
            error: '존재하지 않는 사용자입니다.'
          };
        }

        // 그룹 존재 확인 (그룹 ID가 제공된 경우)
        if (expertData.group_id) {
          const [groups] = await connection.execute(
            'SELECT id FROM groups WHERE id = ? AND deleted_at IS NULL',
            [expertData.group_id]
          );

          if ((groups as any[]).length === 0) {
            return {
              success: false,
              error: '존재하지 않는 그룹입니다.'
            };
          }
        }

        // 전문가 생성
        const [result] = await connection.execute(
          `INSERT INTO experts (user_id, group_id, expert_name, expert_title, expert_bio, expert_avatar, expert_website, expert_email, expert_phone, expert_location) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            expertData.user_id,
            expertData.group_id,
            expertData.expert_name,
            expertData.expert_title,
            expertData.expert_bio,
            expertData.expert_avatar,
            expertData.expert_website,
            expertData.expert_email,
            expertData.expert_phone,
            expertData.expert_location
          ]
        );

        const expertId = (result as any).insertId;

        // 생성된 전문가 조회
        const [experts] = await connection.execute(
          'SELECT * FROM experts WHERE id = ?',
          [expertId]
        );

        const expert = (experts as any[])[0];

        return {
          success: true,
          data: expert,
          message: '전문가가 성공적으로 생성되었습니다.'
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('전문가 생성 오류:', error);
      return {
        success: false,
        error: '전문가 생성 중 오류가 발생했습니다.'
      };
    }
  }

  // ID로 전문가 조회
  async getExpertById(id: number): Promise<ApiResponse<Expert>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        const [experts] = await connection.execute(
          'SELECT * FROM experts WHERE id = ? AND deleted_at IS NULL',
          [id]
        );

        if ((experts as any[]).length === 0) {
          return {
            success: false,
            error: '전문가를 찾을 수 없습니다.'
          };
        }

        return {
          success: true,
          data: (experts as any[])[0]
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('전문가 조회 오류:', error);
      return {
        success: false,
        error: '전문가 조회 중 오류가 발생했습니다.'
      };
    }
  }

  // 전문가 상세 조회 (관련 데이터 포함)
  async getExpertDetailById(id: number): Promise<ApiResponse<ExpertWithRelations>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        // 전문가 기본 정보 조회
        const [experts] = await connection.execute(
          'SELECT * FROM experts WHERE id = ? AND deleted_at IS NULL',
          [id]
        );

        if ((experts as any[]).length === 0) {
          return {
            success: false,
            error: '전문가를 찾을 수 없습니다.'
          };
        }

        const expert = (experts as any[])[0];

        // 사용자 정보 조회
        const [users] = await connection.execute(
          'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL',
          [expert.user_id]
        );

        // 그룹 정보 조회 (그룹이 있는 경우)
        let group = null;
        if (expert.group_id) {
          const [groups] = await connection.execute(
            'SELECT * FROM groups WHERE id = ? AND deleted_at IS NULL',
            [expert.group_id]
          );
          group = (groups as any[])[0] || null;
        }

        // 전문가의 콘텐츠 조회
        const [contents] = await connection.execute(
          `SELECT c.* FROM contents c 
           INNER JOIN expert_contents ec ON c.id = ec.content_id 
           WHERE ec.expert_id = ? AND c.deleted_at IS NULL 
           ORDER BY c.created_at DESC`,
          [id]
        );

        // 전문가가 사용하는 AI 서비스 조회
        const [aiServices] = await connection.execute(
          `SELECT ais.* FROM ai_services ais 
           INNER JOIN expert_ai_services eas ON ais.id = eas.ai_service_id 
           WHERE eas.expert_id = ? AND ais.deleted_at IS NULL`,
          [id]
        );

        const expertWithRelations: ExpertWithRelations = {
          ...expert,
          user: (users as any[])[0] || null,
          group,
          contents: contents as any[],
          ai_services: aiServices as any[]
        };

        return {
          success: true,
          data: expertWithRelations
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('전문가 상세 조회 오류:', error);
      return {
        success: false,
        error: '전문가 상세 조회 중 오류가 발생했습니다.'
      };
    }
  }

  // 전문가 목록 조회
  async getExperts(params: PaginationParams, filters: ExpertFilters = {}, options: ExpertListOptions = {}): Promise<ApiResponse<PaginatedResponse<ExpertWithRelations>>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        const { page, limit } = params;
        const offset = (page - 1) * limit;

        // WHERE 조건 구성
        const whereConditions: string[] = ['e.deleted_at IS NULL'];
        const queryParams: any[] = [];

        if (filters.expert_status) {
          whereConditions.push('e.expert_status = ?');
          queryParams.push(filters.expert_status);
        }

        if (filters.expert_location) {
          whereConditions.push('e.expert_location LIKE ?');
          queryParams.push(`%${filters.expert_location}%`);
        }

        if (filters.group_id) {
          whereConditions.push('e.group_id = ?');
          queryParams.push(filters.group_id);
        }

        const whereClause = whereConditions.join(' AND ');

        // 기본 쿼리 구성
        let selectClause = 'SELECT DISTINCT e.*';
        let joinClause = 'FROM experts e';

        // 관련 데이터 포함 옵션에 따른 JOIN 추가
        if (options.include_user) {
          selectClause += ', u.username, u.email, u.user_type, u.user_status';
          joinClause += ' LEFT JOIN users u ON e.user_id = u.id AND u.deleted_at IS NULL';
        }

        if (options.include_group) {
          selectClause += ', g.group_name, g.group_description, g.group_logo';
          joinClause += ' LEFT JOIN groups g ON e.group_id = g.id AND g.deleted_at IS NULL';
        }

        // 전체 개수 조회
        const [countResult] = await connection.execute(
          `SELECT COUNT(DISTINCT e.id) as total FROM experts e WHERE ${whereClause}`,
          queryParams
        );

        const total = (countResult as any[])[0].total;
        const totalPages = Math.ceil(total / limit);

        // 전문가 목록 조회
        const [experts] = await connection.execute(
          `${selectClause} ${joinClause} WHERE ${whereClause} 
           ORDER BY e.created_at DESC LIMIT ? OFFSET ?`,
          [...queryParams, limit, offset]
        );

        // 관련 데이터 포함 옵션에 따른 추가 데이터 조회
        const expertsWithRelations: ExpertWithRelations[] = [];

        for (const expert of experts as any[]) {
          const expertWithRelations: ExpertWithRelations = { ...expert };

          if (options.include_contents) {
            const [contents] = await connection.execute(
              `SELECT c.* FROM contents c 
               INNER JOIN expert_contents ec ON c.id = ec.content_id 
               WHERE ec.expert_id = ? AND c.deleted_at IS NULL 
               ORDER BY c.created_at DESC LIMIT 5`,
              [expert.id]
            );
            expertWithRelations.contents = contents as any[];
          }

          if (options.include_ai_services) {
            const [aiServices] = await connection.execute(
              `SELECT ais.* FROM ai_services ais 
               INNER JOIN expert_ai_services eas ON ais.id = eas.ai_service_id 
               WHERE eas.expert_id = ? AND ais.deleted_at IS NULL`,
              [expert.id]
            );
            expertWithRelations.ai_services = aiServices as any[];
          }

          expertsWithRelations.push(expertWithRelations);
        }

        return {
          success: true,
          data: {
            data: expertsWithRelations,
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
      console.error('전문가 목록 조회 오류:', error);
      return {
        success: false,
        error: '전문가 목록 조회 중 오류가 발생했습니다.'
      };
    }
  }

  // 전문가 정보 수정
  async updateExpert(id: number, expertData: ExpertUpdateRequest): Promise<ApiResponse<Expert>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        // 전문가 존재 확인
        const [existingExperts] = await connection.execute(
          'SELECT id FROM experts WHERE id = ? AND deleted_at IS NULL',
          [id]
        );

        if ((existingExperts as any[]).length === 0) {
          return {
            success: false,
            error: '전문가를 찾을 수 없습니다.'
          };
        }

        // 업데이트할 필드 구성
        const updateFields: string[] = [];
        const updateParams: any[] = [];

        if (expertData.group_id !== undefined) {
          updateFields.push('group_id = ?');
          updateParams.push(expertData.group_id);
        }

        if (expertData.expert_name) {
          updateFields.push('expert_name = ?');
          updateParams.push(expertData.expert_name);
        }

        if (expertData.expert_title !== undefined) {
          updateFields.push('expert_title = ?');
          updateParams.push(expertData.expert_title);
        }

        if (expertData.expert_bio !== undefined) {
          updateFields.push('expert_bio = ?');
          updateParams.push(expertData.expert_bio);
        }

        if (expertData.expert_avatar !== undefined) {
          updateFields.push('expert_avatar = ?');
          updateParams.push(expertData.expert_avatar);
        }

        if (expertData.expert_website !== undefined) {
          updateFields.push('expert_website = ?');
          updateParams.push(expertData.expert_website);
        }

        if (expertData.expert_email !== undefined) {
          updateFields.push('expert_email = ?');
          updateParams.push(expertData.expert_email);
        }

        if (expertData.expert_phone !== undefined) {
          updateFields.push('expert_phone = ?');
          updateParams.push(expertData.expert_phone);
        }

        if (expertData.expert_location !== undefined) {
          updateFields.push('expert_location = ?');
          updateParams.push(expertData.expert_location);
        }

        if (expertData.expert_status) {
          updateFields.push('expert_status = ?');
          updateParams.push(expertData.expert_status);
        }

        if (updateFields.length === 0) {
          return {
            success: false,
            error: '수정할 데이터가 없습니다.'
          };
        }

        // 전문가 정보 업데이트
        await connection.execute(
          `UPDATE experts SET ${updateFields.join(', ')} WHERE id = ?`,
          [...updateParams, id]
        );

        // 업데이트된 전문가 조회
        const [experts] = await connection.execute(
          'SELECT * FROM experts WHERE id = ?',
          [id]
        );

        return {
          success: true,
          data: (experts as any[])[0],
          message: '전문가 정보가 성공적으로 수정되었습니다.'
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('전문가 수정 오류:', error);
      return {
        success: false,
        error: '전문가 수정 중 오류가 발생했습니다.'
      };
    }
  }

  // 전문가 삭제 (소프트 삭제)
  async deleteExpert(id: number): Promise<ApiResponse<void>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        // 전문가 존재 확인
        const [existingExperts] = await connection.execute(
          'SELECT id FROM experts WHERE id = ? AND deleted_at IS NULL',
          [id]
        );

        if ((existingExperts as any[]).length === 0) {
          return {
            success: false,
            error: '전문가를 찾을 수 없습니다.'
          };
        }

        // 소프트 삭제
        await connection.execute(
          'UPDATE experts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
          [id]
        );

        return {
          success: true,
          message: '전문가가 성공적으로 삭제되었습니다.'
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('전문가 삭제 오류:', error);
      return {
        success: false,
        error: '전문가 삭제 중 오류가 발생했습니다.'
      };
    }
  }

  // 전문가 검색
  async searchExperts(searchTerm: string): Promise<ApiResponse<Expert[]>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        const [experts] = await connection.execute(
          `SELECT * FROM experts 
           WHERE (expert_name LIKE ? OR expert_title LIKE ? OR expert_bio LIKE ?) 
           AND deleted_at IS NULL 
           ORDER BY created_at DESC`,
          [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
        );

        return {
          success: true,
          data: experts as Expert[]
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('전문가 검색 오류:', error);
      return {
        success: false,
        error: '전문가 검색 중 오류가 발생했습니다.'
      };
    }
  }

  // 전문가 통계 조회
  async getExpertStats(): Promise<ApiResponse<any>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        // 전체 전문가 수
        const [totalResult] = await connection.execute(
          'SELECT COUNT(*) as total FROM experts WHERE deleted_at IS NULL'
        );

        // 전문가 상태별 통계
        const [statusStats] = await connection.execute(
          `SELECT expert_status, COUNT(*) as count 
           FROM experts WHERE deleted_at IS NULL 
           GROUP BY expert_status`
        );

        // 지역별 전문가 수
        const [locationStats] = await connection.execute(
          `SELECT expert_location, COUNT(*) as count 
           FROM experts WHERE deleted_at IS NULL AND expert_location IS NOT NULL 
           GROUP BY expert_location 
           ORDER BY count DESC 
           LIMIT 10`
        );

        // 최근 등록된 전문가 수 (최근 30일)
        const [recentResult] = await connection.execute(
          `SELECT COUNT(*) as recent 
           FROM experts 
           WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
           AND deleted_at IS NULL`
        );

        return {
          success: true,
          data: {
            total: (totalResult as any[])[0].total,
            statusStats: statusStats as any[],
            locationStats: locationStats as any[],
            recentExperts: (recentResult as any[])[0].recent
          }
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('전문가 통계 조회 오류:', error);
      return {
        success: false,
        error: '전문가 통계 조회 중 오류가 발생했습니다.'
      };
    }
  }
}

export default new ExpertService(); 