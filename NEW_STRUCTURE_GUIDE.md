# StepAI API - 구조 가이드

## 📋 개요

StepAI API는 **'AI 서비스 소개 및 이용방법 추천 서비스'**를 위한 RESTful API입니다. 현재 구현된 기능과 향후 확장 계획을 설명합니다.

## 🏗️ 현재 구현된 기능

### 핵심 엔티티

| 엔티티 | 상태 | 설명 |
|--------|------|------|
| AI Services | ✅ 구현완료 | AI 서비스 정보 관리 |
| AI Videos | ✅ 구현완료 | AI 영상 콘텐츠 관리 |
| Categories | ✅ 구현완료 | 계층적 카테고리 구조 (드래그앤드롭 지원) |
| Dashboard | ✅ 구현완료 | 통계 및 현황 조회 |
| Users | 🔄 부분구현 | 기본 사용자 테이블만 존재 |
| Curations | ⏳ 미구현 | 주제별 AI 서비스 큐레이션 |

## 🏗️ 데이터 구조

### 핵심 엔티티

#### 1. Users (회원) - 부분 구현
```typescript
interface User {
  id: number;
  username: string;
  email: string;
  user_type: 'member' | 'admin';
  user_status: 'active' | 'inactive' | 'pending' | 'deleted';
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}
```

#### 2. AI Services (AI 서비스) - 완전 구현
```typescript
interface AIService {
  id: number;
  ai_name: string;
  ai_description?: string;
  ai_type: string; // LLM, RAG, GPTs, Image_Generation, etc.
  ai_website?: string;
  ai_logo?: string;
  pricing_model?: 'free' | 'freemium' | 'paid' | 'subscription';
  pricing_info?: string;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  ai_status: 'active' | 'inactive' | 'pending' | 'deleted';
  is_visible: boolean;
  is_step_pick: boolean;
  nationality?: string;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}
```

#### 3. AI Videos (AI 영상) - 완전 구현
```typescript
interface AIVideo {
  id: number;
  video_title: string;
  video_description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration: number; // 초 단위
  video_status: 'active' | 'inactive' | 'pending' | 'deleted';
  is_visible: boolean;
  view_count: number;
  like_count: number;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}
```

#### 4. Categories (카테고리) - 완전 구현
```typescript
interface Category {
  id: number;
  category_name: string;
  category_description?: string;
  category_icon?: string;
  parent_id?: number; // NULL이면 메인 카테고리
  category_order: number;
  category_status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  children?: Category[]; // 하위 카테고리 (API 응답시)
}
```

#### 5. Curations (큐레이션) - 미구현
```typescript
interface Curation {
  id: number;
  curation_title: string;
  curation_description?: string;
  curation_thumbnail?: string;
  curation_order: number;
  curation_status: 'active' | 'inactive' | 'pending' | 'deleted';
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}
```

### 관계 구조 (현재 구현 상태)

```
✅ AI Services (AI 서비스)
├── ✅ AI Service Categories (카테고리 관계)
├── ✅ AI Video Services (영상에서 사용된 서비스)
├── ✅ AI Service Contents (서비스 콘텐츠)
├── ✅ AI Service SNS (SNS 링크)
├── ✅ AI Service Similar Services (유사 서비스)
└── 🔄 AI Service Views (조회 기록) - 테이블만 존재

✅ AI Videos (AI 영상)
├── ✅ AI Video Categories (카테고리 관계)
├── ✅ AI Video Services (사용된 AI 서비스)
└── 🔄 AI Video Views (조회 기록) - 테이블만 존재

✅ Categories (카테고리)
├── ✅ AI Service Categories (AI 서비스 관계)
├── ✅ AI Video Categories (AI 영상 관계)
├── ✅ Categories (자기 참조 - 부모/자식)
└── ✅ 드래그앤드롭 순서 변경 지원

🔄 Users (회원) - 기본 테이블만
├── ⏳ User Favorites (즐겨찾기)
└── ⏳ Reviews (리뷰)

⏳ Curations (큐레이션) - 미구현
└── ⏳ Curation AI Services (포함된 AI 서비스)
```

## 🎯 구현된 주요 기능

### 1. 계층적 카테고리 시스템 ✅
- **메인 카테고리**: 텍스트 생성, 이미지 생성, 비디오 생성 등
- **서브 카테고리**: 챗봇/대화, 아트/일러스트, 애니메이션 등
- **드래그앤드롭**: 카테고리 순서 변경 지원 (같은 부모 내, 다른 부모로 이동)

```typescript
// 카테고리 순서 변경 API
PUT /api/categories/:id/reorder
{
  "new_order": 3,
  "parent_id": 1  // 다른 부모로 이동시
}
```

### 2. AI 서비스 관리 ✅
- **완전한 CRUD**: 생성, 조회, 수정, 삭제 (소프트 삭제)
- **카테고리 연결**: 메인/서브 카테고리 다중 연결
- **콘텐츠 관리**: 서비스별 상세 콘텐츠 (target_users, main_features, use_cases)
- **SNS 링크**: 다양한 SNS 플랫폼 링크 관리
- **유사 서비스**: 관련 서비스 추천
- **가격 정보**: 무료/프리미엄/유료/구독 모델
- **Step Pick**: 추천 서비스 마킹

```typescript
// AI 서비스 생성 예시
POST /api/ai-services
{
  "ai_name": "ChatGPT",
  "ai_type": "LLM",
  "pricing_model": "freemium",
  "is_step_pick": true,
  "categories": [{ "id": 1, "is_main_category": true }],
  "contents": [{
    "content_type": "main_features",
    "content_text": "자연어 대화, 코드 생성, 번역"
  }]
}
```

### 3. AI 영상 관리 ✅
- **완전한 CRUD**: 생성, 조회, 수정, 삭제 (소프트 삭제)
- **카테고리 연결**: 영상별 카테고리 분류
- **AI 서비스 연결**: 영상에서 사용된 AI 서비스 목록 및 순서
- **메타데이터**: 제목, 설명, URL, 썸네일, 재생시간
- **조회 통계**: 조회수, 좋아요 수

```typescript
// AI 영상 생성 예시
POST /api/ai-videos
{
  "video_title": "ChatGPT로 블로그 글쓰기",
  "video_url": "https://youtube.com/watch?v=...",
  "duration": 600,
  "categories": [{ "id": 1 }],
  "ai_services": [
    { "id": 1 }, // ChatGPT
    { "id": 2 }  // Grammarly
  ]
}
```

### 4. 대시보드 통계 ✅
- **실시간 통계**: 사용자, AI 서비스, 영상, 카테고리 수
- **Step Pick 통계**: 추천 서비스 수
- **상태별 통계**: 활성 서비스 수

```typescript
// 대시보드 통계 조회
GET /api/dashboard/stats
{
  "totalUsers": 150,
  "totalAIServices": 45,
  "totalVideos": 23,
  "totalCategories": 12,
  "stepPickServices": 8,
  "activeServices": 42
}
```

### 5. 검색 및 필터링 ✅
- **텍스트 검색**: AI 서비스명, 설명 검색
- **카테고리 필터**: 특정 카테고리의 서비스/영상만 조회
- **상태 필터**: 활성/비활성 상태별 필터링
- **Step Pick 필터**: 추천 서비스만 조회
- **페이지네이션**: 대용량 데이터 처리

```typescript
// 검색 및 필터링 예시
GET /api/ai-services?search=chatgpt&category_id=1&is_step_pick=true&page=1&limit=10
```

## 📊 구현된 API 엔드포인트

### AI Services ✅
```http
GET /api/ai-services?category_id=1&pricing_model=free&include_categories=true
POST /api/ai-services
PUT /api/ai-services/:id
DELETE /api/ai-services/:id  # 소프트 삭제
GET /api/ai-services/search?q=image
GET /api/ai-services/:id/contents
POST /api/ai-services/:id/contents
```

### AI Videos ✅
```http
GET /api/ai-videos?category_id=2&search=tutorial
POST /api/ai-videos
GET /api/ai-videos/:id  # 카테고리, AI 서비스 정보 포함
PUT /api/ai-videos/:id
DELETE /api/ai-videos/:id  # 소프트 삭제
```

### Categories ✅
```http
GET /api/categories  # 계층 구조로 반환 (children 포함)
POST /api/categories
PUT /api/categories/:id
DELETE /api/categories/:id  # 하위 카테고리도 함께 삭제
PUT /api/categories/:id/reorder  # 드래그앤드롭 순서 변경
```

### Dashboard ✅
```http
GET /api/dashboard/stats  # 전체 통계 조회
```

### Health Check ✅
```http
GET /health  # 서버 상태 및 DB 연결 확인
GET /       # API 정보 및 엔드포인트 목록
```

## ⏳ 미구현 기능 (향후 계획)

### User Favorites (사용자 즐겨찾기)
```http
GET /api/users/:id/favorites?type=ai_service
POST /api/users/:id/favorites
DELETE /api/users/:id/favorites/:favoriteId
```

### Reviews (리뷰 시스템)
```http
GET /api/reviews?review_type=ai_service&review_target_id=1
POST /api/reviews
PUT /api/reviews/:id
DELETE /api/reviews/:id
```

### Curations (큐레이션)
```http
GET /api/curations?include_ai_services=true
POST /api/curations
PUT /api/curations/:id
DELETE /api/curations/:id
GET /api/curations/:id/ai-services
```

### View Tracking (조회 기록)
```http
POST /api/ai-services/:id/view  # 조회 기록
POST /api/ai-videos/:id/view    # 조회 기록
GET /api/rankings/:type         # 랭킹 조회
```

## 🔍 현재 검색 및 필터링 기능

### AI 서비스 검색 ✅
```http
GET /api/ai-services?search=chatgpt&category_id=1&ai_status=active&is_step_pick=true
```

### AI 영상 검색 ✅
```http
GET /api/ai-videos?search=tutorial&category_id=2&video_status=active
```

### 카테고리별 필터링 ✅
- **계층 구조**: 메인/서브 카테고리 지원
- **다중 카테고리**: 하나의 서비스가 여러 카테고리에 속할 수 있음
- **메인 카테고리**: 대표 카테고리 지정 가능

### 향후 통합 검색 계획 ⏳
```http
GET /api/search?q=image&category_id=2&pricing_model=free
```

## 📈 랭킹 시스템 (계획)

### 랭킹 타입 ⏳
- `ai_service`: AI 서비스 랭킹
- `ai_video`: AI 영상 랭킹  
- `category`: 카테고리 랭킹
- `curation`: 큐레이션 랭킹

### 랭킹 계산 요소 ⏳
- **조회수**: 서비스/영상 조회 횟수
- **즐겨찾기 수**: 사용자 즐겨찾기 등록 횟수
- **평점**: 사용자 리뷰 평균 점수
- **Step Pick**: 관리자 추천 가중치

## 🛠️ 기술 스택 및 구현 상세

### 백엔드 ✅
- **Node.js + TypeScript**: 타입 안전성 보장
- **Express.js**: RESTful API 서버
- **MySQL 8.0**: 관계형 데이터베이스
- **Swagger**: API 문서화 (자동 생성)
- **Railway**: 클라우드 배포

### 프론트엔드 (관리자) ✅
- **React + TypeScript**: 관리자 대시보드
- **드래그앤드롭**: 카테고리 순서 변경
- **실시간 통계**: 대시보드 차트

### 데이터베이스 설계 ✅
- **소프트 삭제**: deleted_at 필드 활용
- **계층 구조**: 자기 참조 외래키
- **다대다 관계**: 중간 테이블 활용
- **인덱스 최적화**: 검색 성능 향상

## 🎨 현재 구현된 UI/UX

### 1. 관리자 대시보드 ✅
- **통계 카드**: 주요 지표 한눈에 보기
- **카테고리 관리**: 드래그앤드롭으로 순서 변경
- **AI 서비스 관리**: CRUD 인터페이스
- **AI 영상 관리**: 메타데이터 입력 폼

### 2. API 문서 ✅
- **Swagger UI**: 자동 생성된 API 문서
- **실시간 테스트**: 브라우저에서 API 테스트 가능
- **스키마 정의**: 요청/응답 구조 명시

### 3. 향후 ���용자 UI 계획 ⏳
- **메인 페이지**: 카테고리별 AI 서비스 그리드
- **서비스 상세**: 가격, 사용법, 관련 영상
- **영상 페이지**: 플레이어 + 사용된 서비스 목록
- **검색 페이지**: 통합 검색 및 필터링

## 🚀 개발 로드맵

### ✅ Phase 1: 핵심 기능 (완료)
1. ✅ 데이터베이스 스키마 설계 및 적용
2. ✅ AI 서비스 CRUD API
3. ✅ 카테고리 관리 API (드래그앤드롭 포함)
4. ✅ AI 영상 CRUD API
5. ✅ 기본 검색 및 필터링
6. ✅ 관리자 대시보드

### 🔄 Phase 2: 사용자 기능 (진행중)
1. ⏳ 사용자 인증 시스템
2. ⏳ 사용자 즐겨찾기 API
3. ⏳ 리뷰 시스템 API
4. ⏳ 조회 기록 시스템

### ⏳ Phase 3: 콘텐츠 확장
1. ⏳ 큐레이션 CRUD API
2. ⏳ 큐레이션-서비스 연결 기능
3. ⏳ 통합 검색 API
4. ⏳ 파일 업로드 시스템

### ⏳ Phase 4: 고도화
1. ⏳ 랭킹 시스템
2. ⏳ 추천 알고리즘
3. ⏳ 통계 및 분석
4. ⏳ 사용자 프론트엔드

## 📊 현재 상태 요약

| 기능 | 상태 | 완성도 |
|------|------|--------|
| AI 서비스 관리 | ✅ | 100% |
| AI 영상 관리 | ✅ | 100% |
| 카테고리 관리 | ✅ | 100% |
| 대시보드 | ✅ | 100% |
| 검색/필터링 | ✅ | 80% |
| 사용자 시스템 | 🔄 | 20% |
| 큐레이션 | ⏳ | 0% |
| 랭킹 시스템 | ⏳ | 0% |

---

이 가이드는 StepAI API의 현재 구현 상태와 향후 개발 계획을 제공합니다.