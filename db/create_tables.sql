-- StepAI API Database Schema
-- 테이블 생성 쿼리

-- Users 테이블 생성
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    user_status VARCHAR(20) DEFAULT 'active',
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Company 테이블 생성
CREATE TABLE company (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL UNIQUE,
    company_registration_number VARCHAR(20) NOT NULL UNIQUE,
    company_description TEXT,
    company_logo VARCHAR(255),
    company_website VARCHAR(255),
    company_email VARCHAR(100) NOT NULL UNIQUE,
    company_phone VARCHAR(20),
    company_address VARCHAR(255),
    company_status VARCHAR(20) DEFAULT 'active',
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User Company 테이블 생성
CREATE TABLE user_company (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    company_id INT NOT NULL,
    role VARCHAR(20) NOT NULL, -- ceo, manager, employee
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE
);

-- AI Services 테이블 생성
CREATE TABLE ai_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ai_name VARCHAR(100) NOT NULL,
    ai_description TEXT,
    ai_type VARCHAR(255) NOT NULL, -- LLM, RAG, gpts, prompter, etc.
    ai_status VARCHAR(20) DEFAULT 'active',
    nationality VARCHAR(20),
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Company AI Services 테이블 생성
CREATE TABLE company_ai_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    ai_service_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE
);

-- AI Service Contents 테이블 생성
CREATE TABLE ai_service_contents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ai_service_id INT NOT NULL,
    content_title VARCHAR(200) NOT NULL,
    content_url VARCHAR(255),
    content_type VARCHAR(20) NOT NULL, -- link, logo, image, video, text, audio, pdf, etc.
    content_description TEXT,
    content_order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE
);

-- AI Service Tags 테이블 생성
CREATE TABLE ai_service_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ai_service_id INT NOT NULL,
    tag_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE
);

-- AI Categories 테이블 생성
CREATE TABLE ai_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    category_icon VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- AI Service Categories 테이블 생성
CREATE TABLE ai_service_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ai_service_id INT NOT NULL,
    category_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES ai_categories(id) ON DELETE CASCADE
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(user_status);
CREATE INDEX idx_company_name ON company(company_name);
CREATE INDEX idx_company_status ON company(company_status);
CREATE INDEX idx_user_company_user_id ON user_company(user_id);
CREATE INDEX idx_user_company_company_id ON user_company(company_id);
CREATE INDEX idx_company_ai_services_company_id ON company_ai_services(company_id);
CREATE INDEX idx_company_ai_services_ai_service_id ON company_ai_services(ai_service_id);
CREATE INDEX idx_ai_services_status ON ai_services(ai_status);
CREATE INDEX idx_ai_services_type ON ai_services(ai_type);
CREATE INDEX idx_ai_service_contents_service_id ON ai_service_contents(ai_service_id);
CREATE INDEX idx_ai_service_contents_order ON ai_service_contents(content_order_index);
CREATE INDEX idx_ai_service_tags_service_id ON ai_service_tags(ai_service_id);
CREATE INDEX idx_ai_service_tags_name ON ai_service_tags(tag_name);
CREATE INDEX idx_ai_categories_name ON ai_categories(category_name);
CREATE INDEX idx_ai_service_categories_service_id ON ai_service_categories(ai_service_id);
CREATE INDEX idx_ai_service_categories_category_id ON ai_service_categories(category_id); 