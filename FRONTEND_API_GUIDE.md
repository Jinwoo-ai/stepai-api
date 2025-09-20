# StepAI API - 프론트엔드 개발 가이드

## 📋 개요

StepAI API는 AI 전문가 매칭 서비스를 위한 RESTful API입니다. 이 문서는 프론트엔드 개발자가 API를 효율적으로 활용할 수 있도록 작성되었습니다.

### 🎯 서비스 목적
- AI 전문가와 클라이언트 매칭
- AI 서비스 및 콘텐츠 관리
- 랭킹 시스템을 통한 추천 서비스

### 🏗️ 시스템 아키텍처
```
Frontend (React/Vue/Angular) 
    ↓ HTTP/HTTPS
StepAI API Server (Node.js + Express)
    ↓ MySQL Connection
Database (MySQL 8.0+)
```

## 🔗 API 기본 정보

### Base URL
- **개발환경**: `http://localhost:3000`
- **스테이징**: `https://staging-api.stepai.com`
- **프로덕션**: `https://api.stepai.com`

### 공통 응답 형식
```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### HTTP 상태 코드
- `200`: 성공
- `201`: 생성 성공
- `400`: 잘못된 요청
- `404`: 리소스를 찾을 수 없음
- `500`: 서버 오류

## 👥 사용자 관리 API

### 사용자 타입
- `client`: 일반 클라이언트
- `expert`: AI 전문가
- `admin`: 관리자

### 주요 엔드포인트

#### 1. 사용자 목록 조회
```http
GET /api/users?page=1&limit=10&user_type=expert&user_status=active
```

**쿼리 파라미터:**
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 10)
- `user_type`: 사용자 타입 필터
- `user_status`: 사용자 상태 필터

**응답 예시:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "user_type": "expert",
      "user_status": "active",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

#### 2. 사용자 생성
```http
POST /api/users
Content-Type: application/json

{
  "username": "new_user",
  "email": "user@example.com",
  "password": "securePassword123",
  "user_type": "client"
}
```

## 🤖 AI 서비스 관리 API

### AI 서비스 타입
- `LLM`: 대형 언어 모델
- `RAG`: 검색 증강 생성
- `GPTs`: GPT 기반 서비스
- `Prompter`: 프롬프트 엔지니어링 도구

### 주요 엔드포인트

#### 1. AI 서비스 목록 조회 (관련 데이터 포함)
```http
GET /api/ai-services?page=1&limit=12&ai_status=active&include_categories=true&include_contents=true
```

**쿼리 파라미터:**
- `ai_status`: 서비스 상태 (`active`, `inactive`, `pending`, `deleted`)
- `ai_type`: AI 서비스 타입
- `nationality`: 국가 필터
- `category_id`: 카테고리 ID 필터
- `include_contents`: 콘텐츠 정보 포함 여부
- `include_categories`: 카테고리 정보 포함 여부

#### 2. AI 서비스 상세 조회
```http
GET /api/ai-services/123/detail
```

**응답에 포함되는 관련 데이터:**
- 연결된 콘텐츠 목록
- 카테고리 정보
- 태그 정보
- 사용 통계

#### 3. AI 서비스 검색
```http
GET /api/ai-services/search?q=ChatGPT
```

#### 4. AI 서비스 아이콘 업로드
```http
POST /api/ai-services/upload-icon
Content-Type: multipart/form-data

icon: [이미지 파일]
```

**지원 파일 형식:** jpg, jpeg, png, gif, ico, svg (최대 5MB)

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "url": "/uploads/icons/1704067200000_abc123.png",
    "filename": "1704067200000_abc123.png"
  },
  "message": "아이콘이 업로드되었습니다."
}
```

## 🎬 영상 관리 API

### 영상 상태
- `active`: 활성 상태
- `inactive`: 비활성 상태

### 주요 엔드포인트

#### 1. 영상 목록 조회 (AI 서비스 포함)
```http
GET /api/ai-videos?page=1&limit=20&video_status=active
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 3,
        "video_title": "dify 사용법",
        "video_url": "https://youtu.be/xWG4nYBZTsE",
        "thumbnail_url": "https://img.youtube.com/vi/xWG4nYBZTsE/maxresdefault.jpg",
        "ai_services": [
          {
            "id": 39,
            "ai_name": "ChatPDF",
            "usage_order": 1
          }
        ],
        "tags": "#AI글쓰기 #AI영상생성",
        "tag_ids": [1, 22]
      }
    ]
  }
}
```

#### 2. 영상 생성
```http
POST /api/ai-videos
Content-Type: application/json

{
  "video_title": "AI 도구 사용법",
  "video_description": "<p>초보자를 위한 AI 도구 가이드</p>",
  "video_url": "https://youtube.com/watch?v=example",
  "video_status": "active",
  "is_visible": true,
  "ai_services": [
    {
      "ai_service_id": 1,
      "usage_order": 1
    }
  ],
  "selected_tags": [1, 2]
}
```

## 📋 큐레이션 관리 API

### 큐레이션 상태
- `active`: 활성 상태
- `inactive`: 비활성 상태

### 주요 엔드포인트

#### 1. 큐레이션 목록 조회 (AI 서비스 포함)
```http
GET /api/curations?page=1&limit=10&curation_status=active&include_ai_services=true
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "curation_title": "CEO's PICK AI서비스",
        "curation_description": "<p>CEO's Pick</p>",
        "curation_order": 1,
        "ai_services": [
          {
            "id": 1,
            "ai_name": "ChatGPT",
            "ai_description": "OpenAI의 대화형 인공지능",
            "service_order": 1
          }
        ]
      }
    ]
  }
}
```

#### 2. 큐레이션 생성
```http
POST /api/curations
Content-Type: application/json

{
  "curation_title": "추천 AI 도구",
  "curation_description": "<p>업무 효율성을 높이는 AI 도구들</p>",
  "curation_order": 1,
  "curation_status": "active",
  "ai_service_ids": [1, 2, 3]
}
```

## 🏷️ 태그 관리 API

### 주요 엔드포인트

#### 1. 태그 목록 조회
```http
GET /api/tags
```

**응답 예시:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "tag_name": "AI글쓰기",
      "tag_count": 61,
      "service_count": 61,
      "video_count": 0,
      "created_at": "2025-09-10T07:32:21.000Z"
    }
  ]
}
```

#### 2. 태그별 아이템 조회
```http
GET /api/tags/14/items
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "id": 1,
        "ai_name": "ChatGPT",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "videos": [
      {
        "id": 1,
        "video_title": "AI 사용법",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

## 👨‍💼 전문가 관리 API

### 전문가 정보 구조
```typescript
interface Expert {
  id: number;
  user_id: number;
  group_id?: number;
  expert_name: string;
  expert_title?: string;
  expert_bio?: string;
  expert_avatar?: string;
  expert_website?: string;
  expert_email?: string;
  expert_phone?: string;
  expert_location?: string;
  expert_status: 'active' | 'inactive' | 'pending' | 'deleted';
}
```

### 주요 엔드포인트

#### 1. 전문가 목록 조회 (관련 데이터 포함)
```http
GET /api/experts?page=1&limit=9&expert_status=active&include_user=true&include_contents=true&include_ai_services=true
```

**관련 데이터 포함 옵션:**
- `include_user`: 사용자 정보 포함
- `include_group`: 그룹 정보 포함
- `include_contents`: 전문가가 만든 콘텐츠 포함
- `include_ai_services`: 전문가가 사용하는 AI 서비스 포함

#### 2. 전문가 상세 조회
```http
GET /api/experts/456/detail
```

## 📄 콘텐츠 관리 API

### 콘텐츠 타입
- `link`: 웹 링크
- `logo`: 로고 이미지
- `image`: 일반 이미지
- `video`: 비디오
- `text`: 텍스트
- `audio`: 오디오
- `pdf`: PDF 문서

### 주요 엔드포인트

#### 1. 콘텐츠 목록 조회
```http
GET /api/contents?page=1&limit=20&content_status=active&content_type=image&include_categories=true&include_ai_services=true
```

#### 2. 콘텐츠 생성
```http
POST /api/contents
Content-Type: application/json

{
  "content_title": "AI 생성 로고 디자인",
  "content_description": "Midjourney로 생성한 브랜드 로고",
  "content_url": "https://example.com/logo.png",
  "content_type": "logo",
  "content_order_index": 1,
  "category_ids": [1, 3],
  "tag_ids": [5, 7],
  "ai_service_ids": [2]
}
```

## 📊 랭킹 시스템 API

### 랭킹 타입
- `ai_service`: AI 서비스 랭킹
- `content`: 콘텐츠 랭킹
- `expert`: 전문가 랭킹
- `category`: 카테고리 랭킹

### 주요 엔드포인트

#### 1. 랭킹 조회
```http
GET /api/rankings/ai_service?limit=10&date_from=2024-01-01&date_to=2024-01-31
```

**응답 예시:**
```json
{
  "success": true,
  "data": [
    {
      "entity_id": 1,
      "entity_name": "ChatGPT",
      "total_score": 95.5,
      "view_count": 1250,
      "request_count": 45,
      "avg_rating": 4.8,
      "rank": 1
    }
  ]
}
```

#### 2. 콘텐츠 조회 기록
```http
POST /api/rankings/record-view
Content-Type: application/json

{
  "content_id": 123,
  "user_id": 456,
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0..."
}
```

## 📁 파일 업로드 API

### 지원 파일 형식
- **이미지**: jpeg, jpg, png, gif, webp
- **아이콘**: ico, svg
- **최대 크기**: 10MB

### 업로드 타입
- `categories`: 카테고리 이미지
- `companies`: 회사 로고
- `ai-services`: AI 서비스 관련 이미지

### 주요 엔드포인트

#### 1. 파일 업로드
```http
POST /api/assets/upload/categories
Content-Type: multipart/form-data

file: [파일 데이터]
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "filename": "1704067200000_logo.png",
    "originalName": "logo.png",
    "size": 2048576,
    "url": "/assets/categories/1704067200000_logo.png",
    "type": "categories"
  }
}
```

#### 2. 파일 목록 조회
```http
GET /api/assets/list/categories
```

#### 3. 파일 삭제
```http
DELETE /api/assets/delete/categories/1704067200000_logo.png
```

## 🔍 검색 및 필터링

### 공통 검색 패턴
모든 주요 엔티티(AI 서비스, 전문가, 콘텐츠)는 다음과 같은 검색 엔드포인트를 제공합니다:

```http
GET /api/{entity}/search?q={검색어}
```

### 고급 필터링 예시

#### AI 서비스 필터링
```http
GET /api/ai-services?ai_type=LLM&nationality=US&category_id=1&ai_status=active
```

#### 전문가 필터링
```http
GET /api/experts?expert_location=Seoul&group_id=5&expert_status=active
```

#### 콘텐츠 필터링
```http
GET /api/contents?content_type=video&category_id=2&tag_id=8
```

## 📈 통계 API

각 주요 엔티티는 통계 정보를 제공합니다:

```http
GET /api/ai-services/stats/overview
GET /api/experts/stats/overview  
GET /api/contents/stats/overview
```

## 🛠️ 프론트엔드 구현 가이드

### 1. 페이지네이션 구현
```typescript
interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const fetchData = async (page: number, limit: number) => {
  const response = await fetch(`/api/ai-services?page=${page}&limit=${limit}`);
  const result = await response.json();
  return result;
};
```

### 2. 검색 기능 구현
```typescript
const searchAIServices = async (query: string) => {
  const response = await fetch(`/api/ai-services/search?q=${encodeURIComponent(query)}`);
  return await response.json();
};
```

### 3. 파일 업로드 구현
```typescript
const uploadFile = async (file: File, type: string) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`/api/assets/upload/${type}`, {
    method: 'POST',
    body: formData
  });
  
  return await response.json();
};
```

### 4. 관련 데이터 포함 요청
```typescript
// AI 서비스 목록을 카테고리와 콘텐츠 정보와 함께 조회
const fetchAIServicesWithRelations = async () => {
  const response = await fetch('/api/ai-services?include_categories=true&include_contents=true');
  return await response.json();
};
```

## 🎨 UI/UX 권장사항

### 1. 카드 레이아웃
- AI 서비스, 전문가, 콘텐츠는 카드 형태로 표시
- 각 카드에 이미지, 제목, 간단한 설명, 태그 포함

### 2. 필터 사이드바
- 카테고리, 타입, 상태별 필터 제공
- 실시간 검색 결과 업데이트

### 3. 랭킹 표시
- 인기 순위를 시각적으로 표현
- 점수, 조회수, 평점 등의 지표 표시

### 4. 무한 스크롤 또는 페이지네이션
- 대용량 데이터 처리를 위한 효율적인 로딩

## 🔒 보안 고려사항

### 1. API 키 관리
- 환경 변수를 통한 API 키 관리
- 프로덕션과 개발 환경 분리

### 2. 입력 검증
- 클라이언트 사이드 검증과 서버 사이드 검증 병행
- XSS 방지를 위한 입력 sanitization

### 3. 파일 업로드 보안
- 파일 타입 및 크기 제한
- 악성 파일 업로드 방지

## 🚀 성능 최적화

### 1. 데이터 캐싱
- 자주 조회되는 데이터는 클라이언트 사이드 캐싱
- 랭킹 데이터는 주기적으로 업데이트

### 2. 이미지 최적화
- 적절한 이미지 크기 및 포맷 사용
- Lazy loading 구현

### 3. API 호출 최적화
- 필요한 관련 데이터만 포함하여 요청
- 불필요한 API 호출 최소화

## 📱 반응형 디자인

### 브레이크포인트 권장사항
- Mobile: 320px - 768px
- Tablet: 768px - 1024px  
- Desktop: 1024px+

### 모바일 최적화
- 터치 친화적인 UI 요소
- 간소화된 네비게이션
- 빠른 로딩 시간

## 🧪 테스트 가이드

### API 테스트 도구
- **Postman**: API 엔드포인트 테스트
- **Swagger UI**: 자동 생성된 API 문서 및 테스트 인터페이스

### 테스트 시나리오
1. 사용자 생성 및 조회
2. AI 서비스 목록 조회 및 필터링
3. 전문가 검색 및 상세 조회
4. 콘텐츠 업로드 및 관리
5. 랭킹 시스템 동작 확인

## 📞 지원 및 문의

개발 중 문제가 발생하거나 추가 기능이 필요한 경우:
1. GitHub Issues 생성
2. API 문서 확인: `/api-docs` (Swagger UI)
3. 개발팀 연락

---

이 문서는 StepAI API v1.0.0 기준으로 작성되었습니다. API 업데이트 시 문서도 함께 업데이트됩니다.