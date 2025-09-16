-- AI 서비스 속성 테이블 분리 마이그레이션

-- AI 타입 테이블
CREATE TABLE ai_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type_name VARCHAR(50) UNIQUE NOT NULL,
  type_description VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI 서비스-타입 관계 테이블
CREATE TABLE ai_service_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ai_service_id INT NOT NULL,
  ai_type_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE,
  FOREIGN KEY (ai_type_id) REFERENCES ai_types(id) ON DELETE CASCADE,
  UNIQUE KEY unique_ai_service_type (ai_service_id, ai_type_id)
);

-- 가격 모델 테이블
CREATE TABLE pricing_models (
  id INT AUTO_INCREMENT PRIMARY KEY,
  model_name VARCHAR(50) UNIQUE NOT NULL,
  model_description VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI 서비스-가격모델 관계 테이블
CREATE TABLE ai_service_pricing_models (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ai_service_id INT NOT NULL,
  pricing_model_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE,
  FOREIGN KEY (pricing_model_id) REFERENCES pricing_models(id) ON DELETE CASCADE,
  UNIQUE KEY unique_ai_service_pricing (ai_service_id, pricing_model_id)
);

-- 타겟 타입 테이블
CREATE TABLE target_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type_code VARCHAR(10) UNIQUE NOT NULL,
  type_name VARCHAR(50) NOT NULL,
  type_description VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI 서비스-타겟타입 관계 테이블
CREATE TABLE ai_service_target_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ai_service_id INT NOT NULL,
  target_type_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE,
  FOREIGN KEY (target_type_id) REFERENCES target_types(id) ON DELETE CASCADE,
  UNIQUE KEY unique_ai_service_target (ai_service_id, target_type_id)
);

-- 기본 데이터 삽입
INSERT INTO ai_types (type_name, type_description) VALUES
('WEB', '웹 기반 서비스'),
('MOB', '모바일 앱'),
('API', 'API 서비스'),
('APP', '데스크톱 애플리케이션'),
('PLUGIN', '플러그인/확장프로그램');

INSERT INTO pricing_models (model_name, model_description) VALUES
('무료', '완전 무료 서비스'),
('유료', '유료 서비스'),
('프리미엄', '기본 무료 + 프리미엄 유료'),
('구독', '월/연 구독 서비스');

INSERT INTO target_types (type_code, type_name, type_description) VALUES
('B', 'B2B', '기업 대상 서비스'),
('C', 'B2C', '개인 소비자 대상 서비스'),
('G', 'B2G', '정부/공공기관 대상 서비스'),
('BC', 'B2B2C', '기업과 개인 모두 대상');

-- 기존 데이터 마이그레이션
-- AI 타입 마이그레이션
INSERT INTO ai_service_types (ai_service_id, ai_type_id)
SELECT DISTINCT 
  s.id,
  t.id
FROM ai_services s
CROSS JOIN ai_types t
WHERE s.ai_type IS NOT NULL 
  AND s.ai_type != ''
  AND FIND_IN_SET(t.type_name, REPLACE(s.ai_type, ' ', '')) > 0;

-- 가격 모델 마이그레이션
INSERT INTO ai_service_pricing_models (ai_service_id, pricing_model_id)
SELECT DISTINCT 
  s.id,
  p.id
FROM ai_services s
INNER JOIN pricing_models p ON s.pricing_model = p.model_name
WHERE s.pricing_model IS NOT NULL AND s.pricing_model != '';

-- 타겟 타입 마이그레이션
INSERT INTO ai_service_target_types (ai_service_id, target_type_id)
SELECT DISTINCT 
  s.id,
  t.id
FROM ai_services s
INNER JOIN target_types t ON s.target_type = t.type_code
WHERE s.target_type IS NOT NULL AND s.target_type != '';