import { getDatabaseConnection } from '../configs/database';
import { 
  RankingWeight, 
  Ranking, 
  RankingResult, 
  RankingFilters, 
  RankingWeightUpdate,
  RankingData,
  RankingApiResponse 
} from '../types/database';

class RankingService {
  private pool = getDatabaseConnection();

  // 콘텐츠 조회 기록 추가
  async recordContentView(contentId: number, userId?: number, ipAddress?: string, userAgent?: string): Promise<boolean> {
    try {
      const [result] = await this.pool.execute(
        'INSERT INTO content_views (content_id, user_id, ip_address, user_agent) VALUES (?, ?, ?, ?)',
        [contentId, userId, ipAddress, userAgent]
      );
      return true;
    } catch (error) {
      console.error('Error recording content view:', error);
      return false;
    }
  }

  // 랭킹 가중치 조회
  async getRankingWeights(rankingType: string): Promise<RankingWeight[]> {
    try {
      const [rows] = await this.pool.execute(
        'SELECT * FROM ranking_weights WHERE ranking_type = ? AND is_active = TRUE ORDER BY weight_name',
        [rankingType]
      );
      return rows as RankingWeight[];
    } catch (error) {
      console.error('Error getting ranking weights:', error);
      return [];
    }
  }

  // 랭킹 가중치 업데이트
  async updateRankingWeight(update: RankingWeightUpdate): Promise<boolean> {
    try {
      await this.pool.execute(
        'UPDATE ranking_weights SET weight_value = ?, weight_description = ?, updated_at = NOW() WHERE ranking_type = ? AND weight_name = ?',
        [update.weight_value, update.weight_description, update.ranking_type, update.weight_name]
      );
      return true;
    } catch (error) {
      console.error('Error updating ranking weight:', error);
      return false;
    }
  }

  // AI 서비스 랭킹 계산
  async calculateAIServiceRanking(dateFrom?: Date, dateTo?: Date): Promise<RankingData[]> {
    try {
      let dateFilter = '';
      const params: any[] = [];
      
      if (dateFrom && dateTo) {
        dateFilter = 'WHERE cv.view_date BETWEEN ? AND ?';
        params.push(dateFrom, dateTo);
      }

      const query = `
        SELECT 
          ai.id as entity_id,
          ai.ai_name as entity_name,
          COUNT(DISTINCT cv.id) as view_count,
          COUNT(DISTINCT mr.id) as request_count,
          COALESCE(AVG(r.rating), 0) as avg_rating
        FROM ai_services ai
        LEFT JOIN content_ai_services cas ON ai.id = cas.ai_service_id
        LEFT JOIN content_views cv ON cas.content_id = cv.content_id ${dateFilter}
        LEFT JOIN expert_ai_services eas ON ai.id = eas.ai_service_id
        LEFT JOIN matching_requests mr ON eas.expert_id = mr.expert_id ${dateFilter}
        LEFT JOIN reviews r ON ai.id = (
          SELECT cas2.ai_service_id 
          FROM content_ai_services cas2 
          JOIN expert_contents ec ON cas2.content_id = ec.content_id 
          WHERE ec.expert_id = r.expert_id 
          LIMIT 1
        )
        WHERE ai.deleted_at IS NULL
        GROUP BY ai.id, ai.ai_name
        HAVING view_count > 0 OR request_count > 0 OR avg_rating > 0
      `;

      const [rows] = await this.pool.execute(query, params);
      return rows as RankingData[];
    } catch (error) {
      console.error('Error calculating AI service ranking:', error);
      return [];
    }
  }

  // 콘텐츠 랭킹 계산
  async calculateContentRanking(dateFrom?: Date, dateTo?: Date): Promise<RankingData[]> {
    try {
      let dateFilter = '';
      const params: any[] = [];
      
      if (dateFrom && dateTo) {
        dateFilter = 'WHERE cv.view_date BETWEEN ? AND ?';
        params.push(dateFrom, dateTo);
      }

      const query = `
        SELECT 
          c.id as entity_id,
          c.content_title as entity_name,
          COUNT(DISTINCT cv.id) as view_count,
          0 as request_count,
          COALESCE(AVG(r.rating), 0) as avg_rating
        FROM contents c
        LEFT JOIN content_views cv ON c.id = cv.content_id ${dateFilter}
        LEFT JOIN reviews r ON c.id = r.content_id
        WHERE c.deleted_at IS NULL
        GROUP BY c.id, c.content_title
        HAVING view_count > 0 OR avg_rating > 0
      `;

      const [rows] = await this.pool.execute(query, params);
      return rows as RankingData[];
    } catch (error) {
      console.error('Error calculating content ranking:', error);
      return [];
    }
  }

  // 전문가 랭킹 계산
  async calculateExpertRanking(dateFrom?: Date, dateTo?: Date): Promise<RankingData[]> {
    try {
      let dateFilter = '';
      const params: any[] = [];
      
      if (dateFrom && dateTo) {
        dateFilter = 'WHERE (cv.view_date BETWEEN ? AND ?) OR (mr.created_at BETWEEN ? AND ?)';
        params.push(dateFrom, dateTo, dateFrom, dateTo);
      }

      const query = `
        SELECT 
          e.id as entity_id,
          e.expert_name as entity_name,
          COUNT(DISTINCT cv.id) as view_count,
          COUNT(DISTINCT mr.id) as request_count,
          COALESCE(AVG(r.rating), 0) as avg_rating,
          COUNT(DISTINCT ec.content_id) as content_count
        FROM experts e
        LEFT JOIN expert_contents ec ON e.id = ec.expert_id
        LEFT JOIN content_views cv ON ec.content_id = cv.content_id ${dateFilter}
        LEFT JOIN matching_requests mr ON e.id = mr.expert_id ${dateFilter}
        LEFT JOIN reviews r ON e.id = r.expert_id
        WHERE e.deleted_at IS NULL
        GROUP BY e.id, e.expert_name
        HAVING view_count > 0 OR request_count > 0 OR avg_rating > 0 OR content_count > 0
      `;

      const [rows] = await this.pool.execute(query, params);
      return rows as RankingData[];
    } catch (error) {
      console.error('Error calculating expert ranking:', error);
      return [];
    }
  }

  // 카테고리 랭킹 계산
  async calculateCategoryRanking(dateFrom?: Date, dateTo?: Date): Promise<RankingData[]> {
    try {
      let dateFilter = '';
      const params: any[] = [];
      
      if (dateFrom && dateTo) {
        dateFilter = 'WHERE cv.view_date BETWEEN ? AND ?';
        params.push(dateFrom, dateTo);
      }

      const query = `
        SELECT 
          cc.id as entity_id,
          cc.category_name as entity_name,
          COUNT(DISTINCT cv.id) as view_count,
          0 as request_count,
          COALESCE(AVG(r.rating), 0) as avg_rating,
          COUNT(DISTINCT ccr.content_id) as content_count
        FROM content_categories cc
        LEFT JOIN content_category_relations ccr ON cc.id = ccr.category_id
        LEFT JOIN content_views cv ON ccr.content_id = cv.content_id ${dateFilter}
        LEFT JOIN reviews r ON ccr.content_id = r.content_id
        GROUP BY cc.id, cc.category_name
        HAVING view_count > 0 OR avg_rating > 0 OR content_count > 0
      `;

      const [rows] = await this.pool.execute(query, params);
      return rows as RankingData[];
    } catch (error) {
      console.error('Error calculating category ranking:', error);
      return [];
    }
  }

  // 랭킹 점수 계산
  async calculateRankingScore(
    rankingType: 'ai_service' | 'content' | 'expert' | 'category',
    data: RankingData[]
  ): Promise<RankingResult[]> {
    try {
      const weights = await this.getRankingWeights(rankingType);
      const weightMap = new Map(weights.map(w => [w.weight_name, w.weight_value]));

      const results: RankingResult[] = data.map(item => {
        let totalScore = 0;

        // 조회수 점수
        const viewWeight = weightMap.get('view_weight') || 0;
        totalScore += (item.view_count * viewWeight);

        // 매칭 요청수 점수
        const requestWeight = weightMap.get('request_weight') || 0;
        totalScore += (item.request_count * requestWeight);

        // 평점 점수
        const ratingWeight = weightMap.get('rating_weight') || 0;
        totalScore += (item.avg_rating * ratingWeight);

        // 콘텐츠 수 점수 (전문가, 카테고리용)
        if (item.content_count) {
          const contentCountWeight = weightMap.get('content_count_weight') || 0;
          totalScore += (item.content_count * contentCountWeight);
        }

        return {
          entity_id: item.entity_id,
          entity_name: item.entity_name,
          total_score: totalScore,
          view_count: item.view_count,
          request_count: item.request_count,
          avg_rating: item.avg_rating,
          rank: 0 // 임시값, 정렬 후 설정
        };
      });

      // 점수로 정렬하고 순위 설정
      results.sort((a, b) => b.total_score - a.total_score);
      results.forEach((result, index) => {
        result.rank = index + 1;
      });

      return results;
    } catch (error) {
      console.error('Error calculating ranking score:', error);
      return [];
    }
  }

  // 랭킹 결과 저장
  async saveRankingResults(rankingType: string, results: RankingResult[]): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      for (const result of results) {
        await this.pool.execute(
          `INSERT INTO rankings 
           (ranking_type, entity_id, entity_type, total_score, view_count, request_count, avg_rating, ranking_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           total_score = VALUES(total_score),
           view_count = VALUES(view_count),
           request_count = VALUES(request_count),
           avg_rating = VALUES(avg_rating),
           updated_at = NOW()`,
          [
            rankingType,
            result.entity_id,
            `${rankingType}_id`,
            result.total_score,
            result.view_count,
            result.request_count,
            result.avg_rating,
            today
          ]
        );
      }
      return true;
    } catch (error) {
      console.error('Error saving ranking results:', error);
      return false;
    }
  }

  // 랭킹 조회
  async getRankings(filters: RankingFilters): Promise<RankingResult[]> {
    try {
      let query = `
        SELECT 
          r.entity_id,
          r.total_score,
          r.view_count,
          r.request_count,
          r.avg_rating,
          r.ranking_date
        FROM rankings r
        WHERE r.ranking_type = ?
      `;
      
      const params: any[] = [filters.ranking_type];

      if (filters.date_from && filters.date_to) {
        query += ' AND r.ranking_date BETWEEN ? AND ?';
        params.push(filters.date_from, filters.date_to);
      }

      query += ' ORDER BY r.total_score DESC, r.ranking_date DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      const [rows] = await this.pool.execute(query, params);
      const results = rows as any[];

      // 엔티티 이름 조회
      const entityNames = await this.getEntityNames(filters.ranking_type!, results.map(r => r.entity_id));
      
      return results.map((row, index) => ({
        entity_id: row.entity_id,
        entity_name: entityNames[row.entity_id] || `Unknown ${filters.ranking_type}`,
        total_score: row.total_score,
        view_count: row.view_count,
        request_count: row.request_count,
        avg_rating: row.avg_rating,
        rank: index + 1
      }));
    } catch (error) {
      console.error('Error getting rankings:', error);
      return [];
    }
  }

  // 엔티티 이름 조회
  private async getEntityNames(rankingType: string, entityIds: number[]): Promise<Record<number, string>> {
    try {
      if (entityIds.length === 0) return {};

      let tableName = '';
      let nameColumn = '';
      
      switch (rankingType) {
        case 'ai_service':
          tableName = 'ai_services';
          nameColumn = 'ai_name';
          break;
        case 'content':
          tableName = 'contents';
          nameColumn = 'content_title';
          break;
        case 'expert':
          tableName = 'experts';
          nameColumn = 'expert_name';
          break;
        case 'category':
          tableName = 'content_categories';
          nameColumn = 'category_name';
          break;
        default:
          return {};
      }

      const [rows] = await this.pool.execute(
        `SELECT id, ${nameColumn} FROM ${tableName} WHERE id IN (${entityIds.map(() => '?').join(',')})`,
        entityIds
      );

      const nameMap: Record<number, string> = {};
      (rows as any[]).forEach(row => {
        nameMap[row.id] = row[nameColumn];
      });

      return nameMap;
    } catch (error) {
      console.error('Error getting entity names:', error);
      return {};
    }
  }

  // 전체 랭킹 계산 및 저장
  async calculateAndSaveAllRankings(dateFrom?: Date, dateTo?: Date): Promise<boolean> {
    try {
      const rankingTypes: ('ai_service' | 'content' | 'expert' | 'category')[] = [
        'ai_service', 'content', 'expert', 'category'
      ];

      for (const rankingType of rankingTypes) {
        let data: RankingData[] = [];

        switch (rankingType) {
          case 'ai_service':
            data = await this.calculateAIServiceRanking(dateFrom, dateTo);
            break;
          case 'content':
            data = await this.calculateContentRanking(dateFrom, dateTo);
            break;
          case 'expert':
            data = await this.calculateExpertRanking(dateFrom, dateTo);
            break;
          case 'category':
            data = await this.calculateCategoryRanking(dateFrom, dateTo);
            break;
        }

        const results = await this.calculateRankingScore(rankingType, data);
        await this.saveRankingResults(rankingType, results);
      }

      return true;
    } catch (error) {
      console.error('Error calculating and saving all rankings:', error);
      return false;
    }
  }
}

export default new RankingService(); 