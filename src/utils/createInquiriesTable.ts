import mysql from 'mysql2/promise';
import { dbConfig } from '../configs/database';

async function createInquiriesTable() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('고객문의 테이블 생성 중...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS inquiries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL COMMENT '문의자 이름',
        email VARCHAR(255) NOT NULL COMMENT '문의자 이메일',
        phone VARCHAR(20) COMMENT '문의자 전화번호',
        inquiry_type ENUM('general', 'technical', 'partnership', 'bug_report', 'feature_request') DEFAULT 'general' COMMENT '문의 유형',
        subject VARCHAR(255) NOT NULL COMMENT '문의 제목',
        message TEXT NOT NULL COMMENT '문의 내용',
        attachment_url VARCHAR(500) COMMENT '첨부파일 URL',
        inquiry_status ENUM('pending', 'in_progress', 'resolved', 'closed') DEFAULT 'pending' COMMENT '문의 상태',
        admin_notes TEXT COMMENT '관리자 메모',
        response_date DATETIME COMMENT '답변 일시',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
        
        INDEX idx_inquiry_type (inquiry_type),
        INDEX idx_inquiry_status (inquiry_status),
        INDEX idx_created_at (created_at),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='고객문의 테이블'
    `;
    
    await connection.execute(createTableSQL);
    console.log('✅ 고객문의 테이블이 성공적으로 생성되었습니다.');
    
  } catch (error) {
    console.error('❌ 고객문의 테이블 생성 실패:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// 직접 실행
if (require.main === module) {
  createInquiriesTable()
    .then(() => {
      console.log('완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('오류:', error);
      process.exit(1);
    });
}

export { createInquiriesTable };