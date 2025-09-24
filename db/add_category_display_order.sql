-- 카테고리별 AI 서비스 표시 순서 관리 테이블 추가

-- AI Service Category Display Order 테이블 (카테고리별 AI 서비스 표시 순서)
CREATE TABLE ai_service_category_display_order (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  ai_service_id INT NOT NULL,
  display_order INT NOT NULL DEFAULT 0, -- 표시 순서 (낮을수록 상단)
  is_featured BOOLEAN DEFAULT FALSE, -- 상단 고정 여부
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE,
  UNIQUE KEY unique_category_service_order (category_id, ai_service_id),
  INDEX idx_category_display_order (category_id, display_order),
  INDEX idx_category_featured (category_id, is_featured, display_order)
);

-- 기존 ai_service_categories 테이블에서 데이터 마이그레이션
INSERT INTO ai_service_category_display_order (category_id, ai_service_id, display_order)
SELECT 
  category_id, 
  ai_service_id, 
  ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY created_at) as display_order
FROM ai_service_categories
WHERE category_id IS NOT NULL AND ai_service_id IS NOT NULL;