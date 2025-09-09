# StepAI API - 데이터베이스 스키마 가이드

## 📊 데이터베이스 개요

StepAI API는 AI 서비스 소개 및 이용방법 추천 서비스를 위한 관계형 데이터베이스를 사용합니다. 이 문서는 데이터베이스 구조와 엔티티 간의 관계를 설명합니다.

## 🏗️ 전체 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Users       │    │   AI Services   │    │   AI Videos     │
│   (회원 관리)    │    │  (AI 서비스)     │    │   (AI 영상)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Categories    │    │   Curations     │    │   User Favorites │
│ (계층적 카테고리) │    │   (큐레이션)     │    │   (사용자 즐겨찾기)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Reviews      │    │   View Records  │    │    Rankings     │
│   (리뷰 시스템)   │    │   (조회 기록)    │    │   (랭킹 시스템)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 👥 사용자 관리 테이블

### Users (회원)
```sql
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
```

**주요 특징:**
- 소프트 삭제 지원 (`deleted_at`)
- 단순화된 사용자 타입 (member, admin)
- 이메일 중복 방지

## 🤖 AI 서비스 및 영상 테이블

### AI Services (AI 서비스)
```sql
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
```

### AI Videos (AI 영상)
```sql
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
```

### Categories (카테고리 - 메인/서브 구조)
```sql
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
```

### Curations (큐레이션)
```sql
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
```

## 🔗 관계 테이블 (Many-to-Many)

### AI Service Categories (AI 서비스-카테고리 관계)
```sql
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
```

### AI Video Categories (AI 영상-카테고리 관계)
```sql
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
```

### AI Video Services (AI 영상에서 사용된 AI 서비스)
```sql
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
```

### Curation AI Services (큐레이션에 포함된 AI 서비스)
```sql
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
```

## 👤 사용자 기능 테이블

### User Favorites (사용자 즐겨찾기)
```sql
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
```

### Reviews (리뷰)
```sql
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
```

## 📊 조회 기록 및 랭킹 시스템

### AI Service Views (AI 서비스 조회 기록)
```sql
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
```

### AI Video Views (AI 영상 조회 기록)
```sql
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
```

### Rankings (랭킹 결과 저장)
```sql
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
```## 🔧 AI 서비스 확장 테이블

### AI Service Contents (AI 서비스 콘텐츠)
```sql
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
```

### AI Service SNS (AI 서비스 SNS)
```sql
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
```

### AI Service Similar Services (유사 서비스)
```sql
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
```

## 📈 주요 인덱스

```sql
-- 사용자 관련 인덱스
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type_status ON users(user_type, user_status);

-- AI 서비스 관련 인덱스
CREATE INDEX idx_ai_services_type ON ai_services(ai_type);
CREATE INDEX idx_ai_services_status ON ai_services(ai_status);
CREATE INDEX idx_ai_services_nationality ON ai_services(nationality);
CREATE INDEX idx_ai_services_step_pick ON ai_services(is_step_pick);

-- AI 영상 관련 인덱스
CREATE INDEX idx_ai_videos_status ON ai_videos(video_status);
CREATE INDEX idx_ai_videos_view_count ON ai_videos(view_count);

-- 카테고리 관련 인덱스
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_status ON categories(category_status);
CREATE INDEX idx_categories_order ON categories(category_order);

-- 조회 기록 관련 인덱스
CREATE INDEX idx_ai_service_views_service ON ai_service_views(ai_service_id);
CREATE INDEX idx_ai_service_views_date ON ai_service_views(view_date);
CREATE INDEX idx_ai_video_views_video ON ai_video_views(ai_video_id);
CREATE INDEX idx_ai_video_views_date ON ai_video_views(view_date);

-- 랭킹 관련 인덱스
CREATE INDEX idx_rankings_type_date ON rankings(ranking_type, ranking_date);
CREATE INDEX idx_rankings_entity ON rankings(entity_type, entity_id);
```

## 🎯 주요 특징

### 1. 계층적 카테고리 구조
- 메인 카테고리와 서브 카테고리로 구성
- `parent_id`를 통한 자기 참조 관계
- 드래그 앤 드롭을 위한 `category_order` 필드

### 2. 소프트 삭제 지원
- `deleted_at` 필드를 통한 논리적 삭제
- 데이터 복구 가능
- 관련 데이터 무결성 유지

### 3. 가격 정보 관리
- `pricing_model`: 무료, 프리미엄, 유료, 구독 모델
- `pricing_info`: 상세 가격 정보
- `difficulty_level`: 사용 난이도

### 4. 조회 기록 및 랭킹
- 실시간 조회 기록 저장
- 다양한 지표를 통한 랭킹 계산
- 날짜별 랭킹 히스토리 관리

### 5. 확장 가능한 구조
- AI 서비스별 상세 콘텐츠 관리
- SNS 링크 관리
- 유사 서비스 추천 시스템
```

### Ranking Weights (랭킹 가중치 설정)
```sql
CREATE TABLE ranking_weights (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ranking_type VARCHAR(50) NOT NULL, -- ai_service, content, expert, category
  weight_name VARCHAR(100) NOT NULL,
  weight_value DECIMAL(5,3) NOT NULL,
  weight_description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_ranking_weight (ranking_type, weight_name)
);
```

### Rankings (랭킹 결과 저장)
```sql
CREATE TABLE rankings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ranking_type VARCHAR(50) NOT NULL,
  entity_id INT NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- ai_service_id, content_id, expert_id, category_id
  total_score DECIMAL(10,3) NOT NULL,
  view_count INT DEFAULT 0,
  request_count INT DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  ranking_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_ranking_entity_date (ranking_type, entity_id, ranking_date)
);
```

## 🔍 인덱스 전략

### 성능 최적화를 위한 주요 인덱스

```sql
-- 사용자 관련 인덱스
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type_status ON users(user_type, user_status);

-- 전문가 관련 인덱스
CREATE INDEX idx_experts_user_id ON experts(user_id);
CREATE INDEX idx_experts_group_id ON experts(group_id);
CREATE INDEX idx_experts_status ON experts(expert_status);
CREATE INDEX idx_experts_location ON experts(expert_location);

-- AI 서비스 관련 인덱스
CREATE INDEX idx_ai_services_type ON ai_services(ai_type);
CREATE INDEX idx_ai_services_status ON ai_services(ai_status);
CREATE INDEX idx_ai_services_nationality ON ai_services(nationality);

-- 콘텐츠 관련 인덱스
CREATE INDEX idx_contents_type ON contents(content_type);
CREATE INDEX idx_contents_status ON contents(content_status);
CREATE INDEX idx_contents_order ON contents(content_order_index);

-- 관계 테이블 인덱스
CREATE INDEX idx_expert_contents_expert ON expert_contents(expert_id);
CREATE INDEX idx_expert_contents_content ON expert_contents(content_id);

-- 랭킹 관련 인덱스
CREATE INDEX idx_rankings_type_date ON rankings(ranking_type, ranking_date);
CREATE INDEX idx_rankings_entity ON rankings(entity_type, entity_id);
CREATE INDEX idx_content_views_content ON content_views(content_id);
CREATE INDEX idx_content_views_date ON content_views(view_date);
```

## 📈 데이터 관계도

### 핵심 엔티티 관계
```
Users (1) ──────── (1) Experts
  │                    │
  │                    │ (M)
  │                    │
  │ (1)                └── (M) Expert_Contents (M) ──── (1) Contents
  │                                                          │
  │ (1)                                                      │ (M)
  │                                                          │
  └── (M) Matching_Requests (M) ──── (1) Experts            └── (M) Content_Category_Relations (M) ──── (1) Content_Categories
                                                             │
                                                             └── (M) Content_Tag_Relations (M) ──── (1) Content_Tags
```

### 랭킹 시스템 관계
```
Contents ──── (1:M) ──── Content_Views
    │                        │
    │                        │
    └── Rankings ←──────────── (집계)
         │
         └── Ranking_Weights (설정)
```

## 🛠️ 데이터베이스 설정

### 환경별 데이터베이스
- **개발**: `stepai_dev`
- **스테이징**: `stepai_staging`
- **프로덕션**: `stepai_prod`

### 연결 설정
```typescript
// src/configs/database.ts
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'stepai_dev',
  charset: 'utf8mb4',
  timezone: '+00:00'
};
```

## 🔒 보안 고려사항

### 1. 데이터 보호
- 비밀번호는 bcrypt로 해시화
- 개인정보는 암호화 저장
- 소프트 삭제로 데이터 복구 가능

### 2. 접근 제어
- 사용자 타입별 권한 관리
- API 레벨에서 데이터 접근 제한
- 관리자 전용 기능 분리

### 3. 데이터 무결성
- 외래 키 제약 조건
- 중복 데이터 방지 (UNIQUE 제약)
- 데이터 검증 규칙

## 📊 성능 모니터링

### 주요 모니터링 지표
1. **쿼리 성능**: 느린 쿼리 로그 분석
2. **인덱스 사용률**: EXPLAIN 명령어로 확인
3. **테이블 크기**: 정기적인 용량 모니터링
4. **연결 수**: 동시 접속자 수 관리

### 최적화 전략
1. **파티셔닝**: 대용량 테이블 분할
2. **캐싱**: 자주 조회되는 데이터 캐시
3. **읽기 전용 복제본**: 조회 성능 향상
4. **정기적인 통계 업데이트**: 쿼리 최적화

---

이 문서는 StepAI API의 데이터베이스 스키마 v1.0.0을 기준으로 작성되었습니다.