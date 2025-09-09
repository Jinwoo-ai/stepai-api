# AI Services API 문서

## 개요
AI 서비스 관리를 위한 API입니다. AI 서비스의 CRUD 작업과 카테고리 연결, 콘텐츠 관리를 지원합니다.

## 엔드포인트

### 1. AI 서비스 목록 조회
```
GET /api/ai-services
```

**쿼리 파라미터:**
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 10)
- `search`: 검색어 (AI 서비스명, 설명에서 검색)
- `category_id`: 카테고리 ID 필터
- `ai_status`: 상태 필터 (active, inactive, pending, deleted)
- `is_step_pick`: Step Pick 필터 (true, false)
- `include_categories`: 카테고리 정보 포함 여부 (true, false)

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "ai_name": "ChatGPT",
        "ai_description": "OpenAI의 대화형 AI",
        "ai_type": "LLM",
        "ai_website": "https://chat.openai.com",
        "ai_logo": null,
        "pricing_model": "freemium",
        "pricing_info": "무료 플랜과 유료 플랜 제공",
        "difficulty_level": "beginner",
        "ai_status": "active",
        "is_visible": true,
        "is_step_pick": true,
        "nationality": "US",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
        "categories": [
          {
            "id": 7,
            "category_name": "챗봇/대화",
            "is_main_category": true
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

### 2. AI 서비스 생성
```
POST /api/ai-services
```

**요청 본문:**
```json
{
  "ai_name": "새로운 AI 서비스",
  "ai_description": "AI 서비스 설명",
  "ai_type": "LLM",
  "ai_website": "https://example.com",
  "ai_logo": "https://example.com/logo.png",
  "pricing_model": "free",
  "pricing_info": "완전 무료",
  "difficulty_level": "beginner",
  "ai_status": "active",
  "is_visible": true,
  "is_step_pick": false,
  "nationality": "KR",
  "categories": [
    {
      "id": 1,
      "is_main_category": true
    },
    {
      "id": 7,
      "is_main_category": false
    }
  ],
  "contents": [
    {
      "content_type": "target_users",
      "content_title": "대상 사용자",
      "content_text": "<p>개발자, 연구자</p>",
      "content_order": 1
    }
  ],
  "sns": [
    {
      "sns_type": "twitter",
      "sns_url": "https://twitter.com/example",
      "sns_order": 1
    }
  ],
  "similar_service_ids": [2, 3]
}
```

### 3. AI 서비스 수정
```
PUT /api/ai-services/:id
```

**요청 본문:** (생성과 동일한 구조, 수정할 필드만 포함)

### 4. AI 서비스 삭제
```
DELETE /api/ai-services/:id
```

### 5. AI 서비스 검색
```
GET /api/ai-services/search?q=검색어
```

**응답 예시:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "ai_name": "ChatGPT"
    }
  ]
}
```

### 6. AI 서비스 콘텐츠 저장
```
POST /api/ai-services/contents
```

**요청 본문:**
```json
{
  "ai_service_id": 1,
  "content_type": "target_users",
  "content_title": "대상 사용자",
  "content_text": "<p>개발자, 연구자, 학생</p>",
  "content_order": 1
}
```

### 7. 카테고리 목록 조회 (관리자용)
```
GET /api/ai-services/categories
```

## 데이터 구조

### AIService 객체
| 필드 | 타입 | 설명 | 필수 |
|------|------|------|------|
| id | number | AI 서비스 ID | - |
| ai_name | string | AI 서비스명 | ✓ |
| ai_description | string | AI 서비스 설명 | - |
| ai_type | string | AI 서비스 타입 | ✓ |
| ai_website | string | 웹사이트 URL | - |
| ai_logo | string | 로고 URL | - |
| pricing_model | string | 가격 모델 (free, freemium, paid, subscription) | - |
| pricing_info | string | 가격 정보 | - |
| difficulty_level | string | 난이도 (beginner, intermediate, advanced) | - |
| ai_status | string | 상태 (active, inactive, pending, deleted) | - |
| is_visible | boolean | 사이트 노출 여부 | - |
| is_step_pick | boolean | Step Pick 여부 | - |
| nationality | string | 국가 코드 | - |
| categories | Category[] | 연결된 카테고리 | - |

### AIServiceContent 객체
| 필드 | 타입 | 설명 |
|------|------|------|
| content_type | string | 콘텐츠 타입 (target_users, main_features, use_cases) |
| content_title | string | 콘텐츠 제목 |
| content_text | string | 콘텐츠 내용 (HTML) |
| content_order | number | 정렬 순서 |

## 사용 예시

### 관리자 인터페이스에서 AI 서비스 관리
1. 목록 조회 시 카테고리 정보 포함하여 표시
2. 검색 기능으로 AI 서비스 빠른 찾기
3. 카테고리별 필터링
4. Step Pick 상태 토글
5. 리치 에디터로 콘텐츠 작성