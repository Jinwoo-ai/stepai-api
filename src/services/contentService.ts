import { getDatabaseConnection } from '../configs/database';
import { Content, ContentCreateRequest, ContentUpdateRequest, ContentFilters, ContentListOptions, ContentWithRelations, PaginationParams, ApiResponse, PaginatedResponse } from '../types/database';

class ContentService {
  private pool = getDatabaseConnection();

  // 콘텐츠 생성
  async createContent(contentData: ContentCreateRequest): Promise<ApiResponse<Content>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        await connection.beginTransaction();

        // 콘텐츠 생성
        const [result] = await connection.execute(
          `INSERT INTO contents (content_title, content_description, content_url, content_type, content_order_index) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            contentData.content_title,
            contentData.content_description,
            contentData.content_url,
            contentData.content_type,
            contentData.content_order_index || 0
          ]
        );

        const contentId = (result as any).insertId;

        // 카테고리 관계 생성
        if (contentData.category_ids && contentData.category_ids.length > 0) {
          for (const categoryId of contentData.category_ids) {
            await connection.execute(
              'INSERT INTO content_category_relations (content_id, category_id) VALUES (?, ?)',
              [contentId, categoryId]
            );
          }
        }

        // 태그 관계 생성
        if (contentData.tag_ids && contentData.tag_ids.length > 0) {
          for (const tagId of contentData.tag_ids) {
            await connection.execute(
              'INSERT INTO content_tag_relations (content_id, tag_id) VALUES (?, ?)',
              [contentId, tagId]
            );
          }
        }

        // AI 서비스 관계 생성
        if (contentData.ai_service_ids && contentData.ai_service_ids.length > 0) {
          for (const aiServiceId of contentData.ai_service_ids) {
            await connection.execute(
              'INSERT INTO content_ai_services (content_id, ai_service_id) VALUES (?, ?)',
              [contentId, aiServiceId]
            );
          }
        }

        await connection.commit();

        // 생성된 콘텐츠 조회
        const [contents] = await connection.execute(
          'SELECT * FROM contents WHERE id = ?',
          [contentId]
        );

        const content = (contents as any[])[0];

        return {
          success: true,
          data: content,
          message: '콘텐츠가 성공적으로 생성되었습니다.'
        };
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('콘텐츠 생성 오류:', error);
      return {
        success: false,
        error: '콘텐츠 생성 중 오류가 발생했습니다.'
      };
    }
  }

  // ID로 콘텐츠 조회
  async getContentById(id: number): Promise<ApiResponse<Content>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        const [contents] = await connection.execute(
          'SELECT * FROM contents WHERE id = ? AND deleted_at IS NULL',
          [id]
        );

        if ((contents as any[]).length === 0) {
          return {
            success: false,
            error: '콘텐츠를 찾을 수 없습니다.'
          };
        }

        return {
          success: true,
          data: (contents as any[])[0]
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('콘텐츠 조회 오류:', error);
      return {
        success: false,
        error: '콘텐츠 조회 중 오류가 발생했습니다.'
      };
    }
  }

  // 콘텐츠 상세 조회 (관련 데이터 포함)
  async getContentDetailById(id: number): Promise<ApiResponse<ContentWithRelations>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        // 콘텐츠 기본 정보 조회
        const [contents] = await connection.execute(
          'SELECT * FROM contents WHERE id = ? AND deleted_at IS NULL',
          [id]
        );

        if ((contents as any[]).length === 0) {
          return {
            success: false,
            error: '콘텐츠를 찾을 수 없습니다.'
          };
        }

        const content = (contents as any[])[0];

        // 카테고리 조회
        const [categories] = await connection.execute(
          `SELECT cc.* FROM content_categories cc 
           INNER JOIN content_category_relations ccr ON cc.id = ccr.category_id 
           WHERE ccr.content_id = ?`,
          [id]
        );

        // 태그 조회
        const [tags] = await connection.execute(
          `SELECT ct.* FROM content_tags ct 
           INNER JOIN content_tag_relations ctr ON ct.id = ctr.tag_id 
           WHERE ctr.content_id = ?`,
          [id]
        );

        // AI 서비스 조회
        const [aiServices] = await connection.execute(
          `SELECT ais.* FROM ai_services ais 
           INNER JOIN content_ai_services cas ON ais.id = cas.ai_service_id 
           WHERE cas.content_id = ? AND ais.deleted_at IS NULL`,
          [id]
        );

        // 전문가 조회
        const [experts] = await connection.execute(
          `SELECT e.* FROM experts e 
           INNER JOIN expert_contents ec ON e.id = ec.expert_id 
           WHERE ec.content_id = ? AND e.deleted_at IS NULL`,
          [id]
        );

        const contentWithRelations: ContentWithRelations = {
          ...content,
          categories: categories as any[],
          tags: tags as any[],
          ai_services: aiServices as any[],
          experts: experts as any[]
        };

        return {
          success: true,
          data: contentWithRelations
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('콘텐츠 상세 조회 오류:', error);
      return {
        success: false,
        error: '콘텐츠 상세 조회 중 오류가 발생했습니다.'
      };
    }
  }

  // 콘텐츠 목록 조회
  async getContents(params: PaginationParams, filters: ContentFilters = {}, options: ContentListOptions = {}): Promise<ApiResponse<PaginatedResponse<ContentWithRelations>>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        const { page, limit } = params;
        const offset = (page - 1) * limit;

        // WHERE 조건 구성
        const whereConditions: string[] = ['c.deleted_at IS NULL'];
        const queryParams: any[] = [];

        if (filters.content_status) {
          whereConditions.push('c.content_status = ?');
          queryParams.push(filters.content_status);
        }

        if (filters.content_type) {
          whereConditions.push('c.content_type = ?');
          queryParams.push(filters.content_type);
        }

        if (filters.category_id) {
          whereConditions.push('ccr.category_id = ?');
          queryParams.push(filters.category_id);
        }

        if (filters.tag_id) {
          whereConditions.push('ctr.tag_id = ?');
          queryParams.push(filters.tag_id);
        }

        if (filters.ai_service_id) {
          whereConditions.push('cas.ai_service_id = ?');
          queryParams.push(filters.ai_service_id);
        }

        const whereClause = whereConditions.join(' AND ');

        // 기본 쿼리 구성
        let selectClause = 'SELECT DISTINCT c.*';
        let joinClause = 'FROM contents c';

        // 필터에 따른 JOIN 추가
        if (filters.category_id) {
          joinClause += ' INNER JOIN content_category_relations ccr ON c.id = ccr.content_id';
        }

        if (filters.tag_id) {
          joinClause += ' INNER JOIN content_tag_relations ctr ON c.id = ctr.content_id';
        }

        if (filters.ai_service_id) {
          joinClause += ' INNER JOIN content_ai_services cas ON c.id = cas.content_id';
        }

        // 전체 개수 조회
        const [countResult] = await connection.execute(
          `SELECT COUNT(DISTINCT c.id) as total FROM contents c ${joinClause.includes('INNER JOIN') ? joinClause.split('FROM contents c')[1] : ''} WHERE ${whereClause}`,
          queryParams
        );

        const total = (countResult as any[])[0].total;
        const totalPages = Math.ceil(total / limit);

        // 콘텐츠 목록 조회
        const [contents] = await connection.execute(
          `${selectClause} ${joinClause} WHERE ${whereClause} 
           ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
          [...queryParams, limit, offset]
        );

        // 관련 데이터 포함 옵션에 따른 추가 데이터 조회
        const contentsWithRelations: ContentWithRelations[] = [];

        for (const content of contents as any[]) {
          const contentWithRelations: ContentWithRelations = { ...content };

          if (options.include_categories) {
            const [categories] = await connection.execute(
              `SELECT cc.* FROM content_categories cc 
               INNER JOIN content_category_relations ccr ON cc.id = ccr.category_id 
               WHERE ccr.content_id = ?`,
              [content.id]
            );
            contentWithRelations.categories = categories as any[];
          }

          if (options.include_tags) {
            const [tags] = await connection.execute(
              `SELECT ct.* FROM content_tags ct 
               INNER JOIN content_tag_relations ctr ON ct.id = ctr.tag_id 
               WHERE ctr.content_id = ?`,
              [content.id]
            );
            contentWithRelations.tags = tags as any[];
          }

          if (options.include_ai_services) {
            const [aiServices] = await connection.execute(
              `SELECT ais.* FROM ai_services ais 
               INNER JOIN content_ai_services cas ON ais.id = cas.ai_service_id 
               WHERE cas.content_id = ? AND ais.deleted_at IS NULL`,
              [content.id]
            );
            contentWithRelations.ai_services = aiServices as any[];
          }

          if (options.include_experts) {
            const [experts] = await connection.execute(
              `SELECT e.* FROM experts e 
               INNER JOIN expert_contents ec ON e.id = ec.expert_id 
               WHERE ec.content_id = ? AND e.deleted_at IS NULL`,
              [content.id]
            );
            contentWithRelations.experts = experts as any[];
          }

          contentsWithRelations.push(contentWithRelations);
        }

        return {
          success: true,
          data: {
            data: contentsWithRelations,
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
      console.error('콘텐츠 목록 조회 오류:', error);
      return {
        success: false,
        error: '콘텐츠 목록 조회 중 오류가 발생했습니다.'
      };
    }
  }

  // 콘텐츠 정보 수정
  async updateContent(id: number, contentData: ContentUpdateRequest): Promise<ApiResponse<Content>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        // 콘텐츠 존재 확인
        const [existingContents] = await connection.execute(
          'SELECT id FROM contents WHERE id = ? AND deleted_at IS NULL',
          [id]
        );

        if ((existingContents as any[]).length === 0) {
          return {
            success: false,
            error: '콘텐츠를 찾을 수 없습니다.'
          };
        }

        // 업데이트할 필드 구성
        const updateFields: string[] = [];
        const updateParams: any[] = [];

        if (contentData.content_title) {
          updateFields.push('content_title = ?');
          updateParams.push(contentData.content_title);
        }

        if (contentData.content_description !== undefined) {
          updateFields.push('content_description = ?');
          updateParams.push(contentData.content_description);
        }

        if (contentData.content_url !== undefined) {
          updateFields.push('content_url = ?');
          updateParams.push(contentData.content_url);
        }

        if (contentData.content_type) {
          updateFields.push('content_type = ?');
          updateParams.push(contentData.content_type);
        }

        if (contentData.content_order_index !== undefined) {
          updateFields.push('content_order_index = ?');
          updateParams.push(contentData.content_order_index);
        }

        if (contentData.content_status) {
          updateFields.push('content_status = ?');
          updateParams.push(contentData.content_status);
        }

        if (updateFields.length === 0) {
          return {
            success: false,
            error: '수정할 데이터가 없습니다.'
          };
        }

        // 콘텐츠 정보 업데이트
        await connection.execute(
          `UPDATE contents SET ${updateFields.join(', ')} WHERE id = ?`,
          [...updateParams, id]
        );

        // 업데이트된 콘텐츠 조회
        const [contents] = await connection.execute(
          'SELECT * FROM contents WHERE id = ?',
          [id]
        );

        return {
          success: true,
          data: (contents as any[])[0],
          message: '콘텐츠 정보가 성공적으로 수정되었습니다.'
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('콘텐츠 수정 오류:', error);
      return {
        success: false,
        error: '콘텐츠 수정 중 오류가 발생했습니다.'
      };
    }
  }

  // 콘텐츠 삭제 (소프트 삭제)
  async deleteContent(id: number): Promise<ApiResponse<void>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        // 콘텐츠 존재 확인
        const [existingContents] = await connection.execute(
          'SELECT id FROM contents WHERE id = ? AND deleted_at IS NULL',
          [id]
        );

        if ((existingContents as any[]).length === 0) {
          return {
            success: false,
            error: '콘텐츠를 찾을 수 없습니다.'
          };
        }

        // 소프트 삭제
        await connection.execute(
          'UPDATE contents SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
          [id]
        );

        return {
          success: true,
          message: '콘텐츠가 성공적으로 삭제되었습니다.'
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('콘텐츠 삭제 오류:', error);
      return {
        success: false,
        error: '콘텐츠 삭제 중 오류가 발생했습니다.'
      };
    }
  }

  // 콘텐츠 검색
  async searchContents(searchTerm: string): Promise<ApiResponse<Content[]>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        const [contents] = await connection.execute(
          `SELECT * FROM contents 
           WHERE (content_title LIKE ? OR content_description LIKE ?) 
           AND deleted_at IS NULL 
           ORDER BY created_at DESC`,
          [`%${searchTerm}%`, `%${searchTerm}%`]
        );

        return {
          success: true,
          data: contents as Content[]
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('콘텐츠 검색 오류:', error);
      return {
        success: false,
        error: '콘텐츠 검색 중 오류가 발생했습니다.'
      };
    }
  }

  // 콘텐츠 통계 조회
  async getContentStats(): Promise<ApiResponse<any>> {
    try {
      const connection = await this.pool.getConnection();
      
      try {
        // 전체 콘텐츠 수
        const [totalResult] = await connection.execute(
          'SELECT COUNT(*) as total FROM contents WHERE deleted_at IS NULL'
        );

        // 콘텐츠 상태별 통계
        const [statusStats] = await connection.execute(
          `SELECT content_status, COUNT(*) as count 
           FROM contents WHERE deleted_at IS NULL 
           GROUP BY content_status`
        );

        // 콘텐츠 타입별 통계
        const [typeStats] = await connection.execute(
          `SELECT content_type, COUNT(*) as count 
           FROM contents WHERE deleted_at IS NULL 
           GROUP BY content_type 
           ORDER BY count DESC`
        );

        // 최근 생성된 콘텐츠 수 (최근 30일)
        const [recentResult] = await connection.execute(
          `SELECT COUNT(*) as recent 
           FROM contents 
           WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
           AND deleted_at IS NULL`
        );

        // 카테고리별 콘텐츠 수
        const [categoryStats] = await connection.execute(
          `SELECT cc.category_name, COUNT(ccr.content_id) as count 
           FROM content_categories cc 
           LEFT JOIN content_category_relations ccr ON cc.id = ccr.category_id 
           LEFT JOIN contents c ON ccr.content_id = c.id AND c.deleted_at IS NULL 
           GROUP BY cc.id, cc.category_name 
           ORDER BY count DESC`
        );

        return {
          success: true,
          data: {
            total: (totalResult as any[])[0].total,
            statusStats: statusStats as any[],
            typeStats: typeStats as any[],
            recentContents: (recentResult as any[])[0].recent,
            categoryStats: categoryStats as any[]
          }
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('콘텐츠 통계 조회 오류:', error);
      return {
        success: false,
        error: '콘텐츠 통계 조회 중 오류가 발생했습니다.'
      };
    }
  }
}

export default new ContentService(); 