import { getDatabaseConnection } from '../configs/database';
import { AICategory, PaginationParams, ApiResponse } from '../types/database';

class AICategoryService {
  // AI 카테고리 생성
  async createAICategory(categoryData: AICategory): Promise<ApiResponse<any>> {
    try {
      const pool = getDatabaseConnection();
      const [result] = await pool.execute(
        'INSERT INTO ai_categories (category_name) VALUES (?)',
        [categoryData.category_name]
      );

      return {
        success: true,
        data: { id: (result as any).insertId, ...categoryData },
        message: 'AI 카테고리가 성공적으로 생성되었습니다.'
      };
    } catch (error) {
      console.error('AI 카테고리 생성 오류:', error);
      return {
        success: false,
        error: 'AI 카테고리 생성 중 오류가 발생했습니다.'
      };
    }
  }

  // ID로 AI 카테고리 조회
  async getAICategoryById(id: number): Promise<ApiResponse<any>> {
    try {
      const pool = getDatabaseConnection();
      const [rows] = await pool.execute(
        'SELECT * FROM ai_categories WHERE id = ?',
        [id]
      );

      const categories = rows as AICategory[];
      if (categories.length === 0) {
        return {
          success: false,
          error: 'AI 카테고리를 찾을 수 없습니다.'
        };
      }

      return {
        success: true,
        data: categories[0],
        message: 'AI 카테고리 조회 성공'
      };
    } catch (error) {
      console.error('AI 카테고리 조회 오류:', error);
      return {
        success: false,
        error: 'AI 카테고리 조회 중 오류가 발생했습니다.'
      };
    }
  }

  // AI 카테고리 목록 조회
  async getAICategories(params: PaginationParams, filters: any = {}): Promise<ApiResponse<any>> {
    try {
      const pool = getDatabaseConnection();
      const { page, limit } = params;
      const offset = (page - 1) * limit;

      let query = 'SELECT * FROM ai_categories';
      const queryParams: any[] = [];

      // 필터 조건 추가
      if (filters.category_name) {
        query += ' WHERE category_name LIKE ?';
        queryParams.push(`%${filters.category_name}%`);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      queryParams.push(limit, offset);

      const [rows] = await pool.execute(query, queryParams);
      const categories = rows as AICategory[];

      // 전체 개수 조회
      let countQuery = 'SELECT COUNT(*) as total FROM ai_categories';
      if (filters.category_name) {
        countQuery += ' WHERE category_name LIKE ?';
      }
      const [countResult] = await pool.execute(countQuery, filters.category_name ? [`%${filters.category_name}%`] : []);
      const total = (countResult as any)[0].total;

      return {
        success: true,
        data: {
          categories,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        },
        message: 'AI 카테고리 목록 조회 성공'
      };
    } catch (error) {
      console.error('AI 카테고리 목록 조회 오류:', error);
      return {
        success: false,
        error: 'AI 카테고리 목록 조회 중 오류가 발생했습니다.'
      };
    }
  }

  // AI 카테고리 수정
  async updateAICategory(id: number, categoryData: Partial<AICategory>): Promise<ApiResponse<any>> {
    try {
      const pool = getDatabaseConnection();
      
      // 기존 데이터 확인
      const [existingRows] = await pool.execute(
        'SELECT * FROM ai_categories WHERE id = ?',
        [id]
      );

      if ((existingRows as AICategory[]).length === 0) {
        return {
          success: false,
          error: 'AI 카테고리를 찾을 수 없습니다.'
        };
      }

      // 업데이트할 필드들
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (categoryData.category_name !== undefined) {
        updateFields.push('category_name = ?');
        updateValues.push(categoryData.category_name);
      }

      if (updateFields.length === 0) {
        return {
          success: false,
          error: '수정할 데이터가 없습니다.'
        };
      }

      updateValues.push(id);
      const query = `UPDATE ai_categories SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      
      await pool.execute(query, updateValues);

      return {
        success: true,
        data: { id, ...categoryData },
        message: 'AI 카테고리가 성공적으로 수정되었습니다.'
      };
    } catch (error) {
      console.error('AI 카테고리 수정 오류:', error);
      return {
        success: false,
        error: 'AI 카테고리 수정 중 오류가 발생했습니다.'
      };
    }
  }

  // AI 카테고리 삭제
  async deleteAICategory(id: number): Promise<ApiResponse<any>> {
    try {
      const pool = getDatabaseConnection();
      
      // 기존 데이터 확인
      const [existingRows] = await pool.execute(
        'SELECT * FROM ai_categories WHERE id = ?',
        [id]
      );

      if ((existingRows as AICategory[]).length === 0) {
        return {
          success: false,
          error: 'AI 카테고리를 찾을 수 없습니다.'
        };
      }

      await pool.execute('DELETE FROM ai_categories WHERE id = ?', [id]);

      return {
        success: true,
        message: 'AI 카테고리가 성공적으로 삭제되었습니다.'
      };
    } catch (error) {
      console.error('AI 카테고리 삭제 오류:', error);
      return {
        success: false,
        error: 'AI 카테고리 삭제 중 오류가 발생했습니다.'
      };
    }
  }
}

export default new AICategoryService(); 