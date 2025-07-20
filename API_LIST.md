# StepAI API 리스트

## 인증 API
- POST /api/auth/login
  - Body: { email: string, password: string }
  - Response: { token: string, user: object }

## 사용자 관리 API
- GET /api/users
  - Query: page, limit, user_type, user_status
  - Response: { data: User[], pagination: object }

- POST /api/users
  - Body: { username: string, email: string, password: string, user_type: string }
  - Response: { data: User }

- GET /api/users/{id}
  - Response: { data: User }

- PUT /api/users/{id}
  - Body: { username?: string, email?: string, user_type?: string, user_status?: string }
  - Response: { data: User }

- DELETE /api/users/{id}
  - Response: { message: string }

## 그룹 관리 API
- GET /api/groups
  - Query: page, limit, group_status
  - Response: { data: Group[], pagination: object }

- POST /api/groups
  - Body: { group_name: string, group_description?: string, group_logo?: string, group_website?: string, group_email?: string, group_phone?: string, group_address?: string }
  - Response: { data: Group }

- GET /api/groups/{id}
  - Response: { data: Group }

- PUT /api/groups/{id}
  - Body: { group_name?: string, group_description?: string, group_logo?: string, group_website?: string, group_email?: string, group_phone?: string, group_address?: string, group_status?: string }
  - Response: { data: Group }

- DELETE /api/groups/{id}
  - Response: { message: string }

## 전문가 관리 API
- GET /api/experts
  - Query: page, limit, expert_status, group_id
  - Response: { data: Expert[], pagination: object }

- POST /api/experts
  - Body: { user_id: number, group_id?: number, expert_name: string, expert_title?: string, expert_bio?: string, expert_avatar?: string, expert_website?: string, expert_email?: string, expert_phone?: string, expert_location?: string }
  - Response: { data: Expert }

- GET /api/experts/{id}
  - Response: { data: Expert }

- PUT /api/experts/{id}
  - Body: { expert_name?: string, expert_title?: string, expert_bio?: string, expert_avatar?: string, expert_website?: string, expert_email?: string, expert_phone?: string, expert_location?: string, expert_status?: string }
  - Response: { data: Expert }

- DELETE /api/experts/{id}
  - Response: { message: string }

## 콘텐츠 관리 API
- GET /api/contents
  - Query: page, limit, content_status, content_type, expert_id
  - Response: { data: Content[], pagination: object }

- POST /api/contents
  - Body: { content_title: string, content_description?: string, content_url?: string, content_type: string, content_order_index?: number }
  - Response: { data: Content }

- GET /api/contents/{id}
  - Response: { data: Content }

- PUT /api/contents/{id}
  - Body: { content_title?: string, content_description?: string, content_url?: string, content_type?: string, content_order_index?: number, content_status?: string }
  - Response: { data: Content }

- DELETE /api/contents/{id}
  - Response: { message: string }

## AI 서비스 관리 API
- GET /api/ai-services
  - Query: page, limit, ai_status, ai_type, nationality, category_id, include_contents, include_tags, include_categories, include_companies
  - Response: { data: AIService[], pagination: object }

- POST /api/ai-services
  - Body: { ai_name: string, ai_description?: string, ai_type: string, ai_status?: string, nationality?: string, category_ids?: number[] }
  - Response: { data: AIService }

- GET /api/ai-services/{id}
  - Response: { data: AIService }

- GET /api/ai-services/{id}/detail
  - Response: { data: AIService with related data }

- PUT /api/ai-services/{id}
  - Body: { ai_name?: string, ai_description?: string, ai_type?: string, ai_status?: string, nationality?: string }
  - Response: { data: AIService }

- DELETE /api/ai-services/{id}
  - Response: { message: string }

- GET /api/ai-services/search
  - Query: q (검색어)
  - Response: { data: AIService[] }

- GET /api/ai-services/stats/overview
  - Response: { data: object }

## 파일 업로드 관리 API
- POST /api/assets/upload/{type}
  - Path: type (categories, companies, ai-services)
  - Body: multipart/form-data with file
  - Response: { data: { filename, originalName, size, url, type } }

- GET /api/assets/list/{type}
  - Path: type (categories, companies, ai-services)
  - Response: { data: FileInfo[] }

- DELETE /api/assets/delete/{type}/{filename}
  - Path: type, filename
  - Response: { message: string }

## 랭킹 시스템 API

### 랭킹 조회
- GET /api/rankings/{type}
  - Path: type (ai_service, content, expert, category)
  - Query: date_from, date_to, limit
  - Response: { data: RankingResult[] }

### 랭킹 계산 및 저장
- POST /api/rankings/calculate
  - Body: { date_from?: string, date_to?: string }
  - Response: { message: string }

### 랭킹 가중치 관리
- GET /api/rankings/weights/{type}
  - Path: type (ai_service, content, expert, category)
  - Response: { data: RankingWeight[] }

- PUT /api/rankings/weights
  - Body: { ranking_type: string, weight_name: string, weight_value: number, weight_description?: string }
  - Response: { message: string }

### 콘텐츠 조회 기록
- POST /api/rankings/record-view
  - Body: { content_id: number, user_id?: number, ip_address?: string, user_agent?: string }
  - Response: { message: string }

## 랭킹 시스템 설명

### 랭킹 타입별 계산 요소

#### AI 서비스 랭킹
- 조회수 (30%)
- 매칭 요청수 (40%)
- 평점 (30%)

#### 콘텐츠 랭킹
- 조회수 (50%)
- 평점 (50%)

#### 전문가 랭킹
- 콘텐츠 수 (25%)
- 매칭 요청수 (35%)
- 평점 (40%)

#### 카테고리 랭킹
- 콘텐츠 수 (40%)
- 조회수 (30%)
- 평점 (30%)

### 가중치 조정 방법
랭킹 가중치는 `/api/rankings/weights` API를 통해 실시간으로 조정할 수 있습니다.

예시:
```json
{
  "ranking_type": "ai_service",
  "weight_name": "view_weight",
  "weight_value": 0.400,
  "weight_description": "조회수 가중치를 40%로 증가"
}
```

### 랭킹 계산 주기
- 실시간: 콘텐츠 조회 시 자동 기록
- 수동: `/api/rankings/calculate` API 호출
- 자동: 스케줄러를 통한 주기적 계산 (추후 구현 예정)

### 파일 업로드 지원 형식
- 이미지: jpeg, jpg, png, gif, webp
- 아이콘: ico, svg
- 최대 파일 크기: 10MB 