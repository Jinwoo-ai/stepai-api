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
  ai_name VARCHAR(100) NOT NULL,
  ai_description TEXT,
  ai_type VARCHAR(255) NOT NULL, -- LLM, RAG, GPTs, Image_Generation, Video_Generation, etc.
  ai_website VARCHAR(255),
  ai_logo VARCHAR(255),
  pricing_model VARCHAR(50), -- free, freemium, paid, subscription
  pricing_info TEXT,
  difficulty_level VARCHAR(20) DEFAULT 'beginner', -- beginner, intermediate, advanced
  ai_status VARCHAR(20) DEFAULT 'active', -- active, inactive, pending, deleted
  is_visible BOOLEAN DEFAULT TRUE, -- 사이트 노출여부
  is_step_pick BOOLEAN DEFAULT FALSE, -- Step Pick 여부
  nationality VARCHAR(20),
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
  total_score DECIMAL(10,3) NOT NULL,
  view_count INT DEFAULT 0,
  favorite_count INT DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0.00,
  ranking_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_ranking (ranking_type, entity_id, ranking_date)
);

-- 인덱스 생성
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type_status ON users(user_type, user_status);

CREATE INDEX idx_ai_services_type ON ai_services(ai_type);
CREATE INDEX idx_ai_services_status ON ai_services(ai_status);
CREATE INDEX idx_ai_services_nationality ON ai_services(nationality);

CREATE INDEX idx_ai_videos_status ON ai_videos(video_status);
CREATE INDEX idx_ai_videos_view_count ON ai_videos(view_count);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_status ON categories(category_status);

CREATE INDEX idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_type ON user_favorites(favorite_type, favorite_id);

CREATE INDEX idx_ai_service_views_service ON ai_service_views(ai_service_id);
CREATE INDEX idx_ai_service_views_date ON ai_service_views(view_date);

CREATE INDEX idx_ai_video_views_video ON ai_video_views(ai_video_id);
CREATE INDEX idx_ai_video_views_date ON ai_video_views(view_date);

CREATE INDEX idx_reviews_type_target ON reviews(review_type, review_target_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

CREATE INDEX idx_ai_service_contents_service ON ai_service_contents(ai_service_id);
CREATE INDEX idx_ai_service_contents_type ON ai_service_contents(content_type);

CREATE INDEX idx_ai_service_sns_service ON ai_service_sns(ai_service_id);
CREATE INDEX idx_ai_service_sns_type ON ai_service_sns(sns_type);

CREATE INDEX idx_ai_service_similar_service ON ai_service_similar_services(ai_service_id);
CREATE INDEX idx_ai_service_similar_similar ON ai_service_similar_services(similar_service_id);

CREATE INDEX idx_rankings_type_date ON rankings(ranking_type, ranking_date);
CREATE INDEX idx_rankings_entity ON rankings(entity_type, entity_id);

CREATE INDEX idx_curations_status ON curations(curation_status);
CREATE INDEX idx_curations_order ON curations(curation_order);

-- 기본 카테고리 데이터 삽입
INSERT INTO categories (category_name, category_description, parent_id, category_order) VALUES
-- 메인 카테고리
('텍스트 생성', 'AI를 활용한 텍스트 생성 도구들', NULL, 1),
('이미지 생성', 'AI를 활용한 이미지 생성 도구들', NULL, 2),
('비디오 생성', 'AI를 활용한 비디오 생성 도구들', NULL, 3),
('음성/오디오', 'AI를 활용한 음성 및 오디오 생성 도구들', NULL, 4),
('코딩/개발', 'AI를 활용한 코딩 및 개발 도구들', NULL, 5),
('비즈니스', 'AI를 활용한 비즈니스 도구들', NULL, 6),

-- 텍스트 생성 서브 카테고리
('챗봇/대화', '대화형 AI 서비스', 1, 1),
('글쓰기 도구', '글쓰기 및 편집 도구', 1, 2),
('번역', '언어 번역 서비스', 1, 3),

-- 이미지 생성 서브 카테고리
('아트/일러스트', '예술적 이미지 생성', 2, 1),
('사진 편집', '사진 편집 및 보정', 2, 2),
('로고/디자인', '로고 및 디자인 생성', 2, 3),

-- 비디오 생성 서브 카테고리
('애니메이션', 'AI 애니메이션 생성', 3, 1),
('영상 편집', 'AI 영상 편집 도구', 3, 2),

-- 음성/오디오 서브 카테고리
('음성 합성', 'AI 음성 생성', 4, 1),
('음악 생성', 'AI 음악 작곡', 4, 2),

-- 코딩/개발 서브 카테고리
('코드 생성', 'AI 코드 생성 도구', 5, 1),
('코드 리뷰', 'AI 코드 분석 및 리뷰', 5, 2),

-- 비즈니스 서브 카테고리
('마케팅', 'AI 마케팅 도구', 6, 1),
('데이터 분석', 'AI 데이터 분석 도구', 6, 2);

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

-- 기본 사이트 설정 데이터 삽입
INSERT INTO site_settings (site_title, company_name) VALUES ('StepAI', 'StepAI');