-- StepAI API Database Schema - AI 전문가 매칭 서비스
-- MySQL 8.0 이상 버전용

-- Users 테이블 (일반 사용자)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  user_type VARCHAR(20) DEFAULT 'client', -- client, expert, admin
  user_status VARCHAR(20) DEFAULT 'active', -- active, inactive, pending, deleted
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Groups 테이블 (전문가 그룹)
CREATE TABLE groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_name VARCHAR(100) NOT NULL,
  group_description TEXT,
  group_logo VARCHAR(255),
  group_website VARCHAR(255),
  group_email VARCHAR(100),
  group_phone VARCHAR(20),
  group_address VARCHAR(255),
  group_status VARCHAR(20) DEFAULT 'active', -- active, inactive, pending, deleted
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Experts 테이블 (AI 전문가)
CREATE TABLE experts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  group_id INT,
  expert_name VARCHAR(100) NOT NULL,
  expert_title VARCHAR(100),
  expert_bio TEXT,
  expert_avatar VARCHAR(255),
  expert_website VARCHAR(255),
  expert_email VARCHAR(100),
  expert_phone VARCHAR(20),
  expert_location VARCHAR(255),
  expert_status VARCHAR(20) DEFAULT 'active', -- active, inactive, pending, deleted
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (group_id) REFERENCES groups(id)
);

-- AI Services 테이블 (AI 서비스)
CREATE TABLE ai_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ai_name VARCHAR(100) NOT NULL,
  ai_description TEXT,
  ai_type VARCHAR(255) NOT NULL, -- LLM, RAG, gpts, prompter, etc.
  ai_status VARCHAR(20) DEFAULT 'active', -- active, inactive, pending, deleted
  nationality VARCHAR(20),
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Content Categories 테이블 (콘텐츠 카테고리)
CREATE TABLE content_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL,
  category_icon VARCHAR(255),
  category_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Content Tags 테이블 (콘텐츠 태그)
CREATE TABLE content_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tag_name VARCHAR(100) NOT NULL,
  tag_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Contents 테이블 (AI로 만든 결과물)
CREATE TABLE contents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content_title VARCHAR(200) NOT NULL,
  content_description TEXT,
  content_url VARCHAR(255),
  content_type VARCHAR(20) NOT NULL, -- link, logo, image, video, text, audio, pdf, etc.
  content_order_index INT DEFAULT 0,
  content_status VARCHAR(20) DEFAULT 'active', -- active, inactive, pending, deleted
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Expert Contents 테이블 (전문가가 만든 콘텐츠)
CREATE TABLE expert_contents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expert_id INT NOT NULL,
  content_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (expert_id) REFERENCES experts(id),
  FOREIGN KEY (content_id) REFERENCES contents(id),
  UNIQUE KEY unique_expert_content (expert_id, content_id)
);

-- Content Category Relations 테이블 (콘텐츠-카테고리 관계)
CREATE TABLE content_category_relations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content_id INT NOT NULL,
  category_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (content_id) REFERENCES contents(id),
  FOREIGN KEY (category_id) REFERENCES content_categories(id),
  UNIQUE KEY unique_content_category (content_id, category_id)
);

-- Content Tag Relations 테이블 (콘텐츠-태그 관계)
CREATE TABLE content_tag_relations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content_id INT NOT NULL,
  tag_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (content_id) REFERENCES contents(id),
  FOREIGN KEY (tag_id) REFERENCES content_tags(id),
  UNIQUE KEY unique_content_tag (content_id, tag_id)
);

-- Expert AI Services 테이블 (전문가가 사용하는 AI 서비스)
CREATE TABLE expert_ai_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expert_id INT NOT NULL,
  ai_service_id INT NOT NULL,
  usage_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (expert_id) REFERENCES experts(id),
  FOREIGN KEY (ai_service_id) REFERENCES ai_services(id),
  UNIQUE KEY unique_expert_ai_service (expert_id, ai_service_id)
);

-- Content AI Services 테이블 (콘텐츠 제작에 사용된 AI 서비스)
CREATE TABLE content_ai_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content_id INT NOT NULL,
  ai_service_id INT NOT NULL,
  usage_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (content_id) REFERENCES contents(id),
  FOREIGN KEY (ai_service_id) REFERENCES ai_services(id),
  UNIQUE KEY unique_content_ai_service (content_id, ai_service_id)
);

-- Matching Requests 테이블 (매칭 요청)
CREATE TABLE matching_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  expert_id INT NOT NULL,
  request_title VARCHAR(200) NOT NULL,
  request_description TEXT,
  request_status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected, completed
  request_budget DECIMAL(10,2),
  request_deadline DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES users(id),
  FOREIGN KEY (expert_id) REFERENCES experts(id)
);

-- Reviews 테이블 (리뷰)
CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  expert_id INT NOT NULL,
  content_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  review_status VARCHAR(20) DEFAULT 'active', -- active, hidden, deleted
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES users(id),
  FOREIGN KEY (expert_id) REFERENCES experts(id),
  FOREIGN KEY (content_id) REFERENCES contents(id)
);

-- Content Views 테이블 (콘텐츠 조회 기록)
CREATE TABLE content_views (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content_id INT NOT NULL,
  user_id INT,
  view_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (content_id) REFERENCES contents(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Ranking Weights 테이블 (랭킹 가중치 설정)
CREATE TABLE ranking_weights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ranking_type VARCHAR(50) NOT NULL, -- ai_service, content, expert, category
  weight_name VARCHAR(100) NOT NULL,
  weight_value DECIMAL(5,3) NOT NULL,
  weight_description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_ranking_weight (ranking_type, weight_name)
);

-- Rankings 테이블 (랭킹 결과 저장)
CREATE TABLE rankings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ranking_type VARCHAR(50) NOT NULL, -- ai_service, content, expert, category
  entity_id INT NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- ai_service_id, content_id, expert_id, category_id
  total_score DECIMAL(10,3) NOT NULL,
  view_count INT DEFAULT 0,
  request_count INT DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0.00,
  ranking_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_ranking (ranking_type, entity_id, ranking_date)
);

-- 기본 랭킹 가중치 데이터 삽입
INSERT INTO ranking_weights (ranking_type, weight_name, weight_value, weight_description) VALUES
-- AI 서비스 랭킹 가중치
('ai_service', 'view_weight', 0.300, '조회수 가중치'),
('ai_service', 'request_weight', 0.400, '매칭 요청수 가중치'),
('ai_service', 'rating_weight', 0.300, '평점 가중치'),

-- 콘텐츠 랭킹 가중치
('content', 'view_weight', 0.500, '조회수 가중치'),
('content', 'rating_weight', 0.500, '평점 가중치'),

-- 전문가 랭킹 가중치
('expert', 'content_count_weight', 0.250, '콘텐츠 수 가중치'),
('expert', 'request_weight', 0.350, '매칭 요청수 가중치'),
('expert', 'rating_weight', 0.400, '평점 가중치'),

-- 카테고리 랭킹 가중치
('category', 'content_count_weight', 0.400, '콘텐츠 수 가중치'),
('category', 'view_weight', 0.300, '조회수 가중치'),
('category', 'rating_weight', 0.300, '평점 가중치'); 