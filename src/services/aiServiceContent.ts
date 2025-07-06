import { getDatabaseConnection } from '../configs/database';
import { AIServiceContent, ApiResponse, PaginationParams, PaginatedResponse, AIServiceContentFilters } from '../types/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class AIServiceContentService {
  private db = getDatabaseConnection();

  // AI 서비스 콘텐츠 생성
  async createAIServiceContent(contentData: AIServiceContent): Promise<ApiResponse<AIServiceContent>> {
    try {
      const [result] = await this.db.execute<ResultSetHeader>(
        'INSERT INTO ai_service_contents (ai_service_id, content_title, content_url, content_type, content_description, content_order_index) VALUES (?, ?, ?, ?, ?, ?)',
        [
          contentData.ai_service_id,
          contentData.content_title,
          contentData.content_url,
          contentData.content_type,
          contentData.content_description,
          contentData.content_order_index
        ]
      );

      const newContent = { ...contentData, id: result.insertId };
      return {
        success: true,
        data: newContent,
        message: 'AI 서비스 콘텐츠가 성공적으로 생성되었습니다.'
      };
    } catch (error) {
      return {
        success: false,
        error: `AI 서비스 콘텐츠 생성 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // AI 서비스 콘텐츠 조회 (ID로)
  async getAIServiceContentById(id: number): Promise<ApiResponse<AIServiceContent>> {
    try {
      const [rows] = await this.db.execute<RowDataPacket[]>(
        'SELECT * FROM ai_service_contents WHERE id = ?',
        [id]
      );

      if (rows.length === 0) {
        return {
          success: false,
          error: 'AI 서비스 콘텐츠를 찾을 수 없습니다.'
        };
      }

      return {
        success: true,
        data: rows[0] as AIServiceContent
      };
    } catch (error) {
      return {
        success: false,
        error: `AI 서비스 콘텐츠 조회 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // AI 서비스별 콘텐츠 조회
  async getContentsByServiceId(serviceId: number): Promise<ApiResponse<AIServiceContent[]>> {
    try {
      const [rows] = await this.db.execute<RowDataPacket[]>(
        'SELECT * FROM ai_service_contents WHERE ai_service_id = ? ORDER BY content_order_index ASC',
        [serviceId]
      );

      return {
        success: true,
        data: rows as AIServiceContent[]
      };
    } catch (error) {
      return {
        success: false,
        error: `AI 서비스 콘텐츠 조회 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // AI 서비스 콘텐츠 목록 조회 (페이지네이션)
  async getAIServiceContents(params: PaginationParams, filters?: AIServiceContentFilters): Promise<ApiResponse<PaginatedResponse<AIServiceContent>>> {
    try {
      const { page, limit } = params;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE 1=1';
      const queryParams: any[] = [];

      if (filters?.ai_service_id) {
        whereClause += ' AND ai_service_id = ?';
        queryParams.push(filters.ai_service_id);
      }

      if (filters?.content_type) {
        whereClause += ' AND content_type = ?';
        queryParams.push(filters.content_type);
      }

      // 전체 개수 조회
      const [countRows] = await this.db.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as total FROM ai_service_contents ${whereClause}`,
        queryParams
      );
      const total = countRows[0]?.['total'] as number || 0;

      // 데이터 조회
      const [rows] = await this.db.execute<RowDataPacket[]>(
        `SELECT * FROM ai_service_contents ${whereClause} ORDER BY content_order_index ASC, created_at DESC LIMIT ? OFFSET ?`,
        [...queryParams, limit, offset]
      );

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          data: rows as AIServiceContent[],
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
        error: `AI 서비스 콘텐츠 목록 조회 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // AI 서비스 콘텐츠 수정
  async updateAIServiceContent(id: number, contentData: Partial<AIServiceContent>): Promise<ApiResponse<AIServiceContent>> {
    try {
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (contentData.content_title !== undefined) {
        updateFields.push('content_title = ?');
        updateValues.push(contentData.content_title);
      }
      if (contentData.content_url !== undefined) {
        updateFields.push('content_url = ?');
        updateValues.push(contentData.content_url);
      }
      if (contentData.content_type !== undefined) {
        updateFields.push('content_type = ?');
        updateValues.push(contentData.content_type);
      }
      if (contentData.content_description !== undefined) {
        updateFields.push('content_description = ?');
        updateValues.push(contentData.content_description);
      }
      if (contentData.content_order_index !== undefined) {
        updateFields.push('content_order_index = ?');
        updateValues.push(contentData.content_order_index);
      }

      if (updateFields.length === 0) {
        return {
          success: false,
          error: '수정할 데이터가 없습니다.'
        };
      }

      updateValues.push(id);

      const [result] = await this.db.execute<ResultSetHeader>(
        `UPDATE ai_service_contents SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      if (result.affectedRows === 0) {
        return {
          success: false,
          error: 'AI 서비스 콘텐츠를 찾을 수 없습니다.'
        };
      }

      // 수정된 콘텐츠 정보 조회
      const getContentResult = await this.getAIServiceContentById(id);
      return getContentResult;
    } catch (error) {
      return {
        success: false,
        error: `AI 서비스 콘텐츠 수정 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // AI 서비스 콘텐츠 삭제
  async deleteAIServiceContent(id: number): Promise<ApiResponse<null>> {
    try {
      const [result] = await this.db.execute<ResultSetHeader>(
        'DELETE FROM ai_service_contents WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        return {
          success: false,
          error: 'AI 서비스 콘텐츠를 찾을 수 없습니다.'
        };
      }

      return {
        success: true,
        message: 'AI 서비스 콘텐츠가 성공적으로 삭제되었습니다.'
      };
    } catch (error) {
      return {
        success: false,
        error: `AI 서비스 콘텐츠 삭제 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // 콘텐츠 순서 변경
  async updateContentOrder(contents: { id: number; content_order_index: number }[]): Promise<ApiResponse<null>> {
    try {
      for (const content of contents) {
        await this.db.execute(
          'UPDATE ai_service_contents SET content_order_index = ? WHERE id = ?',
          [content.content_order_index, content.id]
        );
      }

      return {
        success: true,
        message: '콘텐츠 순서가 성공적으로 변경되었습니다.'
      };
    } catch (error) {
      return {
        success: false,
        error: `콘텐츠 순서 변경 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export default new AIServiceContentService(); 