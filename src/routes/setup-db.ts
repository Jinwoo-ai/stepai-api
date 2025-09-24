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

router.post('/migrate-users-table', async (req: Request, res: Response) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // 기존 users 테이블에 새 컬럼 추가
    await connection.execute(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS name VARCHAR(50) AFTER id,
      ADD COLUMN IF NOT EXISTS industry VARCHAR(50) AFTER email,
      ADD COLUMN IF NOT EXISTS job_role VARCHAR(50) AFTER industry,
      ADD COLUMN IF NOT EXISTS job_level VARCHAR(30) AFTER job_role,
      ADD COLUMN IF NOT EXISTS experience_years INT AFTER job_level
    `);
    
    // 불필요한 컬럼 제거 (있는 경우에만)
    try {
      await connection.execute(`ALTER TABLE users DROP COLUMN username`);
    } catch (e) {
      // 컬럼이 없으면 무시
    }
    
    try {
      await connection.execute(`ALTER TABLE users DROP COLUMN password_hash`);
    } catch (e) {
      // 컬럼이 없으면 무시
    }
    
    const createUserSnsSQL = `
      CREATE TABLE IF NOT EXISTS user_sns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        sns_type VARCHAR(20) NOT NULL COMMENT 'SNS 종류',
        sns_user_id VARCHAR(100) NOT NULL COMMENT 'SNS 사용자 ID',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_sns_user (sns_type, sns_user_id),
        INDEX idx_user_id (user_id),
        INDEX idx_sns_type (sns_type)
      )
    `;
    
    const createAccessTokensSQL = `
      CREATE TABLE IF NOT EXISTS access_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_token (token),
        INDEX idx_user_id (user_id),
        INDEX idx_expires_at (expires_at)
      )
    `;
    
    await connection.execute(createUserSnsSQL);
    await connection.execute(createAccessTokensSQL);
    await connection.end();
    
    res.json({
      success: true,
      message: '회원 관련 테이블이 성공적으로 마이그레이션되었습니다.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '테이블 마이그레이션 실패'
    });
  }
});

router.post('/insert-user-test-data', async (req: Request, res: Response) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const testUsers = [
      {
        name: '김철수',
        email: 'kim@naver.com',
        industry: 'IT',
        job_role: '개발자',
        job_level: '대리',
        experience_years: 3,
        sns_type: 'naver',
        sns_user_id: 'naver_12345'
      },
      {
        name: '박영희',
        email: 'park@kakao.com',
        industry: '마케팅',
        job_role: '마케터',
        job_level: '과장',
        experience_years: 5,
        sns_type: 'kakao',
        sns_user_id: 'kakao_67890'
      },
      {
        name: '이민수',
        email: 'lee@gmail.com',
        industry: '디자인',
        job_role: 'UI/UX 디자이너',
        job_level: '주임',
        experience_years: 2,
        sns_type: 'google',
        sns_user_id: 'google_abcde'
      }
    ];
    
    for (const userData of testUsers) {
      // 사용자 생성
      const [userResult] = await connection.execute(
        `INSERT INTO users (name, email, industry, job_role, job_level, experience_years) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userData.name, userData.email, userData.industry, userData.job_role, userData.job_level, userData.experience_years]
      );
      
      const userId = (userResult as any).insertId;
      
      // SNS 정보 생성
      await connection.execute(
        `INSERT INTO user_sns (user_id, sns_type, sns_user_id) VALUES (?, ?, ?)`,
        [userId, userData.sns_type, userData.sns_user_id]
      );
    }
    
    await connection.end();
    
    res.json({
      success: true,
      message: `${testUsers.length}개의 테스트 회원 데이터가 성공적으로 삽입되었습니다.`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '테스트 데이터 삽입 실패'
    });
  }
});

router.post('/insert-test-data', async (req: Request, res: Response) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const testData = [
      {
        company_name: '삼성전자',
        contact_person: '김철수',
        contact_email: 'kim@samsung.com',
        contact_phone: '010-1234-5678',
        partnership_type: 'banner',
        budget_range: '1000만원 - 5000만원',
        campaign_period: '2024년 3월 - 6월',
        target_audience: '20-40대 직장인',
        campaign_description: 'AI 서비스 홍보를 위한 배너 광고',
        inquiry_status: 'pending'
      },
      {
        company_name: 'LG전자',
        contact_person: '박영희',
        contact_email: 'park@lg.com',
        contact_phone: '010-9876-5432',
        partnership_type: 'sponsored_content',
        budget_range: '500만원 - 2000만원',
        campaign_period: '2024년 4월 - 8월',
        target_audience: '30-50대 관리자',
        campaign_description: 'AI 도구 활용 콘텐츠 제작',
        inquiry_status: 'reviewing'
      },
      {
        company_name: '네이버',
        contact_person: '이민수',
        contact_email: 'lee@naver.com',
        contact_phone: '010-5555-7777',
        partnership_type: 'affiliate',
        budget_range: '2000만원 - 1억원',
        campaign_period: '2024년 전체',
        target_audience: '전 연령대',
        campaign_description: 'AI 서비스 제휴 마케팅',
        inquiry_status: 'approved'
      },
      {
        company_name: '카카오',
        contact_person: '정수진',
        contact_email: 'jung@kakao.com',
        contact_phone: '010-3333-4444',
        partnership_type: 'collaboration',
        budget_range: '3000만원 - 8000만원',
        campaign_period: '2024년 하반기',
        target_audience: '20-30대 개발자',
        campaign_description: 'AI 개발 도구 공동 마케팅',
        inquiry_status: 'completed'
      },
      {
        company_name: '스타트업ABC',
        contact_person: '최영수',
        contact_email: 'choi@startup.com',
        contact_phone: '010-1111-2222',
        partnership_type: 'other',
        budget_range: '100만원 - 500만원',
        campaign_period: '2024년 2분기',
        target_audience: '스타트업 창업자',
        campaign_description: '소규모 AI 서비스 홍보',
        inquiry_status: 'rejected'
      }
    ];
    
    for (const data of testData) {
      await connection.execute(
        `INSERT INTO ad_partnerships (
          company_name, contact_person, contact_email, contact_phone,
          partnership_type, budget_range, campaign_period, target_audience,
          campaign_description, inquiry_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.company_name, data.contact_person, data.contact_email, data.contact_phone,
          data.partnership_type, data.budget_range, data.campaign_period, data.target_audience,
          data.campaign_description, data.inquiry_status
        ]
      );
    }
    
    await connection.end();
    
    res.json({
      success: true,
      message: `${testData.length}개의 테스트 데이터가 성공적으로 삽입되었습니다.`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '테스트 데이터 삽입 실패'
    });
  }
});

export default router;