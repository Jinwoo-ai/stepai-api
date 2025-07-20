import { getDatabaseConnection } from '../configs/database';
import { AIService, ApiResponse, PaginationParams, PaginatedResponse, AIServiceFilters, AIServiceCreateRequest } from '../types/database';

class AIServiceService {
  private pool = getDatabaseConnection();

  // AI 서비스 생성
  async createAIService(serviceData: AIServiceCreateRequest): Promise<ApiResponse<AIService>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        // AI 서비스 생성
        const [result] = await connection.execute(
          `INSERT INTO ai_services (ai_name, ai_description, ai_type, nationality) 
           VALUES (?, ?, ?, ?)`,
          [
            serviceData.ai_name,
            serviceData.ai_description,
            serviceData.ai_type,
            serviceData.nationality
          ]
        );

        const serviceId = (result as any).insertId;

        // 생성된 AI 서비스 조회
        const [services] = await connection.execute(
          'SELECT * FROM ai_services WHERE id = ?',
          [serviceId]
        );

        const service = (services as any[])[0];

        return {
          success: true,
          data: service,
          message: 'AI 서비스가 성공적으로 생성되었습니다.'
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('AI 서비스 생성 오류:', error);
      return {
        success: false,
        error: 'AI 서비스 생성 중 오류가 발생했습니다.'
      };
    }
  }

  // ID로 AI 서비스 조회
  async getAIServiceById(id: number): Promise<ApiResponse<AIService>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        const [services] = await connection.execute(
          'SELECT * FROM ai_services WHERE id = ? AND deleted_at IS NULL',
          [id]
        );

        if ((services as any[]).length === 0) {
          return {
            success: false,
            error: 'AI 서비스를 찾을 수 없습니다.'
          };
        }

        return {
          success: true,
          data: (services as any[])[0]
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('AI 서비스 조회 오류:', error);
      return {
        success: false,
        error: 'AI 서비스 조회 중 오류가 발생했습니다.'
      };
    }
  }

  // AI 서비스 상세 조회 (관련 데이터 포함)
  async getAIServiceDetailById(id: number): Promise<ApiResponse<any>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        // AI 서비스 기본 정보 조회
        const [services] = await connection.execute(
          'SELECT * FROM ai_services WHERE id = ? AND deleted_at IS NULL',
          [id]
        );

        if ((services as any[]).length === 0) {
          return {
            success: false,
            error: 'AI 서비스를 찾을 수 없습니다.'
          };
        }

        const service = (services as any[])[0];

        // AI 서비스를 사용하는 전문가 조회
        const [experts] = await connection.execute(
          `SELECT e.* FROM experts e 
           INNER JOIN expert_ai_services eas ON e.id = eas.expert_id 
           WHERE eas.ai_service_id = ? AND e.deleted_at IS NULL`,
          [id]
        );

        // AI 서비스로 만든 콘텐츠 조회
        const [contents] = await connection.execute(
          `SELECT c.* FROM contents c 
           INNER JOIN content_ai_services cas ON c.id = cas.content_id 
           WHERE cas.ai_service_id = ? AND c.deleted_at IS NULL`,
          [id]
        );

        const serviceDetail = {
          ...service,
          experts: experts as any[],
          contents: contents as any[]
        };

        return {
          success: true,
          data: serviceDetail
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('AI 서비스 상세 조회 오류:', error);
      return {
        success: false,
        error: 'AI 서비스 상세 조회 중 오류가 발생했습니다.'
      };
    }
  }

  // AI 서비스 목록 조회
  async getAIServices(params: PaginationParams, filters: AIServiceFilters = {}): Promise<ApiResponse<PaginatedResponse<AIService>>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        const { page, limit } = params;
        const offset = (page - 1) * limit;

        // WHERE 조건 구성
        const whereConditions: string[] = ['deleted_at IS NULL'];
        const queryParams: any[] = [];

        if (filters.ai_status) {
          whereConditions.push('ai_status = ?');
          queryParams.push(filters.ai_status);
        }

        if (filters.ai_type) {
          whereConditions.push('ai_type = ?');
          queryParams.push(filters.ai_type);
        }

        if (filters.nationality) {
          whereConditions.push('nationality = ?');
          queryParams.push(filters.nationality);
        }

        const whereClause = whereConditions.join(' AND ');

        // 전체 개수 조회
        const [countResult] = await connection.execute(
          `SELECT COUNT(*) as total FROM ai_services WHERE ${whereClause}`,
          queryParams
        );

        const total = (countResult as any[])[0].total;
        const totalPages = Math.ceil(total / limit);

        // AI 서비스 목록 조회
        const [services] = await connection.execute(
          `SELECT * FROM ai_services WHERE ${whereClause} 
           ORDER BY created_at DESC LIMIT ? OFFSET ?`,
          [...queryParams, limit, offset]
        );

        return {
          success: true,
          data: {
            data: services as AIService[],
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
      console.error('AI 서비스 목록 조회 오류:', error);
      return {
        success: false,
        error: 'AI 서비스 목록 조회 중 오류가 발생했습니다.'
      };
    }
  }

  // AI 서비스 정보 수정
  async updateAIService(id: number, serviceData: Partial<AIService>): Promise<ApiResponse<AIService>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        // AI 서비스 존재 확인
        const [existingServices] = await connection.execute(
          'SELECT id FROM ai_services WHERE id = ? AND deleted_at IS NULL',
          [id]
        );

        if ((existingServices as any[]).length === 0) {
          return {
            success: false,
            error: 'AI 서비스를 찾을 수 없습니다.'
          };
        }

        // 업데이트할 필드 구성
        const updateFields: string[] = [];
        const updateParams: any[] = [];

        if (serviceData.ai_name) {
          updateFields.push('ai_name = ?');
          updateParams.push(serviceData.ai_name);
        }

        if (serviceData.ai_description !== undefined) {
          updateFields.push('ai_description = ?');
          updateParams.push(serviceData.ai_description);
        }

        if (serviceData.ai_type) {
          updateFields.push('ai_type = ?');
          updateParams.push(serviceData.ai_type);
        }

        if (serviceData.ai_status) {
          updateFields.push('ai_status = ?');
          updateParams.push(serviceData.ai_status);
        }

        if (serviceData.nationality !== undefined) {
          updateFields.push('nationality = ?');
          updateParams.push(serviceData.nationality);
        }

        if (updateFields.length === 0) {
          return {
            success: false,
            error: '수정할 데이터가 없습니다.'
          };
        }

        // AI 서비스 정보 업데이트
        await connection.execute(
          `UPDATE ai_services SET ${updateFields.join(', ')} WHERE id = ?`,
          [...updateParams, id]
        );

        // 업데이트된 AI 서비스 조회
        const [services] = await connection.execute(
          'SELECT * FROM ai_services WHERE id = ?',
          [id]
        );

        return {
          success: true,
          data: (services as any[])[0],
          message: 'AI 서비스 정보가 성공적으로 수정되었습니다.'
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('AI 서비스 수정 오류:', error);
      return {
        success: false,
        error: 'AI 서비스 수정 중 오류가 발생했습니다.'
      };
    }
  }

  // AI 서비스 삭제 (소프트 삭제)
  async deleteAIService(id: number): Promise<ApiResponse<void>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        // AI 서비스 존재 확인
        const [existingServices] = await connection.execute(
          'SELECT id FROM ai_services WHERE id = ? AND deleted_at IS NULL',
          [id]
        );

        if ((existingServices as any[]).length === 0) {
          return {
            success: false,
            error: 'AI 서비스를 찾을 수 없습니다.'
          };
        }

        // 소프트 삭제
        await connection.execute(
          'UPDATE ai_services SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
          [id]
        );

        return {
          success: true,
          message: 'AI 서비스가 성공적으로 삭제되었습니다.'
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('AI 서비스 삭제 오류:', error);
      return {
        success: false,
        error: 'AI 서비스 삭제 중 오류가 발생했습니다.'
      };
    }
  }

  // AI 서비스 검색
  async searchAIServices(searchTerm: string): Promise<ApiResponse<AIService[]>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        const [services] = await connection.execute(
          `SELECT * FROM ai_services 
           WHERE (ai_name LIKE ? OR ai_description LIKE ? OR ai_type LIKE ?) 
           AND deleted_at IS NULL 
           ORDER BY created_at DESC`,
          [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
        );

        return {
          success: true,
          data: services as AIService[]
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('AI 서비스 검색 오류:', error);
      return {
        success: false,
        error: 'AI 서비스 검색 중 오류가 발생했습니다.'
      };
    }
  }

  // AI 서비스 통계 조회
  async getAIServiceStats(): Promise<ApiResponse<any>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        // 전체 AI 서비스 수
        const [totalResult] = await connection.execute(
          'SELECT COUNT(*) as total FROM ai_services WHERE deleted_at IS NULL'
        );

        // AI 서비스 상태별 통계
        const [statusStats] = await connection.execute(
          `SELECT ai_status, COUNT(*) as count 
           FROM ai_services WHERE deleted_at IS NULL 
           GROUP BY ai_status`
        );

        // AI 서비스 타입별 통계
        const [typeStats] = await connection.execute(
          `SELECT ai_type, COUNT(*) as count 
           FROM ai_services WHERE deleted_at IS NULL 
           GROUP BY ai_type 
           ORDER BY count DESC`
        );

        // 국가별 AI 서비스 수
        const [nationalityStats] = await connection.execute(
          `SELECT nationality, COUNT(*) as count 
           FROM ai_services WHERE deleted_at IS NULL AND nationality IS NOT NULL 
           GROUP BY nationality 
           ORDER BY count DESC 
           LIMIT 10`
        );

        // 최근 생성된 AI 서비스 수 (최근 30일)
        const [recentResult] = await connection.execute(
          `SELECT COUNT(*) as recent 
           FROM ai_services 
           WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
           AND deleted_at IS NULL`
        );

        return {
          success: true,
          data: {
            total: (totalResult as any[])[0].total,
            statusStats: statusStats as any[],
            typeStats: typeStats as any[],
            nationalityStats: nationalityStats as any[],
            recentServices: (recentResult as any[])[0].recent
          }
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('AI 서비스 통계 조회 오류:', error);
      return {
        success: false,
        error: 'AI 서비스 통계 조회 중 오류가 발생했습니다.'
      };
    }
  }
}

export default new AIServiceService(); 