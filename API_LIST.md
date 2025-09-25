# StepAI API 리스트

## 🏠 기본 정보
- **Base URL**: `http://localhost:3004` (개발), `http://115.85.182.98:3004` (프로덕션)
- **API 문서**: `/api-docs` (Swagger UI)
- **헬스체크**: `/health`

## 📊 대시보드 API
- **GET** `/api/dashboard/stats`
  - **설명**: 대시보드 통계 조회
  - **Response**: 
    ```json
    {
      "totalUsers": number,
      "newUsers": number,
      "totalAIServices": number,
      "totalVideos": number,
      "totalCategories": number,
      "stepPickServices": number,
      "activeServices": number,
      "totalViews": number
    }
    ```

## 📂 카테고리 관리 API
- **GET** `/api/categories`
  - **설명**: 카테고리 목록 조회 (계층 구조)
  - **Response**: 
    ```json
    {
      "success": true,
      "data": [
        {
          "id": number,
          "category_name": string,
          "parent_id": number | null,
          "category_order": number,
          "children": Category[]
        }
      ]
    }
    ```

- **POST** `/api/categories`
  - **Body**: `{ category_name: string, category_description?: string, category_icon?: string, parent_id?: number, category_order?: number }`
  - **Response**: `{ success: true, data: { id: number }, message: string }`

- **PUT** `/api/categories/{id}`
  - **Body**: `{ category_name?: string, category_description?: string, category_icon?: string, category_status?: string }`
  - **Response**: `{ success: true, message: string }`

- **DELETE** `/api/categories/{id}`
  - **설명**: 카테고리 삭제 (하위 카테고리도 함께 삭제)
  - **Response**: `{ success: true, message: string }`

- **PUT** `/api/categories/{id}/reorder`
  - **설명**: 카테고리 순서 변경 (드래그 앤 드롭 지원)
  - **Body**: `{ new_order: number, parent_id?: number }`
  - **Response**: `{ success: true, message: string }`

## 🤖 AI 서비스 관리 API
- **GET** `/api/ai-services`
  - **Query Parameters**:
    - `page`: 페이지 번호 (기본값: 1)
    - `limit`: 페이지당 항목 수 (기본값: 10)
    - `search`: 검색어 (AI 서비스명, 설명)
    - `category_id`: 카테고리 ID 필터
    - `ai_status`: 상태 필터 (active, inactive, pending, deleted)
    - `is_step_pick`: Step Pick 여부 (true, false)
    - `include_categories`: 카테고리 정보 포함 여부 (true, false)
  - **Response**: 
    ```json
    {
      "success": true,
      "data": {
        "data": AIService[],
        "pagination": {
          "page": number,
          "limit": number,
          "total": number,
          "totalPages": number
        }
      }
    }
    ```

- **POST** `/api/ai-services`
  - **Body**: 
    ```json
    {
      "ai_name": string,
      "ai_description": string,
      "ai_type": string,
      "ai_website": string,
      "ai_logo": string,
      "pricing_model": "free" | "freemium" | "paid" | "subscription",
      "pricing_info": string,
      "difficulty_level": "beginner" | "intermediate" | "advanced",
      "nationality": string,
      "categories": [{ "id": number, "is_main_category": boolean }],
      "contents": [{ "content_type": string, "content_title": string, "content_text": string }],
      "sns": [{ "sns_type": string, "sns_url": string }],
      "similar_service_ids": number[]
    }
    ```
  - **Response**: `{ success: true, data: { id: number }, message: string }`

- **PUT** `/api/ai-services/{id}`
  - **Body**: AI 서비스 수정 정보 (POST와 동일한 구조, 선택적)
  - **Response**: `{ success: true, message: string }`

- **DELETE** `/api/ai-services/{id}`
  - **설명**: AI 서비스 소프트 삭제
  - **Response**: `{ success: true, message: string }`

- **GET** `/api/ai-services/search`
  - **Query**: `q` (검색어)
  - **Response**: `{ success: true, data: AIService[] }`

- **GET** `/api/ai-services/{id}/contents`
  - **설명**: AI 서비스 콘텐츠 조회
  - **Response**: AI 서비스 콘텐츠 배열

- **POST** `/api/ai-services/{id}/contents`
  - **Body**: `{ content_type: string, content_title?: string, content_text?: string, content_order?: number }`
  - **Response**: `{ success: true, data: { id: number }, message: string }`

## 🎬 AI 영상 관리 API
- **GET** `/api/ai-videos`
  - **Query Parameters**:
    - `page`: 페이지 번호 (기본값: 1)
    - `limit`: 페이지당 항목 수 (기본값: 10)
    - `search`: 검색어 (영상 제목, 설명)
    - `category_id`: 카테고리 ID 필터
    - `video_status`: 상태 필터 (active, inactive, pending, deleted)
  - **Response**: 
    ```json
    {
      "success": true,
      "data": {
        "data": [{
          "id": number,
          "video_title": string,
          "video_description": string,
          "video_url": string,
          "thumbnail_url": string,
          "duration": number,
          "categories": Category[]
        }],
        "pagination": PaginationInfo
      }
    }
    ```

- **POST** `/api/ai-videos`
  - **Body**: 
    ```json
    {
      "video_title": string,
      "video_description": string,
      "video_url": string,
      "thumbnail_url": string,
      "duration": number,
      "categories": [{ "id": number }],
      "ai_services": [{ "id": number }]
    }
    ```
  - **Response**: `{ success: true, data: { id: number }, message: string }`

- **GET** `/api/ai-videos/{id}`
  - **설명**: AI 영상 상세 조회 (카테고리, AI 서비스 정보 포함)
  - **Response**: 
    ```json
    {
      "success": true,
      "data": {
        "id": number,
        "video_title": string,
        "categories": Category[],
        "ai_services": AIService[]
      }
    }
    ```

- **PUT** `/api/ai-videos/{id}`
  - **Body**: AI 영상 수정 정보 (POST와 동일한 구조, 선택적)
  - **Response**: `{ success: true, message: string }`

- **DELETE** `/api/ai-videos/{id}`
  - **설명**: AI 영상 소프트 삭제
  - **Response**: `{ success: true, message: string }`

## 👥 회원관리 API
- **POST** `/api/users/sns-login`
  - **설명**: SNS 로그인/회원가입 (토큰 발급)
  - **Body**: 
    ```json
    {
      "sns_type": "naver" | "kakao" | "google",
      "sns_user_id": "sns_12345",
      "name": "김철수",
      "email": "kim@naver.com",
      "industry": "IT",
      "job_role": "개발자",
      "job_level": "대리",
      "experience_years": 3
    }
    ```
  - **Response**: 
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
          "sns_accounts": [
            {
              "sns_type": "naver",
              "sns_user_id": "sns_12345"
            }
          ]
        },
        "token": "abc123...",
        "expiresAt": "2024-02-15T10:00:00Z"
      }
    }
    ```

- **POST** `/api/users/logout`
  - **설명**: 로그아웃 (토큰 무효화)
  - **Headers**: `Authorization: Bearer {token}`
  - **Response**: `{ success: true, message: string }`

- **GET** `/api/users`
  - **설명**: 회원 목록 조회 (관리자 전용)
  - **Headers**: `Authorization: Bearer {token}`
  - **Query Parameters**:
    - `page`: 페이지 번호 (기본값: 1)
    - `limit`: 페이지당 항목 수 (기본값: 20)
    - `user_type`: 사용자 타입 필터 (member, admin)
    - `user_status`: 사용자 상태 필터 (active, inactive)
    - `sns_type`: SNS 타입 필터 (naver, kakao, google)
    - `industry`: 업종 필터
    - `job_role`: 직무 필터
  - **Response**: 
    ```json
    {
      "success": true,
      "data": {
        "data": [
          {
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
                "sns_user_id": "sns_12345"
              }
            ]
          }
        ],
        "pagination": {
          "page": 1,
          "limit": 20,
          "total": 100,
          "totalPages": 5
        }
      }
    }
    ```

- **GET** `/api/users/{id}`
  - **설명**: 회원 상세 조회
  - **Headers**: `Authorization: Bearer {token}`
  - **Response**: `{ success: true, data: User }`

- **PUT** `/api/users/{id}`
  - **설명**: 회원 정보 수정
  - **Headers**: `Authorization: Bearer {token}`
  - **Body**: 
    ```json
    {
      "name": "김철수",
      "industry": "IT",
      "job_role": "시니어 개발자",
      "job_level": "과장",
      "experience_years": 5,
      "user_status": "active"
    }
    ```
  - **Response**: `{ success: true, data: User, message: string }`

- **DELETE** `/api/users/{id}`
  - **설명**: 회원 삭제 (소프트 삭제)
  - **Headers**: `Authorization: Bearer {token}`
  - **Response**: `{ success: true, message: string }`

- **GET** `/api/users/stats/overview`
  - **설명**: 회원 통계 조회
  - **Headers**: `Authorization: Bearer {token}`
  - **Response**: 
    ```json
    {
      "success": true,
      "data": {
        "total_users": 1250,
        "active_users": 1180,
        "today_signups": 15
      }
    }
    ```

## 🤝 광고제휴 관리 API
- **GET** `/api/ad-partnerships`
  - **Query Parameters**:
    - `page`: 페이지 번호 (기본값: 1)
    - `limit`: 페이지당 항목 수 (기본값: 10)
    - `partnership_type`: 제휴 유형 필터
    - `inquiry_status`: 문의 상태 필터 (pending, reviewing, approved, rejected, completed)
    - `date_from`: 시작 날짜 필터
    - `date_to`: 종료 날짜 필터
  - **Response**: 
    ```json
    {
      "success": true,
      "data": {
        "data": AdPartnership[],
        "pagination": PaginationInfo
      }
    }
    ```

- **POST** `/api/ad-partnerships`
  - **Body**: 
    ```json
    {
      "company_name": string,
      "contact_person": string,
      "contact_email": string,
      "contact_phone": string,
      "partnership_type": string,
      "budget_range": string,
      "campaign_period": string,
      "target_audience": string,
      "campaign_description": string,
      "additional_requirements": string,
      "attachment_url": string
    }
    ```
  - **Response**: `{ success: true, data: AdPartnership, message: string }`

- **GET** `/api/ad-partnerships/{id}`
  - **설명**: 광고제휴 상세 조회
  - **Response**: `{ success: true, data: AdPartnership }`

- **PUT** `/api/ad-partnerships/{id}`
  - **Body**: 광고제휴 수정 정보 (POST와 동일한 구조, 선택적)
  - **Response**: `{ success: true, data: AdPartnership, message: string }`

- **DELETE** `/api/ad-partnerships/{id}`
  - **설명**: 광고제휴 문의 삭제
  - **Response**: `{ success: true, message: string }`

- **GET** `/api/ad-partnerships/stats/status`
  - **설명**: 상태별 통계 조회
  - **Response**: 
    ```json
    {
      "success": true,
      "data": {
        "pending": number,
        "reviewing": number,
        "approved": number,
        "rejected": number,
        "completed": number
      }
    }
    ```

## 🏥 헬스체크 API
- **GET** `/health`
  - **설명**: 서버 상태 및 데이터베이스 연결 확인
  - **Response**: 
    ```json
    {
      "status": "ok" | "error",
      "timestamp": string,
      "database": "connected" | "disconnected",
      "environment": string
    }
    ```

- **GET** `/`
  - **설명**: API 정보 및 엔드포인트 목록
  - **Response**: 
    ```json
    {
      "message": "StepAI API 서버가 실행 중입니다.",
      "version": "1.0.0",
      "endpoints": {
        "docs": "/api-docs",
        "health": "/health",
        "aiServices": "/api/ai-services",
        "aiVideos": "/api/ai-videos",
        "categories": "/api/categories",
        "dashboard": "/api/dashboard"
      }
    }
    ```

## 📋 공통 응답 형식

### 성공 응답
```json
{
  "success": true,
  "data": any,
  "message": string
}
```

### 오류 응답
```json
{
  "success": false,
  "error": string
}
```

### 페이지네이션 정보
```json
{
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
}
```

## 🔍 검색 및 필터링

### AI 서비스 검색
- **텍스트 검색**: `search` 파라미터로 AI 서비스명, 설명 검색
- **카테고리 필터**: `category_id`로 특정 카테고리의 서비스만 조회
- **상태 필터**: `ai_status`로 활성/비활성 서비스 필터링
- **Step Pick 필터**: `is_step_pick`으로 추천 서비스만 조회

### AI 영상 검색
- **텍스트 검색**: `search` 파라미터로 영상 제목, 설명 검색
- **카테고리 필터**: `category_id`로 특정 카테고리의 영상만 조회
- **상태 필터**: `video_status`로 활성/비활성 영상 필터링

## 🗂️ 데이터 구조

### AI Service 객체
```typescript
interface AIService {
  id: number;
  ai_name: string;
  ai_description?: string;
  ai_type: string;
  ai_website?: string;
  ai_logo?: string;
  pricing_model?: 'free' | 'freemium' | 'paid' | 'subscription';
  pricing_info?: string;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  ai_status: 'active' | 'inactive' | 'pending' | 'deleted';
  is_visible: boolean;
  is_step_pick: boolean;
  nationality?: string;
  created_at: string;
  updated_at: string;
}
```

### AI Video 객체
```typescript
interface AIVideo {
  id: number;
  video_title: string;
  video_description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration: number;
  video_status: 'active' | 'inactive' | 'pending' | 'deleted';
  is_visible: boolean;
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
}
```

### Category 객체
```typescript
interface Category {
  id: number;
  category_name: string;
  category_description?: string;
  category_icon?: string;
  parent_id?: number;
  category_order: number;
  category_status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  children?: Category[];
}
```

### User 객체
```typescript
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
```

### AdPartnership 객체
```typescript
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