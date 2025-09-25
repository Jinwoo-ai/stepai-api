# StepAI API - 데이터베이스 스키마 가이드

## 📊 데이터베이스 개요

StepAI API는 AI 서비스 소개 및 이용방법 추천 서비스를 위한 관계형 데이터베이스를 사용합니다. MySQL 8.0 이상 버전을 지원하며, SNS 로그인 기반 회원 시스템과 AI 서비스 관리 시스템을 제공합니다.

## 🏗️ 전체 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Users       │    │   AI Services   │    │   AI Videos     │
│   (회원 관리)    │    │  (AI 서비스)     │    │   (AI 영상)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
    ┌────┴────┐                  │                       │
    │         │                  │                       │
┌───▼───┐ ┌──▼──┐               │                       │
│User   │ │Access│               │                       │
│SNS    │ │Token│               │                       │
└───────┘ └─────┘               │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Categories    │    │   Curations     │    │ Ad Partnerships │
│ (계층적 카테고리) │    │   (큐레이션)     │    │   (광고제휴)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 👥 사용자 관리 테이블

### Users (회원)
SNS 로그인 기반 회원 정보를 관리합니다.

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL COMMENT '이름',
  email VARCHAR(100) UNIQUE NOT NULL COMMENT '이메일',
  industry VARCHAR(50) COMMENT '업종',
  job_role VARCHAR(50) COMMENT '직무',
  job_level VARCHAR(30) COMMENT '직급',
  experience_years INT COMMENT '연차',
  user_type VARCHAR(20) DEFAULT 'member' COMMENT '사용자 타입', -- member, admin
  user_status VARCHAR(20) DEFAULT 'active' COMMENT '사용자 상태', -- active, inactive, pending, deleted
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**주요 특징:**
- 이메일 중복 방지 (UNIQUE 제약조건)
- 업종, 직무, 직급, 연차 정보 관리
- 소프트 삭제 지원 (`deleted_at`)
- 관리자/일반회원 구분 (`user_type`)

### User SNS (SNS 로그인 정보)
네이버, 카카오, 구글 SNS 로그인 정보를 관리합니다.

```sql
CREATE TABLE user_sns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  sns_type VARCHAR(20) NOT NULL COMMENT 'SNS 종류', -- naver, kakao, google
  sns_user_id VARCHAR(100) NOT NULL COMMENT 'SNS 사용자 ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_sns_user (sns_type, sns_user_id)
);
```

**주요 특징:**
- SNS 타입별 고유 사용자 ID 관리
- 동일 SNS 계정 중복 가입 방지
- 사용자 삭제 시 연관 데이터 자동 삭제

### Access Tokens (액세스 토큰)
사용자 인증을 위한 액세스 토큰을 관리합니다.

```sql
CREATE TABLE access_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE COMMENT '액세스 토큰',
  expires_at TIMESTAMP NOT NULL COMMENT '만료일시',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**주요 특징:**
- 30일 만료 토큰 시스템
- 토큰 중복 방지
- 만료된 토큰 자동 정리 가능

## 🤖 AI 서비스 및 영상 테이블

### AI Services (AI 서비스)
AI 서비스 정보를 관리합니다.

```sql
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
```

### AI Videos (AI 영상)
AI 관련 영상 콘텐츠를 관리합니다.

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

### Categories (카테고리)
계층적 카테고리 구조를 지원합니다.

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
AI 서비스 큐레이션을 관리합니다.

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

## 📊 조회 및 통계 테이블

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

### Rankings (랭킹)
```sql
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
```

## 🏢 비즈니스 관리 테이블

### Ad Partnerships (광고제휴)
광고제휴 문의를 관리합니다.

```sql
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Site Settings (사이트 설정)
```sql
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
```

## 🏷️ 태그 및 분류 테이블

### Tags (태그)
```sql
CREATE TABLE tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tag_name VARCHAR(50) UNIQUE NOT NULL,
  tag_count INT DEFAULT 0, -- 사용 횟수
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### AI Service Tags (AI 서비스-태그 관계)
```sql
CREATE TABLE ai_service_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ai_service_id INT NOT NULL,
  tag_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE KEY unique_ai_service_tag (ai_service_id, tag_id)
);
```

### AI Video Tags (AI 영상-태그 관계)
```sql
CREATE TABLE ai_video_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ai_video_id INT NOT NULL,
  tag_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ai_video_id) REFERENCES ai_videos(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE KEY unique_ai_video_tag (ai_video_id, tag_id)
);
```

## 🔧 확장 테이블

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

## 📈 인덱스 전략

### 주요 인덱스
- **Users**: `idx_email`, `idx_type_status`, `idx_industry`, `idx_job_role`
- **User SNS**: `idx_user_id`, `idx_sns_type`, `unique_sns_user`
- **Access Tokens**: `idx_token`, `idx_user_id`, `idx_expires_at`
- **AI Services**: 기본 검색 및 필터링을 위한 복합 인덱스
- **Categories**: 계층 구조 조회를 위한 `parent_id` 인덱스
- **Ad Partnerships**: `idx_partnership_type`, `idx_inquiry_status`, `idx_created_at`

### 성능 최적화
- 자주 조회되는 컬럼에 인덱스 적용
- 외래키 제약조건 자동 인덱스 활용
- 복합 인덱스를 통한 다중 조건 검색 최적화

## 🔒 보안 및 제약조건

### 데이터 무결성
- 외래키 제약조건으로 참조 무결성 보장
- UNIQUE 제약조건으로 중복 데이터 방지
- CHECK 제약조건으로 데이터 유효성 검증

### 소프트 삭제
- `deleted_at` 컬럼을 통한 소프트 삭제 구현
- 데이터 복구 가능성 보장
- 관련 데이터 일관성 유지

### 인증 및 권한
- SNS 로그인 기반 인증 시스템
- 액세스 토큰 기반 API 인증
- 관리자/일반회원 권한 구분

## 📝 마이그레이션 가이드

### 초기 설정
1. MySQL 8.0 이상 설치
2. `create_tables.sql` 실행
3. 기본 데이터 삽입 (카테고리, 관리자 계정 등)

### 데이터 마이그레이션
- 기존 users 테이블에서 SNS 로그인 기반으로 마이그레이션 완료
- Foreign key 참조 관계 정리 완료
- 테스트 데이터 삽입 완료

이 스키마는 StepAI 서비스의 모든 핵심 기능을 지원하며, 확장 가능한 구조로 설계되었습니다.