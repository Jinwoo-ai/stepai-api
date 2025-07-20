-- StepAI API Database Schema - AI 전문가 매칭 서비스
-- MySQL 8.0 이상 버전용

-- Users 테이블 (일반 사용자)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  user_type VARCHAR(20) NOT NULL DEFAULT 'client' COMMENT 'client, expert, admin',
  user_status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT 'active, inactive, pending, deleted',
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_status (user_status),
  INDEX idx_user_type (user_type),
  INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  group_status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT 'active, inactive, pending, deleted',
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_group_status (group_status),
  INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Services 테이블 (AI 서비스)
CREATE TABLE ai_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ai_name VARCHAR(100) NOT NULL,
  ai_description TEXT,
  ai_type VARCHAR(255) NOT NULL COMMENT 'LLM, RAG, gpts, prompter, etc.',
  ai_status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT 'active, inactive, pending, deleted',
  nationality VARCHAR(20),
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ai_status (ai_status),
  INDEX idx_ai_type (ai_type),
  INDEX idx_nationality (nationality),
  INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Content Categories 테이블 (콘텐츠 카테고리)
CREATE TABLE content_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL,
  category_icon VARCHAR(255),
  category_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category_name (category_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Content Tags 테이블 (콘텐츠 태그)
CREATE TABLE content_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tag_name VARCHAR(100) NOT NULL,
  tag_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tag_name (tag_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contents 테이블 (AI로 만든 결과물)
CREATE TABLE contents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content_title VARCHAR(200) NOT NULL,
  content_description TEXT,
  content_url VARCHAR(255),
  content_type VARCHAR(20) NOT NULL COMMENT 'link, logo, image, video, text, audio, pdf, etc.',
  content_order_index INT DEFAULT 0,
  content_status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT 'active, inactive, pending, deleted',
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_content_status (content_status),
  INDEX idx_content_type (content_type),
  INDEX idx_content_order (content_order_index),
  INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  expert_status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT 'active, inactive, pending, deleted',
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL,
  INDEX idx_expert_status (expert_status),
  INDEX idx_expert_location (expert_location),
  INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expert Contents 테이블 (전문가가 만든 콘텐츠)
CREATE TABLE expert_contents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expert_id INT NOT NULL,
  content_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (expert_id) REFERENCES experts(id) ON DELETE CASCADE,
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
  UNIQUE KEY unique_expert_content (expert_id, content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Content Category Relations 테이블 (콘텐츠-카테고리 관계)
CREATE TABLE content_category_relations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content_id INT NOT NULL,
  category_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES content_categories(id) ON DELETE CASCADE,
  UNIQUE KEY unique_content_category (content_id, category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Content Tag Relations 테이블 (콘텐츠-태그 관계)
CREATE TABLE content_tag_relations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content_id INT NOT NULL,
  tag_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES content_tags(id) ON DELETE CASCADE,
  UNIQUE KEY unique_content_tag (content_id, tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expert AI Services 테이블 (전문가가 사용하는 AI 서비스)
CREATE TABLE expert_ai_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expert_id INT NOT NULL,
  ai_service_id INT NOT NULL,
  usage_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (expert_id) REFERENCES experts(id) ON DELETE CASCADE,
  FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE,
  UNIQUE KEY unique_expert_ai_service (expert_id, ai_service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Content AI Services 테이블 (콘텐츠 제작에 사용된 AI 서비스)
CREATE TABLE content_ai_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content_id INT NOT NULL,
  ai_service_id INT NOT NULL,
  usage_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
  FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE,
  UNIQUE KEY unique_content_ai_service (content_id, ai_service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Matching Requests 테이블 (매칭 요청)
CREATE TABLE matching_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  expert_id INT NOT NULL,
  request_title VARCHAR(200) NOT NULL,
  request_description TEXT,
  request_status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT 'pending, accepted, rejected, completed',
  request_budget DECIMAL(10,2),
  request_deadline DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (expert_id) REFERENCES experts(id) ON DELETE CASCADE,
  INDEX idx_request_status (request_status),
  INDEX idx_request_deadline (request_deadline)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reviews 테이블 (리뷰)
CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  expert_id INT NOT NULL,
  content_id INT,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  review_status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT 'active, hidden, deleted',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (expert_id) REFERENCES experts(id) ON DELETE CASCADE,
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE SET NULL,
  INDEX idx_rating (rating),
  INDEX idx_review_status (review_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 샘플 데이터 삽입

-- Groups 샘플 데이터
INSERT INTO groups (group_name, group_description, group_status) VALUES
('AI 전문가 그룹 A', 'AI 솔루션 전문 그룹', 'active'),
('AI 전문가 그룹 B', 'AI 컨설팅 전문 그룹', 'active'),
('AI 전문가 그룹 C', 'AI 개발 전문 그룹', 'active');

-- AI Services 샘플 데이터
INSERT INTO ai_services (ai_name, ai_description, ai_type, nationality) VALUES
('ChatGPT', 'OpenAI의 대화형 AI 모델', 'LLM', 'USA'),
('Claude', 'Anthropic의 AI 어시스턴트', 'LLM', 'USA'),
('Midjourney', 'AI 이미지 생성 서비스', 'Image Generation', 'USA'),
('DALL-E', 'OpenAI의 AI 이미지 생성', 'Image Generation', 'USA'),
('Stable Diffusion', '오픈소스 AI 이미지 생성', 'Image Generation', 'Germany');

-- Content Categories 샘플 데이터
INSERT INTO content_categories (category_name, category_description) VALUES
('웹사이트', '웹사이트 관련 콘텐츠'),
('모바일 앱', '모바일 애플리케이션 관련 콘텐츠'),
('마케팅', '마케팅 관련 콘텐츠'),
('디자인', '디자인 관련 콘텐츠'),
('개발', '개발 관련 콘텐츠');

-- Content Tags 샘플 데이터
INSERT INTO content_tags (tag_name, tag_description) VALUES
('React', 'React 프레임워크'),
('Vue', 'Vue.js 프레임워크'),
('Node.js', 'Node.js 런타임'),
('Python', 'Python 프로그래밍 언어'),
('JavaScript', 'JavaScript 프로그래밍 언어'),
('UI/UX', '사용자 인터페이스/경험'),
('반응형', '반응형 디자인'),
('SEO', '검색엔진 최적화'),
('SNS', '소셜미디어'),
('브랜딩', '브랜드 디자인'); 