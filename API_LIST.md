# StepAI API 리스트

## 🏠 기본 정보
- **Base URL**: `http://localhost:3004` (개발), `https://web-production-e8790.up.railway.app` (프로덕션)
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