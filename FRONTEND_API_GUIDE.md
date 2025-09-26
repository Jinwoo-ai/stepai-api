# StepAI Frontend API 가이드

## 🌐 기본 정보
- **Base URL**: `http://localhost:3004` (개발), `http://115.85.182.98:3004` (프로덕션)
- **API 문서**: `/api-docs` (Swagger UI)
- **Content-Type**: `application/json`

## 🏠 메인페이지 API

### 1. 메인페이지 전체 설정 조회 (통합 API)

```http
GET /api/homepage-settings
```
**설명**: 메인페이지의 모든 섹션 설정을 한 번에 조회

**Query Parameters**:
- `category_id` (선택사항): 특정 카테고리의 STEP PICK 및 트렌드 서비스만 조회

**Response**:
```json
{
  "success": true,
  "data": {
    "videos": [
      {
        "id": 1,
        "ai_video_id": 5,
        "display_order": 1,
        "is_active": true,
        "video_title": "ChatGPT 완벽 활용법",
        "video_description": "ChatGPT를 업무에 활용하는 방법",
        "thumbnail_url": "https://img.youtube.com/vi/.../maxresdefault.jpg",
        "video_duration": 630,
        "view_count": 1500
      }
    ],
    "curations": [
      {
        "id": 1,
        "curation_id": 3,
        "display_order": 1,
        "is_active": true,
        "curation_title": "업무 효율성을 높이는 AI 도구",
        "curation_description": "일상 업무에 도움이 되는 AI 서비스 모음",
        "curation_thumbnail": "/uploads/curations/thumbnail1.jpg"
      }
    ],
    "stepPick": [
      {
        "id": 1,
        "ai_service_id": 5,
        "category_id": 1,
        "display_order": 1,
        "is_active": true,
        "ai_name": "ChatGPT",
        "ai_description": "OpenAI의 대화형 AI 모델",
        "ai_logo": "/uploads/icons/chatgpt.png",
        "company_name": "OpenAI",
        "category_name": "문서·글쓰기"
      }
    ],
    "trends": [
      {
        "id": 1,
        "section_type": "popular",
        "section_title": "요즘 많이 쓰는",
        "section_description": "사용자들이 많이 이용하는 인기 AI 서비스",
        "is_category_based": true,
        "is_active": true,
        "display_order": 1,
        "services": [
          {
            "id": 1,
            "ai_service_id": 3,
            "category_id": 1,
            "display_order": 1,
            "is_featured": true,
            "is_active": true,
            "ai_name": "Claude",
            "ai_description": "Anthropic의 AI 어시스턴트",
            "ai_logo": "/uploads/icons/claude.png",
            "company_name": "Anthropic",
            "category_name": "문서·글쓰기"
          }
        ]
      }
    ]
  }
}
```

### 2. 메인페이지 영상 섹션 조회

```http
GET /api/homepage-settings/videos
```
**설명**: 어드민이 설정한 메인페이지 전용 영상 목록 조회

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "ai_video_id": 5,
      "display_order": 1,
      "is_active": true,
      "video_title": "ChatGPT 완벽 활용법",
      "video_description": "ChatGPT를 업무에 활용하는 방법",
      "thumbnail_url": "https://img.youtube.com/vi/.../maxresdefault.jpg",
      "video_duration": 630,
      "view_count": 1500
    }
  ]
}
```

### 3. 메인페이지 큐레이션 섹션 조회

```http
GET /api/homepage-settings/curations
```
**설명**: 어드민이 메인페이지용으로 설정한 큐레이션만 조회

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "curation_id": 3,
      "display_order": 1,
      "is_active": true,
      "curation_title": "업무 효율성을 높이는 AI 도구",
      "curation_description": "일상 업무에 도움이 되는 AI 서비스 모음",
      "curation_thumbnail": "/uploads/curations/thumbnail1.jpg"
    }
  ]
}
```

### 4. 메인페이지 STEP PICK 섹션 조회 (카테고리별)

```http
GET /api/homepage-settings/step-pick
```
**설명**: 어드민이 메인페이지 STEP PICK용으로 설정한 AI 서비스 조회 (카테고리별 지원)

**Query Parameters**:
- `category_id` (선택사항): 특정 카테고리의 STEP PICK 서비스만 조회

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "ai_service_id": 5,
      "category_id": 1,
      "display_order": 1,
      "is_active": true,
      "ai_name": "ChatGPT",
      "ai_description": "OpenAI의 대화형 AI 모델",
      "ai_logo": "/uploads/icons/chatgpt.png",
      "company_name": "OpenAI",
      "category_name": "문서·글쓰기"
    }
  ]
}
```

### 5. 메인 카테고리 목록 조회

```http
GET /api/homepage-settings/main-categories
```
**설명**: 메인페이지에서 사용할 수 있는 메인 카테고리 목록 조회

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "category_name": "문서·글쓰기",
      "category_icon": "📝"
    },
    {
      "id": 2,
      "category_name": "이미지·영상",
      "category_icon": "🎨"
    }
  ]
}
```

## 🔥 트렌드 메뉴 API

### 1. 트렌드 섹션 목록 조회

```http
GET /api/homepage-settings/trends
```
**설명**: 트렌드 메뉴에 표시될 섹션 목록 조회 (어드민 설정)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "section_type": "popular",
      "section_title": "요즘 많이 쓰는",
      "section_description": "사용자들이 많이 이용하는 인기 AI 서비스",
      "is_category_based": true,
      "is_active": true,
      "display_order": 1
    },
    {
      "id": 2,
      "section_type": "latest",
      "section_title": "최신 등록",
      "section_description": "최근에 등록된 새로운 AI 서비스",
      "is_category_based": true,
      "is_active": true,
      "display_order": 2
    },
    {
      "id": 3,
      "section_type": "step_pick",
      "section_title": "STEP PICK",
      "section_description": "STEP AI가 추천하는 엄선된 AI 서비스",
      "is_category_based": true,
      "is_active": true,
      "display_order": 3
    }
  ]
}
```

### 2. 트렌드 섹션별 서비스 조회 (카테고리별)

```http
GET /api/homepage-settings/trends/{sectionId}/services
```
**설명**: 특정 트렌드 섹션의 AI 서비스 목록 조회 (카테고리별 필터링 지원)

**Query Parameters**:
- `category_id` (선택사항): 특정 카테고리의 서비스만 조회

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "ai_service_id": 3,
      "category_id": 1,
      "display_order": 1,
      "is_featured": true,
      "is_active": true,
      "ai_name": "Claude",
      "ai_description": "Anthropic의 AI 어시스턴트",
      "ai_logo": "/uploads/icons/claude.png",
      "company_name": "Anthropic",
      "is_step_pick": false,
      "category_name": "문서·글쓰기"
    }
  ]
}
```

## 📂 카테고리 페이지 API

### 1. 카테고리 목록 조회
```http
GET /api/categories
```
**설명**: 전체 카테고리 계층 구조 조회

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "category_name": "문서·글쓰기",
      "category_icon": "📝",
      "parent_id": null,
      "category_order": 1,
      "children": [
        {
          "id": 11,
          "category_name": "AI 글쓰기",
          "category_icon": "✍️",
          "parent_id": 1,
          "category_order": 1
        }
      ]
    }
  ]
}
```

### 2. 카테고리별 AI 서비스 조회
```http
GET /api/ai-services?category_id=1&ai_status=active&include_categories=true&page=1&limit=20
```
**설명**: 특정 카테고리의 AI 서비스 목록 조회 (페이지네이션 포함)

**Query Parameters**:
- `category_id`: 카테고리 ID
- `ai_status`: 서비스 상태 (active, inactive)
- `include_categories`: 카테고리 정보 포함 여부
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 20)
- `search`: 검색어 (선택사항)
- `pricing_model`: 가격 모델 필터 (free, freemium, paid)
- `ai_type`: AI 타입 필터 (WEB, MOB, API, DES, EXT)
- `sort`: 정렬 방식 (popular, latest, name)

## 🤖 AI 서비스 상세 페이지 API

### 1. AI 서비스 상세 조회
```http
GET /api/ai-services/{id}?include_categories=true
```
**설명**: AI 서비스 상세 정보 조회 (카테고리, 콘텐츠, 유사 서비스 포함)

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "ai_name": "ChatGPT",
    "ai_name_en": "ChatGPT",
    "ai_description": "OpenAI의 대화형 AI 모델",
    "ai_logo": "/uploads/icons/chatgpt.png",
    "ai_website": "https://chat.openai.com",
    "company_name": "OpenAI",
    "company_name_en": "OpenAI",
    "headquarters": "미국",
    "pricing_info": "무료 / 월 $20",
    "difficulty_level": "beginner",
    "usage_availability": "웹, 모바일 앱",
    "embedded_video_url": "https://youtube.com/embed/...",
    "categories": [
      {
        "id": 1,
        "category_name": "AI 어시스턴트"
      }
    ],
    "tags": "#AI글쓰기 #대화형에이전트",
    "tag_ids": [1, 2],
    "contents": [
      {
        "content_type": "features",
        "content_title": "주요 기능",
        "content_text": "<p>대화형 AI 모델로...</p>"
      }
    ],
    "similar_services_list": [
      {
        "id": 2,
        "ai_name": "Claude",
        "ai_logo": "/uploads/icons/claude.png",
        "company_name": "Anthropic"
      }
    ]
  }
}
```

## 🎬 영상 페이지 API

### 1. 영상 목록 조회
```http
GET /api/ai-videos?page=1&limit=20
```
**설명**: 영상 목록 조회 (페이지네이션 포함)

**Query Parameters**:
- `page`: 페이지 번호
- `limit`: 페이지당 항목 수
- `category`: 카테고리 필터 (선택사항)
- `search`: 검색어 (선택사항)

### 2. 영상 상세 조회
```http
GET /api/ai-videos/{id}
```
**설명**: 영상 상세 정보 조회 (연관 AI 서비스 포함)

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "video_title": "ChatGPT 완벽 활용법",
    "video_description": "ChatGPT를 업무에 활용하는 방법을 상세히 설명합니다.",
    "video_url": "https://youtube.com/watch?v=...",
    "thumbnail_url": "https://img.youtube.com/vi/.../maxresdefault.jpg",
    "video_duration": "10:30",
    "view_count": 1500,
    "like_count": 120,
    "created_at": "2024-01-15T10:00:00Z",
    "tags": "#ChatGPT #AI #업무효율성",
    "ai_services": [
      {
        "id": 1,
        "ai_name": "ChatGPT",
        "ai_logo": "/uploads/icons/chatgpt.png",
        "usage_order": 1
      }
    ]
  }
}
```

## 🔍 검색 API

### 1. AI 서비스 검색
```http
GET /api/ai-services/search?q=chatgpt
```
**설명**: AI 서비스명과 설명에서 검색어 검색

### 2. 통합 검색 (향후 구현)
```http
GET /api/search?q=검색어&type=all
```
**설명**: AI 서비스, 영상, 카테고리 통합 검색

## 📊 통계 API

### 1. 대시보드 통계
```http
GET /api/dashboard/stats
```
**설명**: 전체 통계 정보 조회

**Response**:
```json
{
  "success": true,
  "data": {
    "totalUsers": 1250,
    "newUsers": 45,
    "totalAIServices": 156,
    "totalVideos": 89,
    "totalCategories": 24,
    "stepPickServices": 12,
    "activeServices": 142,
    "totalViews": 15420
  }
}
```

## ❤️ MY PICK API

### 1. 관심 AI 서비스 목록 조회

```http
GET /api/my-picks/services
```
**설명**: 로그인한 사용자가 관심 등록한 AI 서비스 목록 조회

**Headers**:
- `user-id`: 사용자 ID (필수)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "ai_service_id": 5,
      "created_at": "2024-01-15T10:00:00Z",
      "ai_name": "ChatGPT",
      "ai_description": "OpenAI의 대화형 AI 모델",
      "ai_logo": "/uploads/icons/chatgpt.png",
      "company_name": "OpenAI",
      "is_step_pick": true
    }
  ]
}
```

### 2. AI 서비스 관심 등록

```http
POST /api/my-picks/services/{serviceId}
```
**설명**: AI 서비스를 관심 목록에 추가

**Headers**:
- `user-id`: 사용자 ID (필수)

**Response**:
```json
{
  "success": true,
  "message": "관심 서비스로 등록되었습니다."
}
```

### 3. AI 서비스 관심 해제

```http
DELETE /api/my-picks/services/{serviceId}
```
**설명**: AI 서비스를 관심 목록에서 제거

**Headers**:
- `user-id`: 사용자 ID (필수)

**Response**:
```json
{
  "success": true,
  "message": "관심 서비스에서 제거되었습니다."
}
```

### 4. 관심 영상 목록 조회

```http
GET /api/my-picks/videos
```
**설명**: 로그인한 사용자가 관심 등록한 영상 목록 조회

**Headers**:
- `user-id`: 사용자 ID (필수)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "ai_video_id": 3,
      "created_at": "2024-01-15T10:00:00Z",
      "video_title": "ChatGPT 완벽 활용법",
      "video_description": "ChatGPT를 업무에 활용하는 방법",
      "thumbnail_url": "https://img.youtube.com/vi/.../maxresdefault.jpg",
      "video_duration": 630,
      "view_count": 1500
    }
  ]
}
```

### 5. 영상 관심 등록

```http
POST /api/my-picks/videos/{videoId}
```
**설명**: 영상을 관심 목록에 추가

**Headers**:
- `user-id`: 사용자 ID (필수)

**Response**:
```json
{
  "success": true,
  "message": "관심 영상으로 등록되었습니다."
}
```

### 6. 영상 관심 해제

```http
DELETE /api/my-picks/videos/{videoId}
```
**설명**: 영상을 관심 목록에서 제거

**Headers**:
- `user-id`: 사용자 ID (필수)

**Response**:
```json
{
  "success": true,
  "message": "관심 영상에서 제거되었습니다."
}
```

### 7. 통합 관심 목록 조회

```http
GET /api/my-picks
```
**설명**: 관심 등록한 모든 항목 조회 (AI 서비스 + 영상)

**Headers**:
- `user-id`: 사용자 ID (필수)

**Response**:
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "type": "service",
        "item_id": 5,
        "created_at": "2024-01-15T10:00:00Z",
        "title": "ChatGPT",
        "description": "OpenAI의 대화형 AI 모델",
        "image_url": "/uploads/icons/chatgpt.png",
        "company_name": "OpenAI"
      }
    ],
    "videos": [
      {
        "type": "video",
        "item_id": 3,
        "created_at": "2024-01-15T09:00:00Z",
        "title": "ChatGPT 완벽 활용법",
        "description": "ChatGPT를 업무에 활용하는 방법",
        "image_url": "https://img.youtube.com/vi/.../maxresdefault.jpg",
        "company_name": null
      }
    ],
    "all": [
      {
        "type": "service",
        "item_id": 5,
        "created_at": "2024-01-15T10:00:00Z",
        "title": "ChatGPT",
        "description": "OpenAI의 대화형 AI 모델",
        "image_url": "/uploads/icons/chatgpt.png",
        "company_name": "OpenAI"
      },
      {
        "type": "video",
        "item_id": 3,
        "created_at": "2024-01-15T09:00:00Z",
        "title": "ChatGPT 완벽 활용법",
        "description": "ChatGPT를 업무에 활용하는 방법",
        "image_url": "https://img.youtube.com/vi/.../maxresdefault.jpg",
        "company_name": null
      }
    ]
  }
}
```

## 👥 회원관리 API

### 1. SNS 로그인/회원가입
```http
POST /api/users/sns-login
```
**설명**: SNS 계정으로 로그인 또는 회원가입 및 액세스 토큰 발급

**Request Body**:
```json
{
  "sns_type": "naver",
  "sns_user_id": "naver_12345",
  "name": "김철수",
  "email": "kim@naver.com",
  "industry": "IT",
  "job_role": "개발자",
  "job_level": "대리",
  "experience_years": 3
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "김철수",
      "email": "kim@naver.com",
      "industry": "IT",
      "job_role": "개발자",
      "job_level": "대리",
      "experience_years": 3,
      "user_type": "member",
      "user_status": "active",
      "created_at": "2024-01-15T10:00:00Z",
      "sns_accounts": [
        {
          "sns_type": "naver",
          "sns_user_id": "naver_12345"
        }
      ]
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```# 1. 대시보드 통계
```http
GET /api/dashboard/stats
```
**설명**: 전체 통계 정보 조회

**Response**:
```json
{
  "success": true,
  "data": {
    "totalUsers": 1250,
    "newUsers": 45,
    "totalAIServices": 156,
    "totalVideos": 89,
    "totalCategories": 24,
    "stepPickServices": 12,
    "activeServices": 142,
    "totalViews": 15420
  }
}
```

## 👥 회원관리 API

### 1. SNS 로그인/회원가입
```http
POST /api/users/sns-login
```
**설명**: SNS 계정으로 로그인 또는 회원가입 및 액세스 토큰 발급

**Request Body**:
```json
{
  "sns_type": "naver",
  "sns_user_id": "naver_12345",
  "name": "김철수",
  "email": "kim@naver.com",
  "industry": "IT",
  "job_role": "개발자",
  "job_level": "대리",
  "experience_years": 3
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "김철수",
      "email": "kim@naver.com",
      "industry": "IT",
      "job_role": "개발자",
      "job_level": "대리",
      "experience_years": 3,
      "user_type": "member",
      "user_status": "active",
      "created_at": "2024-01-15T10:00:00Z",
      "sns_accounts": [
        {
          "sns_type": "naver",
          "sns_user_id": "naver_12345"
        }
      ]
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2024-02-15T10:00:00Z"
  },
  "message": "SNS 로그인이 성공적으로 처리되었습니다."
}
```

### 2. 로그아웃
```http
POST /api/users/logout
```
**설명**: 사용자 로그아웃 및 토큰 무효화

**Headers**:
```
Authorization: Bearer {access_token}
```

**Response**:
```json
{
  "success": true,
  "message": "로그아웃이 성공적으로 처리되었습니다."
}
```

### 3. 내 정보 조회
```http
GET /api/users/me
```
**설명**: 현재 로그인한 사용자의 정보 조회

**Headers**:
```
Authorization: Bearer {access_token}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "김철수",
    "email": "kim@naver.com",
    "industry": "IT",
    "job_role": "개발자",
    "job_level": "대리",
    "experience_years": 3,
    "user_type": "member",
    "user_status": "active",
    "created_at": "2024-01-15T10:00:00Z",
    "sns_accounts": [
      {
        "sns_type": "naver",
        "sns_user_id": "naver_12345"
      }
    ]
  }
}
```

### 4. 내 정보 수정
```http
PUT /api/users/me
```
**설명**: 현재 로그인한 사용자의 정보 수정

**Headers**:
```
Authorization: Bearer {access_token}
```

**Request Body**:
```json
{
  "name": "김철수",
  "industry": "IT",
  "job_role": "시니어 개발자",
  "job_level": "과장",
  "experience_years": 5
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "김철수",
    "industry": "IT",
    "job_role": "시니어 개발자",
    "job_level": "과장",
    "experience_years": 5
  },
  "message": "사용자 정보가 성공적으로 수정되었습니다."
}
```

## 🤝 광고제휴 API

### 1. 광고제휴 문의 등록
```http
POST /api/ad-partnerships
```
**설명**: 광고제휴 문의 등록 (공개 API)

**Request Body**:
```json
{
  "company_name": "삼성전자",
  "contact_person": "김철수",
  "contact_email": "kim@samsung.com",
  "contact_phone": "010-1234-5678",
  "partnership_type": "banner",
  "budget_range": "1000만원 - 5000만원",
  "campaign_period": "2024년 3월 - 6월",
  "target_audience": "20-40대 직장인",
  "campaign_description": "AI 서비스 홍보를 위한 배너 광고",
  "additional_requirements": "주말 노출 우선",
  "attachment_url": "https://example.com/proposal.pdf"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "company_name": "삼성전자",
    "contact_person": "김철수",
    "inquiry_status": "pending",
    "created_at": "2024-01-15T10:00:00Z"
  },
  "message": "광고제휴 문의가 성공적으로 등록되었습니다."
}
```

### 2. 광고제휴 문의 상태 조회
```http
GET /api/ad-partnerships/{id}
```
**설명**: 광고제휴 문의 상세 정보 조회

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "company_name": "삼성전자",
    "contact_person": "김철수",
    "contact_email": "kim@samsung.com",
    "partnership_type": "banner",
    "inquiry_status": "reviewing",
    "admin_notes": "검토 중입니다.",
    "response_date": "2024-01-16T14:30:00Z",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

## 📋 관리자 전용 API

### 1. 메인페이지 관리

#### 메인페이지 영상 설정
```http
GET /api/homepage-settings/videos
PUT /api/homepage-settings/videos
```
**설명**: 메인페이지에 표시할 영상 목록 조회 및 설정

**Response (GET)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "ai_video_id": 3,
      "display_order": 1,
      "is_active": true,
      "video_title": "dify 사용",
      "video_description": "<p>dify</p>",
      "thumbnail_url": "https://img.youtube.com/vi/xWG4nYBZTsE/maxresdefault.jpg",
      "video_duration": 0,
      "view_count": 0
    }
  ]
}
```

**Request Body (PUT)**:
```json
{
  "videos": [
    {
      "ai_video_id": 3,
      "display_order": 1,
      "is_active": true
    }
  ]
}
```

#### 메인페이지 큐레이션 설정
```http
GET /api/homepage-settings/curations
PUT /api/homepage-settings/curations
```
**설명**: 메인페이지에 표시할 큐레이션 목록 조회 및 설정

**Request Body (PUT)**:
```json
{
  "curations": [
    {
      "curation_id": 1,
      "display_order": 1,
      "is_active": true
    }
  ]
}
```

#### 메인페이지 STEP PICK 설정
```http
GET /api/homepage-settings/step-pick
PUT /api/homepage-settings/step-pick
```
**설명**: 메인페이지에 표시할 STEP PICK 서비스 목록 조회 및 설정

**Request Body (PUT)**:
```json
{
  "services": [
    {
      "ai_service_id": 1,
      "display_order": 1,
      "is_active": true
    }
  ]
}
```

#### 트렌드 섹션 관리
```http
GET /api/homepage-settings/trends
GET /api/homepage-settings/trends/{sectionId}/services
PUT /api/homepage-settings/trends/{sectionId}/services
```
**설명**: 메인페이지 트렌드 섹션 관리

**Response (GET /trends)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "section_type": "popular",
      "section_title": "요즘 많이 쓰는",
      "section_description": "사용자들이 가장 많이 이용하는 인기 AI 서비스",
      "is_active": 1,
      "display_order": 1
    }
  ]
}
```

#### 추가 가능한 콘텐츠 조회
```http
GET /api/homepage-settings/available-videos?search=&limit=50
GET /api/homepage-settings/available-curations?search=&limit=50
GET /api/homepage-settings/available-services?search=&section_id=&limit=50
```
**설명**: 메인페이지에 추가할 수 있는 콘텐츠 목록 조회

**Response (available-videos)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "video_title": "dify 사용",
      "video_description": "<p>dify</p>",
      "thumbnail_url": "https://img.youtube.com/vi/xWG4nYBZTsE/maxresdefault.jpg",
      "video_duration": 0,
      "view_count": 0
    }
  ]
}
```

### 2. 카테고리별 서비스 표시 순서 관리

#### 카테고리별 표시 순서 조회
```http
GET /api/category-display-order/{categoryId}?limit=20
```
**설명**: 특정 카테고리의 표시 순서가 설정된 AI 서비스 목록 조회

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "ai_service_id": 284,
      "display_order": 1,
      "is_featured": 0,
      "ai_name": "ChatGPT",
      "ai_description": "OpenAI의 대화형 인공지능 챗봇 서비스",
      "ai_logo": null,
      "company_name": "오픈AI",
      "pricing_info": "유료, 무료",
      "difficulty_level": "초급",
      "is_step_pick": 1
    }
  ]
}
```

#### 카테고리에 서비스 추가
```http
POST /api/category-display-order/{categoryId}/services
```
**Request Body**:
```json
{
  "ai_service_id": 5,
  "display_order": 1,
  "is_featured": true
}
```

#### 순서 변경
```http
PUT /api/category-display-order/{categoryId}/reorder
```
**Request Body**:
```json
{
  "services": [
    {
      "ai_service_id": 5,
      "display_order": 1,
      "is_featured": true
    }
  ]
}
```

#### 서비스 제거
```http
DELETE /api/category-display-order/{categoryId}/services/{serviceId}
```

#### 추가 가능한 서비스 조회
```http
GET /api/category-display-order/available-services?category_id=1&search=&limit=50
```
**설명**: 특정 카테고리에 아직 추가되지 않은 AI 서비스 목록 조회

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 22,
      "ai_name": "뷰티풀닷에이아이",
      "ai_description": "AI 기반 디자인 도구",
      "ai_logo": null,
      "company_name": "뷰티풀닷에이아이",
      "pricing_info": "유료, 무료",
      "difficulty_level": "초급",
      "is_step_pick": 0
    }
  ]
}
```

### 3. 테이블 설정 API

#### 카테고리 표시 순서 테이블 설정
```http
POST /api/setup/category-display-order
```
**설명**: 카테고리 표시 순서 관리에 필요한 테이블 생성 및 초기화

**Response**:
```json
{
  "success": true,
  "message": "카테고리 표시 순서 테이블이 성공적으로 설정되었습니다.",
  "data": {
    "tableExists": true,
    "hadData": true,
    "categoryStats": [
      {
        "category_name": "IT·프로그래밍",
        "service_count": 61
      }
    ]
  }
}
```

#### 메인페이지 설정 테이블 설정
```http
POST /api/setup/homepage-settings
```
**설명**: 메인페이지 관리에 필요한 테이블들 생성 및 초기화

**Response**:
```json
{
  "success": true,
  "message": "메인페이지 설정 테이블이 성공적으로 설정되었습니다."
}
```

#### 테이블 존재 여부 확인
```http
GET /api/setup/check-tables
```
**설명**: 필요한 테이블들의 존재 여부 확인

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "table": "ai_services",
      "exists": true
    },
    {
      "table": "homepage_videos",
      "exists": true
    }
  ]
}
``` 아직 추가되지 않은 AI 서비스 목록 조회

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 22,
      "ai_name": "뷰티풀닷에이아이",
      "ai_description": "AI 기반 디자인 도구",
      "ai_logo": null,
      "company_name": "뷰티풀닷에이아이",
      "pricing_info": "유료, 무료",
      "difficulty_level": "초급",
      "is_step_pick": 0
    }
  ]
}
```

## 🔧 유틸리티 API

### 1. 헬스체크
```http
GET /health
```
**설명**: 서버 상태 확인

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00Z",
  "database": "connected",
  "environment": "development"
}
```

### 2. API 정보
```http
GET /
```
**설명**: API 기본 정보 및 엔드포인트 목록

## 📋 공통 응답 형식

### 성공 응답
```json
{
  "success": true,
  "data": any,
  "message": "요청이 성공적으로 처리되었습니다."
}
```

### 오류 응답
```json
{
  "success": false,
  "error": "오류 메시지",
  "code": "ERROR_CODE"
}
```

### 페이지네이션
```json
{
  "success": true,
  "data": {
    "data": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 156,
      "totalPages": 8
    }
  }
}
```

## 🚨 에러 코드

| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 400 | 잘못된 요청 |
| 404 | 리소스를 찾을 수 없음 |
| 500 | 서버 내부 오류 |

## 💡 사용 예시

### React에서 API 호출 예시
```javascript
// AI 서비스 목록 조회
const fetchAIServices = async () => {
  try {
    const response = await fetch('/api/ai-services?page=1&limit=20&include_categories=true');
    const data = await response.json();
    
    if (data.success) {
      setServices(data.data.data);
      setPagination(data.data.pagination);
    }
  } catch (error) {
    console.error('API 호출 실패:', error);
  }
};

// 영상 상세 조회
const fetchVideoDetail = async (id) => {
  try {
    const response = await fetch(`/api/ai-videos/${id}`);
    const data = await response.json();
    
    if (data.success) {
      setVideo(data.data);
    }
  } catch (error) {
    console.error('영상 조회 실패:', error);
  }
};
```

## 🔄 데이터 타입 정의

### TypeScript 인터페이스
```typescript
interface AIService {
  id: number;
  ai_name: string;
  ai_description?: string;
  ai_logo?: string;
  company_name?: string;
  pricing_model?: 'free' | 'freemium' | 'paid' | 'subscription';
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  is_step_pick: boolean;
  categories?: Category[];
}

interface AIVideo {
  id: number;
  video_title: string;
  video_description?: string;
  video_url: string;
  thumbnail_url?: string;
  video_duration?: string;
  view_count: number;
  like_count: number;
  created_at: string;
  ai_services?: AIService[];
}

interface Category {
  id: number;
  category_name: string;
  category_icon?: string;
  parent_id?: number;
  children?: Category[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  industry?: string;
  job_role?: string;
  job_level?: string;
  experience_years?: number;
  user_type: 'member' | 'admin';
  user_status: 'active' | 'inactive' | 'pending' | 'deleted';
  created_at: string;
  updated_at: string;
}

interface UserSns {
  id: number;
  user_id: number;
  sns_type: 'naver' | 'kakao' | 'google';
  sns_user_id: string;
  created_at: string;
  updated_at: string;
}

interface UserWithSns extends User {
  sns_accounts?: UserSns[];
}

interface AdPartnership {
  id: number;
  company_name: string;
  contact_person: string;
  contact_email: string;
  contact_phone?: string;
  partnership_type: string;
  budget_range?: string;
  campaign_period?: string;
  target_audience?: string;
  campaign_description?: string;
  additional_requirements?: string;
  attachment_url?: string;
  inquiry_status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'completed';
  admin_notes?: string;
  response_date?: string;
  created_at: string;
  updated_at: string;
}
```

이 가이드를 참고하여 프론트엔드에서 API를 효율적으로 활용하세요.