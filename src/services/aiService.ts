import { getDatabaseConnection } from '../configs/database';
import { AIService, ApiResponse, PaginationParams, PaginatedResponse, AIServiceFilters, AIServiceDetail, AIServiceListOptions, AIServiceWithRelations } from '../types/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class AIServiceService {
  private db = getDatabaseConnection();

  // AI 서비스 생성
  async createAIService(serviceData: AIService): Promise<ApiResponse<AIService>> {
    try {
      const [result] = await this.db.execute<ResultSetHeader>(
        'INSERT INTO ai_services (ai_name, ai_description, ai_type, ai_status, nationality) VALUES (?, ?, ?, ?, ?)',
        [serviceData.ai_name, serviceData.ai_description, serviceData.ai_type, serviceData.ai_status, serviceData.nationality]
      );

      const newService = { ...serviceData, id: result.insertId };
      return {
        success: true,
        data: newService,
        message: 'AI 서비스가 성공적으로 생성되었습니다.'
      };
    } catch (error) {
      return {
        success: false,
        error: `AI 서비스 생성 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // AI 서비스 조회 (ID로)
  async getAIServiceById(id: number): Promise<ApiResponse<AIService>> {
    try {
      const [rows] = await this.db.execute<RowDataPacket[]>(
        'SELECT * FROM ai_services WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (rows.length === 0) {
        return {
          success: false,
          error: 'AI 서비스를 찾을 수 없습니다.'
        };
      }

      return {
        success: true,
        data: rows[0] as AIService
      };
    } catch (error) {
      return {
        success: false,
        error: `AI 서비스 조회 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // AI 서비스 상세 조회 (관련 데이터 포함)
  async getAIServiceDetailById(id: number): Promise<ApiResponse<AIServiceDetail>> {
    try {
      // 기본 AI 서비스 정보 조회
      const [serviceRows] = await this.db.execute<RowDataPacket[]>(
        'SELECT * FROM ai_services WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (serviceRows.length === 0) {
        return {
          success: false,
          error: 'AI 서비스를 찾을 수 없습니다.'
        };
      }

      const service = serviceRows[0] as AIService;

      // 관련 콘텐츠 조회
      const [contentRows] = await this.db.execute<RowDataPacket[]>(
        'SELECT * FROM ai_service_contents WHERE ai_service_id = ? ORDER BY content_order_index ASC',
        [id]
      );

      // 관련 태그 조회
      const [tagRows] = await this.db.execute<RowDataPacket[]>(
        'SELECT * FROM ai_service_tags WHERE ai_service_id = ? ORDER BY tag_name ASC',
        [id]
      );

      // 관련 카테고리 조회
      const [categoryRows] = await this.db.execute<RowDataPacket[]>(
        `SELECT ac.* FROM ai_categories ac
         INNER JOIN ai_service_categories aisc ON ac.id = aisc.category_id
         WHERE aisc.ai_service_id = ?`,
        [id]
      );

      // 관련 회사 조회
      const [companyRows] = await this.db.execute<RowDataPacket[]>(
        `SELECT c.* FROM company c
         INNER JOIN company_ai_services cas ON c.id = cas.company_id
         WHERE cas.ai_service_id = ? AND c.deleted_at IS NULL`,
        [id]
      );

      const serviceDetail: AIServiceDetail = {
        ...service,
        contents: contentRows as any[],
        tags: tagRows as any[],
        categories: categoryRows as any[],
        companies: companyRows as any[]
      };

      return {
        success: true,
        data: serviceDetail
      };
    } catch (error) {
      return {
        success: false,
        error: `AI 서비스 상세 조회 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // AI 서비스 목록 조회 (페이지네이션)
  async getAIServices(params: PaginationParams, filters?: AIServiceFilters, options?: AIServiceListOptions): Promise<ApiResponse<PaginatedResponse<AIServiceWithRelations>>> {
    try {
      const { page, limit } = params;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE deleted_at IS NULL';
      const queryParams: any[] = [];

      if (filters?.ai_status) {
        whereClause += ' AND ai_status = ?';
        queryParams.push(filters.ai_status);
      }

      if (filters?.ai_type) {
        whereClause += ' AND ai_type = ?';
        queryParams.push(filters.ai_type);
      }

      if (filters?.nationality) {
        whereClause += ' AND nationality = ?';
        queryParams.push(filters.nationality);
      }

      if (filters?.category_id) {
        whereClause += ` AND id IN (
          SELECT ai_service_id FROM ai_service_categories WHERE category_id = ?
        )`;
        queryParams.push(filters.category_id);
      }

      // 전체 개수 조회
      const [countRows] = await this.db.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as total FROM ai_services ${whereClause}`,
        queryParams
      );
      const total = countRows[0]?.['total'] as number || 0;

      // 데이터 조회
      const [rows] = await this.db.execute<RowDataPacket[]>(
        `SELECT * FROM ai_services ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...queryParams, limit, offset]
      );

      const services = rows as AIService[];

      // 관련 데이터 포함 옵션이 있는 경우
      if (options && (options.include_contents || options.include_tags || options.include_categories || options.include_companies)) {
        const servicesWithRelations: AIServiceWithRelations[] = [];

        for (const service of services) {
          const serviceWithRelations: AIServiceWithRelations = { ...service };

          // 콘텐츠 포함
          if (options.include_contents) {
            const [contentRows] = await this.db.execute<RowDataPacket[]>(
              'SELECT * FROM ai_service_contents WHERE ai_service_id = ? ORDER BY content_order_index ASC',
              [service.id]
            );
            serviceWithRelations.contents = contentRows as any[];
          }

          // 태그 포함
          if (options.include_tags) {
            const [tagRows] = await this.db.execute<RowDataPacket[]>(
              'SELECT * FROM ai_service_tags WHERE ai_service_id = ? ORDER BY tag_name ASC',
              [service.id]
            );
            serviceWithRelations.tags = tagRows as any[];
          }

          // 카테고리 포함
          if (options.include_categories) {
            const [categoryRows] = await this.db.execute<RowDataPacket[]>(
              `SELECT ac.* FROM ai_categories ac
               INNER JOIN ai_service_categories aisc ON ac.id = aisc.category_id
               WHERE aisc.ai_service_id = ?`,
              [service.id]
            );
            serviceWithRelations.categories = categoryRows as any[];
          }

          // 회사 포함
          if (options.include_companies) {
            const [companyRows] = await this.db.execute<RowDataPacket[]>(
              `SELECT c.* FROM company c
               INNER JOIN company_ai_services cas ON c.id = cas.company_id
               WHERE cas.ai_service_id = ? AND c.deleted_at IS NULL`,
              [service.id]
            );
            serviceWithRelations.companies = companyRows as any[];
          }

          servicesWithRelations.push(serviceWithRelations);
        }

        const totalPages = Math.ceil(total / limit);

        return {
          success: true,
          data: {
            data: servicesWithRelations,
            pagination: {
              page,
              limit,
              total,
              totalPages
            }
          }
        };
      }

      // 관련 데이터 포함 옵션이 없는 경우 기존 방식
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          data: services as AIServiceWithRelations[],
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
        error: `AI 서비스 목록 조회 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // AI 서비스 정보 수정
  async updateAIService(id: number, serviceData: Partial<AIService>): Promise<ApiResponse<AIService>> {
    try {
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (serviceData.ai_name !== undefined) {
        updateFields.push('ai_name = ?');
        updateValues.push(serviceData.ai_name);
      }
      if (serviceData.ai_description !== undefined) {
        updateFields.push('ai_description = ?');
        updateValues.push(serviceData.ai_description);
      }
      if (serviceData.ai_type !== undefined) {
        updateFields.push('ai_type = ?');
        updateValues.push(serviceData.ai_type);
      }
      if (serviceData.ai_status !== undefined) {
        updateFields.push('ai_status = ?');
        updateValues.push(serviceData.ai_status);
      }
      if (serviceData.nationality !== undefined) {
        updateFields.push('nationality = ?');
        updateValues.push(serviceData.nationality);
      }

      if (updateFields.length === 0) {
        return {
          success: false,
          error: '수정할 데이터가 없습니다.'
        };
      }

      updateValues.push(id);

      const [result] = await this.db.execute<ResultSetHeader>(
        `UPDATE ai_services SET ${updateFields.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
        updateValues
      );

      if (result.affectedRows === 0) {
        return {
          success: false,
          error: 'AI 서비스를 찾을 수 없습니다.'
        };
      }

      // 수정된 AI 서비스 정보 조회
      const getServiceResult = await this.getAIServiceById(id);
      return getServiceResult;
    } catch (error) {
      return {
        success: false,
        error: `AI 서비스 수정 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // AI 서비스 삭제 (소프트 삭제)
  async deleteAIService(id: number): Promise<ApiResponse<null>> {
    try {
      const [result] = await this.db.execute<ResultSetHeader>(
        'UPDATE ai_services SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (result.affectedRows === 0) {
        return {
          success: false,
          error: 'AI 서비스를 찾을 수 없습니다.'
        };
      }

      return {
        success: true,
        message: 'AI 서비스가 성공적으로 삭제되었습니다.'
      };
    } catch (error) {
      return {
        success: false,
        error: `AI 서비스 삭제 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // AI 서비스 타입별 통계
  async getAIServiceStats(): Promise<ApiResponse<any>> {
    try {
      const [rows] = await this.db.execute<RowDataPacket[]>(
        'SELECT ai_type, COUNT(*) as count FROM ai_services WHERE deleted_at IS NULL GROUP BY ai_type'
      );

      return {
        success: true,
        data: rows
      };
    } catch (error) {
      return {
        success: false,
        error: `AI 서비스 통계 조회 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // AI 서비스 검색
  async searchAIServices(searchTerm: string): Promise<ApiResponse<AIService[]>> {
    try {
      const [rows] = await this.db.execute<RowDataPacket[]>(
        `SELECT * FROM ai_services 
         WHERE (ai_name LIKE ? OR ai_description LIKE ?) 
         AND deleted_at IS NULL 
         ORDER BY created_at DESC`,
        [`%${searchTerm}%`, `%${searchTerm}%`]
      );

      return {
        success: true,
        data: rows as AIService[]
      };
    } catch (error) {
      return {
        success: false,
        error: `AI 서비스 검색 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export default new AIServiceService(); 