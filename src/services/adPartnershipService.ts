import mysql from 'mysql2/promise';
import { dbConfig } from '../configs/database';
import { 
  AdPartnership, 
  AdPartnershipCreateRequest, 
  AdPartnershipUpdateRequest, 
  AdPartnershipFilters,
  PaginatedResponse,
  PaginationParams 
} from '../types/database';

export class AdPartnershipService {
  private async getConnection() {
    return await mysql.createConnection(dbConfig);
  }

  // 광고제휴 문의 생성
  async create(data: AdPartnershipCreateRequest): Promise<AdPartnership> {
    const connection = await this.getConnection();
    try {
      const [result] = await connection.execute(
        `INSERT INTO ad_partnerships (
          company_name, contact_person, contact_email, contact_phone,
          partnership_type, budget_range, campaign_period, target_audience,
          campaign_description, additional_requirements, attachment_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.company_name, data.contact_person, data.contact_email, data.contact_phone,
          data.partnership_type, data.budget_range, data.campaign_period, data.target_audience,
          data.campaign_description, data.additional_requirements, data.attachment_url
        ]
      );

      const insertId = (result as any).insertId;
      return await this.getById(insertId);
    } finally {
      await connection.end();
    }
  }

  // ID로 광고제휴 조회
  async getById(id: number): Promise<AdPartnership> {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM ad_partnerships WHERE id = ?',
        [id]
      );
      
      const partnerships = rows as AdPartnership[];
      if (partnerships.length === 0) {
        throw new Error('광고제휴 문의를 찾을 수 없습니다.');
      }
      
      return partnerships[0];
    } finally {
      await connection.end();
    }
  }

  // 광고제휴 목록 조회 (페이지네이션)
  async getList(
    pagination: PaginationParams,
    filters: AdPartnershipFilters = {}
  ): Promise<PaginatedResponse<AdPartnership>> {
    const connection = await this.getConnection();
    try {
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];

      if (filters.partnership_type) {
        whereClause += ' AND partnership_type = ?';
        params.push(filters.partnership_type);
      }

      if (filters.inquiry_status) {
        whereClause += ' AND inquiry_status = ?';
        params.push(filters.inquiry_status);
      }

      if (filters.date_from) {
        whereClause += ' AND created_at >= ?';
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        whereClause += ' AND created_at <= ?';
        params.push(filters.date_to);
      }

      // 총 개수 조회
      const [countRows] = await connection.execute(
        `SELECT COUNT(*) as total FROM ad_partnerships ${whereClause}`,
        params
      );
      const total = (countRows as any)[0].total;

      // 데이터 조회
      const offset = (pagination.page - 1) * pagination.limit;
      const [rows] = await connection.execute(
        `SELECT * FROM ad_partnerships ${whereClause} 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [...params, pagination.limit, offset]
      );

      return {
        data: rows as AdPartnership[],
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit)
        }
      };
    } finally {
      await connection.end();
    }
  }

  // 광고제휴 수정
  async update(id: number, data: AdPartnershipUpdateRequest): Promise<AdPartnership> {
    const connection = await this.getConnection();
    try {
      const updateFields: string[] = [];
      const params: any[] = [];

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${key} = ?`);
          // ISO 날짜 문자열을 MySQL DATETIME 형식으로 변환
          if (key === 'response_date' && typeof value === 'string') {
            params.push(new Date(value).toISOString().slice(0, 19).replace('T', ' '));
          } else {
            params.push(value);
          }
        }
      });

      if (updateFields.length === 0) {
        throw new Error('수정할 데이터가 없습니다.');
      }

      params.push(id);

      await connection.execute(
        `UPDATE ad_partnerships SET ${updateFields.join(', ')} WHERE id = ?`,
        params
      );

      return await this.getById(id);
    } finally {
      await connection.end();
    }
  }

  // 광고제휴 삭제
  async delete(id: number): Promise<void> {
    const connection = await this.getConnection();
    try {
      const [result] = await connection.execute(
        'DELETE FROM ad_partnerships WHERE id = ?',
        [id]
      );

      if ((result as any).affectedRows === 0) {
        throw new Error('광고제휴 문의를 찾을 수 없습니다.');
      }
    } finally {
      await connection.end();
    }
  }

  // 상태별 통계
  async getStatusStats(): Promise<Record<string, number>> {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT inquiry_status, COUNT(*) as count 
         FROM ad_partnerships 
         GROUP BY inquiry_status`
      );

      const stats: Record<string, number> = {};
      (rows as any[]).forEach(row => {
        stats[row.inquiry_status] = row.count;
      });

      return stats;
    } finally {
      await connection.end();
    }
  }
}

export const adPartnershipService = new AdPartnershipService();