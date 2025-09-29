import mysql from 'mysql2/promise';
import { dbConfig } from '../configs/database';
import { 
  Inquiry, 
  InquiryCreateRequest, 
  InquiryUpdateRequest, 
  InquiryFilters,
  PaginatedResponse,
  PaginationParams 
} from '../types/database';

export class InquiryService {
  private async getConnection() {
    return await mysql.createConnection(dbConfig);
  }

  // 고객문의 생성
  async create(data: InquiryCreateRequest): Promise<Inquiry> {
    const connection = await this.getConnection();
    try {
      // undefined 값들을 null로 변환
      const cleanData = {
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || null,
        inquiry_type: data.inquiry_type || 'general',
        subject: data.subject || '',
        message: data.message || '',
        attachment_url: data.attachment_url === '$undefined' || !data.attachment_url ? null : data.attachment_url
      };

      const params = [
        cleanData.name, 
        cleanData.email, 
        cleanData.phone, 
        cleanData.inquiry_type,
        cleanData.subject, 
        cleanData.message, 
        cleanData.attachment_url
      ].map(param => param === undefined ? null : param);

      const [result] = await connection.execute(
        `INSERT INTO inquiries (
          name, email, phone, inquiry_type, subject, message, attachment_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        params
      );

      const insertId = (result as any).insertId;
      return await this.getById(insertId);
    } finally {
      await connection.end();
    }
  }

  // ID로 고객문의 조회
  async getById(id: number): Promise<Inquiry> {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM inquiries WHERE id = ?',
        [id]
      );
      
      const inquiries = rows as Inquiry[];
      if (inquiries.length === 0) {
        throw new Error('고객문의를 찾을 수 없습니다.');
      }
      
      return inquiries[0];
    } finally {
      await connection.end();
    }
  }

  // 고객문의 목록 조회 (페이지네이션)
  async getList(
    pagination: PaginationParams,
    filters: InquiryFilters = {}
  ): Promise<PaginatedResponse<Inquiry>> {
    const connection = await this.getConnection();
    try {
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];

      if (filters.inquiry_type) {
        whereClause += ' AND inquiry_type = ?';
        params.push(filters.inquiry_type);
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
        `SELECT COUNT(*) as total FROM inquiries ${whereClause}`,
        params
      );
      const total = (countRows as any)[0].total;

      // 데이터 조회
      const offset = (pagination.page - 1) * pagination.limit;
      const [rows] = await connection.execute(
        `SELECT * FROM inquiries ${whereClause} 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [...params, pagination.limit, offset]
      );

      return {
        data: rows as Inquiry[],
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

  // 고객문의 수정
  async update(id: number, data: InquiryUpdateRequest): Promise<Inquiry> {
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
        `UPDATE inquiries SET ${updateFields.join(', ')} WHERE id = ?`,
        params
      );

      return await this.getById(id);
    } finally {
      await connection.end();
    }
  }

  // 고객문의 삭제
  async delete(id: number): Promise<void> {
    const connection = await this.getConnection();
    try {
      const [result] = await connection.execute(
        'DELETE FROM inquiries WHERE id = ?',
        [id]
      );

      if ((result as any).affectedRows === 0) {
        throw new Error('고객문의를 찾을 수 없습니다.');
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
         FROM inquiries 
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

export const inquiryService = new InquiryService();