const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function createMissingTables() {
  const connection = await mysql.createConnection({
    host: 'resource.local.topialive.co.kr',
    port: 13001,
    user: 'admin',
    password: 'spib5aslzaspIdude3r8',
    database: 'STEPAI_TEST'
  });

  try {
    console.log('데이터베이스 연결 성공');

    // 1. 관리자 계정 테이블 생성
    console.log('관리자 계정 테이블 생성 중...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100),
        role VARCHAR(50) DEFAULT 'admin',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('관리자 계정 테이블 생성 완료');

    // 2. 관리자 계정 생성
    console.log('관리자 계정 생성 중...');

    // 관리자 계정 삽입 (bcrypt 해시된 비밀번호: stepai1234)
    const hashedPassword = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; // stepai1234
    await connection.execute(`
      INSERT IGNORE INTO admin_users (email, password, name, role) 
      VALUES ('admin@stepai.com', ?, 'StepAI Admin', 'admin')
    `, [hashedPassword]);
    console.log('관리자 계정 생성 완료');

    // 3. 고객문의 테이블 생성
    console.log('고객문의 테이블 생성 중...');
    await connection.execute(`
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
    `);
    console.log('고객문의 테이블 생성 완료');

    // 4. AI 서비스에 is_new 컬럼 추가
    console.log('AI 서비스 테이블에 is_new 컬럼 추가 중...');
    try {
      await connection.execute(`
        ALTER TABLE ai_services 
        ADD COLUMN is_new BOOLEAN DEFAULT FALSE COMMENT 'NEW 뱃지 표시 여부'
      `);
      console.log('is_new 컬럼 추가 완료');
    } catch (error) {
      console.log('is_new 컬럼이 이미 존재합니다:', error.message);
    }

    // 5. AI 서비스에 view_count 컬럼 추가
    console.log('AI 서비스 테이블에 view_count 컬럼 추가 중...');
    try {
      await connection.execute(`
        ALTER TABLE ai_services 
        ADD COLUMN view_count INT DEFAULT 0 COMMENT '조회수'
      `);
      console.log('view_count 컬럼 추가 완료');
    } catch (error) {
      console.log('view_count 컬럼이 이미 존재합니다:', error.message);
    }

    // 6. 카테고리 표시 순서 테이블 생성
    console.log('카테고리 표시 순서 테이블 생성 중...');
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS ai_service_category_display_order (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ai_service_id INT NOT NULL,
          category_id INT NOT NULL,
          display_order INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_service_category_order (ai_service_id, category_id),
          INDEX idx_category_order (category_id, display_order)
        )
      `);
      console.log('카테고리 표시 순서 테이블 생성 완료');
    } catch (error) {
      console.log('카테고리 표시 순서 테이블 생성 오류:', error.message);
    }

    console.log('모든 테이블 생성 및 데이터 삽입 완료!');

  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await connection.end();
  }
}

createMissingTables();