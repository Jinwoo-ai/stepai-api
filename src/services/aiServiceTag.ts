import { getDatabaseConnection } from '../configs/database';
import { AIServiceTag, ApiResponse, PaginationParams, PaginatedResponse, AIServiceTagFilters } from '../types/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class AIServiceTagService {
  private db = getDatabaseConnection();

  // AI 서비스 태그 생성
  async createAIServiceTag(tagData: AIServiceTag): Promise<ApiResponse<AIServiceTag>> {
    try {
      const [result] = await this.db.execute<ResultSetHeader>(
        'INSERT INTO ai_service_tags (ai_service_id, tag_name) VALUES (?, ?)',
        [tagData.ai_service_id, tagData.tag_name]
      );

      const newTag = { ...tagData, id: result.insertId };
      return {
        success: true,
        data: newTag,
        message: 'AI 서비스 태그가 성공적으로 생성되었습니다.'
      };
    } catch (error) {
      return {
        success: false,
        error: `AI 서비스 태그 생성 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // AI 서비스 태그 조회 (ID로)
  async getAIServiceTagById(id: number): Promise<ApiResponse<AIServiceTag>> {
    try {
      const [rows] = await this.db.execute<RowDataPacket[]>(
        'SELECT * FROM ai_service_tags WHERE id = ?',
        [id]
      );

      if (rows.length === 0) {
        return {
          success: false,
          error: 'AI 서비스 태그를 찾을 수 없습니다.'
        };
      }

      return {
        success: true,
        data: rows[0] as AIServiceTag
      };
    } catch (error) {
      return {
        success: false,
        error: `AI 서비스 태그 조회 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // AI 서비스별 태그 조회
  async getTagsByServiceId(serviceId: number): Promise<ApiResponse<AIServiceTag[]>> {
    try {
      const [rows] = await this.db.execute<RowDataPacket[]>(
        'SELECT * FROM ai_service_tags WHERE ai_service_id = ? ORDER BY tag_name ASC',
        [serviceId]
      );

      return {
        success: true,
        data: rows as AIServiceTag[]
      };
    } catch (error) {
      return {
        success: false,
        error: `AI 서비스 태그 조회 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // AI 서비스 태그 목록 조회 (페이지네이션)
  async getAIServiceTags(params: PaginationParams, filters?: AIServiceTagFilters): Promise<ApiResponse<PaginatedResponse<AIServiceTag>>> {
    try {
      const { page, limit } = params;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE 1=1';
      const queryParams: any[] = [];

      if (filters?.ai_service_id) {
        whereClause += ' AND ai_service_id = ?';
        queryParams.push(filters.ai_service_id);
      }

      if (filters?.tag_name) {
        whereClause += ' AND tag_name LIKE ?';
        queryParams.push(`%${filters.tag_name}%`);
      }

      // 전체 개수 조회
      const [countRows] = await this.db.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as total FROM ai_service_tags ${whereClause}`,
        queryParams
      );
      const total = countRows[0]?.['total'] as number || 0;

      // 데이터 조회
      const [rows] = await this.db.execute<RowDataPacket[]>(
        `SELECT * FROM ai_service_tags ${whereClause} ORDER BY tag_name ASC, created_at DESC LIMIT ? OFFSET ?`,
        [...queryParams, limit, offset]
      );

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          data: rows as AIServiceTag[],
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
        error: `AI 서비스 태그 목록 조회 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // AI 서비스 태그 수정
  async updateAIServiceTag(id: number, tagData: Partial<AIServiceTag>): Promise<ApiResponse<AIServiceTag>> {
    try {
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (tagData.tag_name !== undefined) {
        updateFields.push('tag_name = ?');
        updateValues.push(tagData.tag_name);
      }

      if (updateFields.length === 0) {
        return {
          success: false,
          error: '수정할 데이터가 없습니다.'
        };
      }

      updateValues.push(id);

      const [result] = await this.db.execute<ResultSetHeader>(
        `UPDATE ai_service_tags SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      if (result.affectedRows === 0) {
        return {
          success: false,
          error: 'AI 서비스 태그를 찾을 수 없습니다.'
        };
      }

      // 수정된 태그 정보 조회
      const getTagResult = await this.getAIServiceTagById(id);
      return getTagResult;
    } catch (error) {
      return {
        success: false,
        error: `AI 서비스 태그 수정 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // AI 서비스 태그 삭제
  async deleteAIServiceTag(id: number): Promise<ApiResponse<null>> {
    try {
      const [result] = await this.db.execute<ResultSetHeader>(
        'DELETE FROM ai_service_tags WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        return {
          success: false,
          error: 'AI 서비스 태그를 찾을 수 없습니다.'
        };
      }

      return {
        success: true,
        message: 'AI 서비스 태그가 성공적으로 삭제되었습니다.'
      };
    } catch (error) {
      return {
        success: false,
        error: `AI 서비스 태그 삭제 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // AI 서비스별 태그 일괄 삭제
  async deleteTagsByServiceId(serviceId: number): Promise<ApiResponse<null>> {
    try {
      const [result] = await this.db.execute<ResultSetHeader>(
        'DELETE FROM ai_service_tags WHERE ai_service_id = ?',
        [serviceId]
      );

      return {
        success: true,
        message: `${result.affectedRows}개의 AI 서비스 태그가 성공적으로 삭제되었습니다.`
      };
    } catch (error) {
      return {
        success: false,
        error: `AI 서비스 태그 일괄 삭제 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // 태그 통계 조회
  async getTagStats(): Promise<ApiResponse<any>> {
    try {
      const [rows] = await this.db.execute<RowDataPacket[]>(
        'SELECT tag_name, COUNT(*) as count FROM ai_service_tags GROUP BY tag_name ORDER BY count DESC'
      );

      return {
        success: true,
        data: rows
      };
    } catch (error) {
      return {
        success: false,
        error: `태그 통계 조회 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // 태그 검색
  async searchTags(searchTerm: string): Promise<ApiResponse<AIServiceTag[]>> {
    try {
      const [rows] = await this.db.execute<RowDataPacket[]>(
        'SELECT * FROM ai_service_tags WHERE tag_name LIKE ? ORDER BY tag_name ASC',
        [`%${searchTerm}%`]
      );

      return {
        success: true,
        data: rows as AIServiceTag[]
      };
    } catch (error) {
      return {
        success: false,
        error: `태그 검색 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export default new AIServiceTagService(); 