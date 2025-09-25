-- 트렌드 섹션 테이블 생성
CREATE TABLE IF NOT EXISTS trend_sections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  section_type VARCHAR(50) NOT NULL,
  section_title VARCHAR(100) NOT NULL,
  section_description TEXT,
  is_category_based BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 트렌드 섹션별 서비스 테이블 생성
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
);

-- homepage_step_pick_services 테이블에 category_id 컬럼 추가
ALTER TABLE homepage_step_pick_services 
ADD COLUMN category_id INT NULL AFTER ai_service_id,
ADD FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;

-- 기본 트렌드 섹션 데이터 삽입
INSERT IGNORE INTO trend_sections (section_type, section_title, section_description, is_category_based, is_active, display_order) VALUES
('popular', '요즘 많이 쓰는', '사용자들이 많이 이용하는 인기 AI 서비스', TRUE, TRUE, 1),
('latest', '최신 등록', '최근에 등록된 새로운 AI 서비스', TRUE, TRUE, 2),
('step_pick', 'STEP PICK', 'STEP AI가 추천하는 엄선된 AI 서비스', TRUE, TRUE, 3);

-- 인덱스 추가
CREATE INDEX idx_trend_section_services_section_category ON trend_section_services(trend_section_id, category_id);
CREATE INDEX idx_trend_section_services_display_order ON trend_section_services(display_order);
CREATE INDEX idx_homepage_step_pick_category ON homepage_step_pick_services(category_id);