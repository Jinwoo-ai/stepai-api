-- 메인페이지 설정 관리 테이블들

-- 메인페이지 영상 설정 테이블
CREATE TABLE IF NOT EXISTS homepage_videos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ai_video_id INT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ai_video_id) REFERENCES ai_videos(id) ON DELETE CASCADE,
  UNIQUE KEY unique_homepage_video (ai_video_id),
  INDEX idx_homepage_video_order (display_order, is_active)
);

-- 메인페이지 큐레이션 순서 설정 테이블
CREATE TABLE IF NOT EXISTS homepage_curations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  curation_id INT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (curation_id) REFERENCES curations(id) ON DELETE CASCADE,
  UNIQUE KEY unique_homepage_curation (curation_id),
  INDEX idx_homepage_curation_order (display_order, is_active)
);

-- 메인페이지 STEP PICK 서비스 설정 테이블
CREATE TABLE IF NOT EXISTS homepage_step_pick_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ai_service_id INT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE,
  UNIQUE KEY unique_homepage_step_pick (ai_service_id),
  INDEX idx_homepage_step_pick_order (display_order, is_active)
);

-- 트렌드 섹션 설정 테이블
CREATE TABLE IF NOT EXISTS trend_sections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  section_type VARCHAR(50) NOT NULL, -- 'popular', 'latest', 'step_pick'
  section_title VARCHAR(100) NOT NULL,
  section_description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_trend_section (section_type)
);

-- 트렌드 섹션별 AI 서비스 설정 테이블
CREATE TABLE IF NOT EXISTS trend_section_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trend_section_id INT NOT NULL,
  ai_service_id INT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE, -- 상단 고정 여부
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (trend_section_id) REFERENCES trend_sections(id) ON DELETE CASCADE,
  FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE,
  UNIQUE KEY unique_trend_service (trend_section_id, ai_service_id),
  INDEX idx_trend_service_order (trend_section_id, display_order, is_featured)
);

-- 기본 트렌드 섹션 데이터 삽입
INSERT IGNORE INTO trend_sections (section_type, section_title, section_description, display_order) VALUES
('popular', '요즘 많이 쓰는', '사용자들이 가장 많이 이용하는 인기 AI 서비스', 1),
('latest', '최신 등록', '최근에 새로 등록된 따끈따끈한 AI 서비스', 2),
('step_pick', 'STEP PICK', 'STEP AI가 엄선한 추천 AI 서비스', 3);