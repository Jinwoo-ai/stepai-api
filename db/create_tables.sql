-- StepAI API Database Schema - AI 서비스 소개 및 이용방법 추천 서비스
-- MySQL 8.0 이상 버전용

-- Users 테이블 (회원)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  user_type VARCHAR(20) DEFAULT 'member', -- member, admin
  user_status VARCHAR(20) DEFAULT 'active', -- active, inactive, pending, deleted
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- AI Services 테이블 (AI 서비스)
CREATE TABLE ai_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ai_name VARCHAR(100) NOT NULL, -- 서비스명(국문)
  ai_name_en VARCHAR(100), -- 서비스명(영문)
  ai_description TEXT, -- 한줄설명
  ai_website VARCHAR(255), -- 대표 URL
  ai_logo VARCHAR(255), -- 로고(URL)
  company_name VARCHAR(100), -- 기업명(국문)
  company_name_en VARCHAR(100), -- 기업명(영문)
  embedded_video_url VARCHAR(500), -- 임베디드 영상 URL
  headquarters VARCHAR(50), -- 본사
  main_features TEXT, -- 주요기능
  target_users TEXT, -- 타겟 사용자
  use_cases TEXT, -- 추천활용사례
  pricing_info TEXT,
  difficulty_level VARCHAR(20) DEFAULT 'beginner', -- 난이도
  usage_availability VARCHAR(10), -- 사용 (가능, 불가능)
  ai_status VARCHAR(20) DEFAULT 'active',
  is_visible BOOLEAN DEFAULT TRUE, -- Alive (Yes/No)
  is_step_pick BOOLEAN DEFAULT FALSE, -- 표시위치 (STEP_PICK)
  nationality VARCHAR(20), -- 본사 (deprecated, use headquarters)
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- AI Videos 테이블 (AI 영상)
CREATE TABLE ai_videos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  video_title VARCHAR(200) NOT NULL,
  video_description TEXT,
  video_url VARCHAR(255) NOT NULL,
  thumbnail_url VARCHAR(255),
  duration INT DEFAULT 0, -- 초 단위
  video_status VARCHAR(20) DEFAULT 'active', -- active, inactive, pending, deleted
  is_visible BOOLEAN DEFAULT TRUE, -- 사이트 노출여부
  view_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories 테이블 (카테고리 - 메인/서브 구조)
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL,
  category_description TEXT,
  category_icon VARCHAR(255),
  parent_id INT NULL, -- 부모 카테고리 ID (NULL이면 메인 카테고리)
  category_order INT DEFAULT 0,
  priority INT DEFAULT 0, -- 우선순위 (높을수록 상단 고정)
  category_status VARCHAR(20) DEFAULT 'active', -- active, inactive
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id)
);

-- Curations 테이블 (큐레이션)
CREATE TABLE curations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  curation_title VARCHAR(200) NOT NULL,
  curation_description TEXT,
  curation_thumbnail VARCHAR(255),
  curation_order INT DEFAULT 0,
  curation_status VARCHAR(20) DEFAULT 'active', -- active, inactive, pending, deleted
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tags 테이블 (태그)
CREATE TABLE tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tag_name VARCHAR(50) UNIQUE NOT NULL,
  tag_count INT DEFAULT 0, -- 사용 횟수
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- AI Service Categories 테이블 (AI 서비스-카테고리 관계)
CREATE TABLE ai_service_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ai_service_id INT NOT NULL,
  category_id INT NOT NULL,
  is_main_category BOOLEAN DEFAULT FALSE, -- 메인(대표) 카테고리 여부
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE KEY unique_ai_service_category (ai_service_id, category_id)
);

-- AI Video Categories 테이블 (AI 영상-카테고리 관계)
CREATE TABLE ai_video_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ai_video_id INT NOT NULL,
  category_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ai_video_id) REFERENCES ai_videos(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE KEY unique_ai_video_category (ai_video_id, category_id)
);

-- AI Service Tags 테이블 (AI 서비스-태그 관계)
CREATE TABLE ai_service_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ai_service_id INT NOT NULL,
  tag_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE KEY unique_ai_service_tag (ai_service_id, tag_id)
);

-- AI Video Tags 테이블 (AI 영상-태그 관계)
CREATE TABLE ai_video_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ai_video_id INT NOT NULL,
  tag_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ai_video_id) REFERENCES ai_videos(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE KEY unique_ai_video_tag (ai_video_id, tag_id)
);

-- AI Video Services 테이블 (AI 영상에서 사용된 AI 서비스)
CREATE TABLE ai_video_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ai_video_id INT NOT NULL,
  ai_service_id INT NOT NULL,
  usage_description TEXT,
  usage_order INT DEFAULT 0, -- 사용 순서
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ai_video_id) REFERENCES ai_videos(id) ON DELETE CASCADE,
  FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE,
  UNIQUE KEY unique_ai_video_service (ai_video_id, ai_service_id)
);

-- Curation AI Services 테이블 (큐레이션에 포함된 AI 서비스)
CREATE TABLE curation_ai_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  curation_id INT NOT NULL,
  ai_service_id INT NOT NULL,
  service_order INT DEFAULT 0, -- 큐레이션 내 순서
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (curation_id) REFERENCES curations(id) ON DELETE CASCADE,
  FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE,
  UNIQUE KEY unique_curation_ai_service (curation_id, ai_service_id)
);

-- User Favorites 테이블 (사용자 즐겨찾기)
CREATE TABLE user_favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  favorite_type VARCHAR(20) NOT NULL, -- ai_service, ai_video, curation
  favorite_id INT NOT NULL, -- AI 서비스, AI 영상, 큐레이션 ID
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_favorite (user_id, favorite_type, favorite_id)
);

-- AI Service Views 테이블 (AI 서비스 조회 기록)
CREATE TABLE ai_service_views (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ai_service_id INT NOT NULL,
  user_id INT NULL,
  view_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- AI Video Views 테이블 (AI 영상 조회 기록)
CREATE TABLE ai_video_views (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ai_video_id INT NOT NULL,
  user_id INT NULL,
  view_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ai_video_id) REFERENCES ai_videos(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Reviews 테이블 (리뷰)
CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  review_type VARCHAR(20) NOT NULL, -- ai_service, ai_video
  review_target_id INT NOT NULL, -- AI 서비스 또는 AI 영상 ID
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  review_status VARCHAR(20) DEFAULT 'active', -- active, hidden, deleted
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_review (user_id, review_type, review_target_id)
);

-- AI Service Contents 테이블 (AI 서비스 콘텐츠)
CREATE TABLE ai_service_contents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ai_service_id INT NOT NULL,
  content_type VARCHAR(50) NOT NULL, -- target_users, main_features, use_cases
  content_title VARCHAR(200),
  content_text TEXT,
  content_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE
);

-- AI Service SNS 테이블 (AI 서비스 SNS)
CREATE TABLE ai_service_sns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ai_service_id INT NOT NULL,
  sns_type VARCHAR(50) NOT NULL, -- twitter, facebook, instagram, youtube, linkedin, etc.
  sns_url VARCHAR(500) NOT NULL,
  sns_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE
);

-- AI Types 테이블 (AI 형태)
CREATE TABLE ai_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type_name VARCHAR(50) NOT NULL UNIQUE, -- WEB, MOB, DES, EXT, API
  type_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Pricing Models 테이블 (가격 모델)
CREATE TABLE pricing_models (
  id INT AUTO_INCREMENT PRIMARY KEY,
  model_name VARCHAR(50) NOT NULL UNIQUE, -- 유료, 무료, 프리미엄 등
  model_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Target Types 테이블 (타겟 타입)
CREATE TABLE target_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type_code VARCHAR(10) NOT NULL UNIQUE, -- B, C, G
  type_name VARCHAR(50) NOT NULL, -- B2B, B2C, B2G
  type_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- AI Service Types 테이블 (AI 서비스-타입 관계)
CREATE TABLE ai_service_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ai_service_id INT NOT NULL,
  ai_type_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE,
  FOREIGN KEY (ai_type_id) REFERENCES ai_types(id) ON DELETE CASCADE,
  UNIQUE KEY unique_ai_service_type (ai_service_id, ai_type_id)
);

-- AI Service Pricing Models 테이블 (AI 서비스-가격모델 관계)
CREATE TABLE ai_service_pricing_models (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ai_service_id INT NOT NULL,
  pricing_model_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE,
  FOREIGN KEY (pricing_model_id) REFERENCES pricing_models(id) ON DELETE CASCADE,
  UNIQUE KEY unique_ai_service_pricing (ai_service_id, pricing_model_id)
);

-- AI Service Target Types 테이블 (AI 서비스-타겟타입 관계)
CREATE TABLE ai_service_target_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ai_service_id INT NOT NULL,
  target_type_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE,
  FOREIGN KEY (target_type_id) REFERENCES target_types(id) ON DELETE CASCADE,
  UNIQUE KEY unique_ai_service_target (ai_service_id, target_type_id)
);

-- AI Service Similar Services 테이블 (유사 서비스)
CREATE TABLE ai_service_similar_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ai_service_id INT NOT NULL,
  similar_service_id INT NOT NULL,
  similarity_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE,
  FOREIGN KEY (similar_service_id) REFERENCES ai_services(id) ON DELETE CASCADE,
  UNIQUE KEY unique_similar_service (ai_service_id, similar_service_id)
);

-- Rankings 테이블 (랭킹 결과 저장)
CREATE TABLE rankings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ranking_type VARCHAR(50) NOT NULL, -- ai_service, ai_video, category, curation
  entity_id INT NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- ai_service_id, ai_video_id, category_id, curation_id
  total_score DECIMAL(10,3) DEFAULT 0,
  view_count INT DEFAULT 0,
  favorite_count INT DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  ranking_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Site Settings 테이블 (사이트 정보 관리)
CREATE TABLE site_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_title VARCHAR(200) NOT NULL DEFAULT 'StepAI',
  company_name VARCHAR(100) NOT NULL DEFAULT 'StepAI',
  ceo_name VARCHAR(50),
  business_number VARCHAR(20),
  phone_number VARCHAR(20),
  address TEXT,
  privacy_officer VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Ad Partnerships 테이블 (광고제휴)
CREATE TABLE ad_partnerships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(100) NOT NULL COMMENT '회사명',
  contact_person VARCHAR(50) NOT NULL COMMENT '담당자명',
  contact_email VARCHAR(100) NOT NULL COMMENT '담당자 이메일',
  contact_phone VARCHAR(20) COMMENT '연락처',
  partnership_type VARCHAR(50) NOT NULL COMMENT '제휴 유형', -- banner, sponsored_content, affiliate, etc.
  budget_range VARCHAR(50) COMMENT '예산 범위',
  campaign_period VARCHAR(100) COMMENT '캠페인 기간',
  target_audience TEXT COMMENT '타겟 고객층',
  campaign_description TEXT COMMENT '캠페인 설명',
  additional_requirements TEXT COMMENT '추가 요구사항',
  attachment_url VARCHAR(500) COMMENT '첨부파일 URL',
  inquiry_status VARCHAR(20) DEFAULT 'pending' COMMENT '문의 상태', -- pending, reviewing, approved, rejected, completed
  admin_notes TEXT COMMENT '관리자 메모',
  response_date TIMESTAMP NULL COMMENT '응답일',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_partnership_type (partnership_type),
  INDEX idx_inquiry_status (inquiry_status),
  INDEX idx_created_at (created_at)
);