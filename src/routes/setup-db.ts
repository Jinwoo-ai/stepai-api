import express from 'express';
import { getDatabaseConnection } from '../configs/database';

const router = express.Router();

// 홈페이지 설정 테이블 생성
router.post('/homepage-settings', async (req, res) => {
  const connection = await getDatabaseConnection().getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 트렌드 섹션 테이블 생성
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS trend_sections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        section_type VARCHAR(50) NOT NULL,
        section_title VARCHAR(100) NOT NULL,
        section_description TEXT,
        is_category_based BOOLEAN DEFAULT TRUE,
        is_active BOOLEAN DEFAULT TRUE,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // is_category_based 컴럼 추가 (이미 존재하면 무시)
    try {
      await connection.execute(`
        ALTER TABLE trend_sections 
        ADD COLUMN is_category_based BOOLEAN DEFAULT TRUE AFTER section_description
      `);
    } catch (error) {
      console.log('is_category_based column already exists');
    }

    // 트렌드 섹션별 서비스 테이블 생성
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS trend_section_services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        trend_section_id INT NOT NULL,
        ai_service_id INT NOT NULL,
        category_id INT NULL,
        display_order INT DEFAULT 0,
        is_featured BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (trend_section_id) REFERENCES trend_sections(id) ON DELETE CASCADE,
        FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        UNIQUE KEY unique_trend_service_category (trend_section_id, ai_service_id, category_id)
      )
    `);
    
    // category_id 컬럼 추가 (이미 존재하면 무시)
    try {
      await connection.execute(`
        ALTER TABLE trend_section_services 
        ADD COLUMN category_id INT NULL AFTER ai_service_id,
        ADD FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      `);
    } catch (error) {
      console.log('category_id column already exists in trend_section_services');
    }

    // homepage_step_pick_services 테이블에 category_id 컬럼 추가 (이미 존재하면 무시)
    try {
      await connection.execute(`
        ALTER TABLE homepage_step_pick_services 
        ADD COLUMN category_id INT NULL AFTER ai_service_id,
        ADD FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      `);
    } catch (error) {
      // 컬럼이 이미 존재하는 경우 무시
      console.log('category_id column already exists or foreign key already exists');
    }

    // 기본 트렌드 섹션 데이터 삽입
    const [existingSections] = await connection.execute('SELECT COUNT(*) as count FROM trend_sections');
    if (existingSections[0].count === 0) {
      await connection.execute(`
        INSERT INTO trend_sections (section_type, section_title, section_description, is_category_based, is_active, display_order) VALUES
        ('popular', '요즘 많이 쓰는', '사용자들이 많이 이용하는 인기 AI 서비스', TRUE, TRUE, 1),
        ('latest', '최신 등록', '최근에 등록된 새로운 AI 서비스', TRUE, TRUE, 2),
        ('step_pick', 'STEP PICK', 'STEP AI가 추천하는 엄선된 AI 서비스', TRUE, TRUE, 3)
      `);
    }

    // 인덱스 추가
    try {
      await connection.execute(`CREATE INDEX idx_trend_section_services_section_category ON trend_section_services(trend_section_id, category_id)`);
    } catch (error) {
      console.log('Index already exists');
    }
    
    try {
      await connection.execute(`CREATE INDEX idx_trend_section_services_display_order ON trend_section_services(display_order)`);
    } catch (error) {
      console.log('Index already exists');
    }
    
    try {
      await connection.execute(`CREATE INDEX idx_homepage_step_pick_category ON homepage_step_pick_services(category_id)`);
    } catch (error) {
      console.log('Index already exists');
    }

    await connection.commit();
    
    res.json({
      success: true,
      message: '홈페이지 설정 테이블이 성공적으로 생성되었습니다.'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Database setup error:', error);
    res.status(500).json({
      success: false,
      error: '테이블 생성 중 오류가 발생했습니다.',
      details: error.message
    });
  } finally {
    connection.release();
  }
});

// 카테고리 표시 순서 테이블 생성
router.post('/category-display-order', async (req, res) => {
  const connection = await getDatabaseConnection().getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 카테고리 표시 순서 테이블 생성 (올바른 테이블명 사용)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ai_service_category_display_order (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        ai_service_id INT NOT NULL,
        display_order INT DEFAULT 0,
        is_featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE,
        UNIQUE KEY unique_category_service (category_id, ai_service_id)
      )
    `);
    
    // 인덱스 추가
    try {
      await connection.execute(`CREATE INDEX idx_ai_service_category_display_order_category ON ai_service_category_display_order(category_id)`);
    } catch (error) {
      console.log('Index already exists');
    }
    
    try {
      await connection.execute(`CREATE INDEX idx_ai_service_category_display_order_display_order ON ai_service_category_display_order(display_order)`);
    } catch (error) {
      console.log('Index already exists');
    }

    await connection.commit();
    
    res.json({
      success: true,
      message: '카테고리 표시 순서 테이블이 성공적으로 생성되었습니다.'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Category display order table setup error:', error);
    res.status(500).json({
      success: false,
      error: '카테고리 표시 순서 테이블 생성 중 오류가 발생했습니다.',
      details: error.message
    });
  } finally {
    connection.release();
  }
});

export default router;