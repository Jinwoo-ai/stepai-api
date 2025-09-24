import { Router, Request, Response } from 'express';
import { dbConfig } from '../configs/database';
import mysql from 'mysql2/promise';

const router = Router();

router.post('/create-ad-partnerships-table', async (req: Request, res: Response) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ad_partnerships (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_name VARCHAR(100) NOT NULL COMMENT '회사명',
        contact_person VARCHAR(50) NOT NULL COMMENT '담당자명',
        contact_email VARCHAR(100) NOT NULL COMMENT '담당자 이메일',
        contact_phone VARCHAR(20) COMMENT '연락처',
        partnership_type VARCHAR(50) NOT NULL COMMENT '제휴 유형',
        budget_range VARCHAR(50) COMMENT '예산 범위',
        campaign_period VARCHAR(100) COMMENT '캠페인 기간',
        target_audience TEXT COMMENT '타겟 고객층',
        campaign_description TEXT COMMENT '캠페인 설명',
        additional_requirements TEXT COMMENT '추가 요구사항',
        attachment_url VARCHAR(500) COMMENT '첨부파일 URL',
        inquiry_status VARCHAR(20) DEFAULT 'pending' COMMENT '문의 상태',
        admin_notes TEXT COMMENT '관리자 메모',
        response_date TIMESTAMP NULL COMMENT '응답일',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_partnership_type (partnership_type),
        INDEX idx_inquiry_status (inquiry_status),
        INDEX idx_created_at (created_at)
      )
    `;
    
    await connection.execute(createTableSQL);
    await connection.end();
    
    res.json({
      success: true,
      message: 'ad_partnerships 테이블이 성공적으로 생성되었습니다.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '테이블 생성 실패'
    });
  }
});

export default router;