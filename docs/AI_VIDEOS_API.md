# AI Videos API 문서

## 개요
AI 영상 콘텐츠 관리를 위한 API입니다. YouTube 영상을 등록하고 카테고리 및 관련 AI 서비스와 연결할 수 있습니다.

## 엔드포인트

### 1. AI 영상 목록 조회
```
GET /api/ai-videos
```

**쿼리 파라미터:**
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 10)
- `search`: 검색어 (영상 제목, 설명에서 검색)
- `category_id`: 카테고리 ID 필터
- `video_status`: 상태 필터 (active, inactive, pending, deleted)

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "video_title": "ChatGPT 사용법 완벽 가이드",
        "video_description": "<p>ChatGPT를 효과적으로 사용하는 방법을 알아보세요</p>",
        "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "thumbnail_url": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        "duration": 600,
        "video_status": "active",
        "is_visible": true,
        "view_count": 1500,
        "like_count": 120,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
        "categories": [
          {
            "id": 7,
            "category_name": "챗봇/대화"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

### 2. AI 영상 생성
```
POST /api/ai-videos
```

**요청 본문:**
```json
{
  "video_title": "새로운 AI 영상",
  "video_description": "<p>영상 설명입니다</p>",
  "video_url": "https://www.youtube.com/watch?v=example",
  "thumbnail_url": "https://img.youtube.com/vi/example/maxresdefault.jpg",
  "duration": 300,
  "video_status": "active",
  "is_visible": true,
  "categories": [
    {
      "id": 1
    },
    {
      "id": 7
    }
  ],
  "ai_services": [
    {
      "id": 1
    },
    {
      "id": 2
    }
  ]
}
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "id": 123
  },
  "message": "AI 영상이 생성되었습니다."
}
```

### 3. AI 영상 수정
```
PUT /api/ai-videos/:id
```

**요청 본문:** (생성과 동일한 구조, 수정할 필드만 포함)

**응답 예시:**
```json
{
  "success": true,
  "message": "AI 영상이 수정되었습니다."
}
```

### 4. AI 영상 삭제
```
DELETE /api/ai-videos/:id
```

**응답 예시:**
```json
{
  "success": true,
  "message": "AI 영상이 삭제되었습니다."
}
```

### 5. AI 영상 상세 조회
```
GET /api/ai-videos/:id
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "video_title": "ChatGPT 사용법 완벽 가이드",
    "video_description": "<p>ChatGPT를 효과적으로 사용하는 방법을 알아보세요</p>",
    "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "thumbnail_url": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    "duration": 600,
    "video_status": "active",
    "is_visible": true,
    "view_count": 1500,
    "like_count": 120,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z",
    "categories": [
      {
        "id": 7,
        "category_name": "챗봇/대화"
      }
    ],
    "ai_services": [
      {
        "id": 1,
        "ai_name": "ChatGPT",
        "usage_order": 1
      }
    ]
  }
}
```

## 데이터 구조

### AIVideo 객체
| 필드 | 타입 | 설명 | 필수 |
|------|------|------|------|
| id | number | 영상 ID | - |
| video_title | string | 영상 제목 | ✓ |
| video_description | string | 영상 설명 (HTML) | - |
| video_url | string | YouTube URL | ✓ |
| thumbnail_url | string | 썸네일 URL | - |
| duration | number | 영상 길이 (초) | - |
| video_status | string | 상태 (active, inactive, pending, deleted) | - |
| is_visible | boolean | 사이트 노출 여부 | - |
| view_count | number | 조회수 | - |
| like_count | number | 좋아요 수 | - |
| categories | Category[] | 연결된 카테고리 | - |
| ai_services | AIService[] | 관련 AI 서비스 | - |

### VideoCategory 객체
| 필드 | 타입 | 설명 |
|------|------|------|
| id | number | 카테고리 ID |
| category_name | string | 카테고리명 |

### VideoAIService 객체
| 필드 | 타입 | 설명 |
|------|------|------|
| id | number | AI 서비스 ID |
| ai_name | string | AI 서비스명 |
| usage_order | number | 사용 순서 |

## YouTube 통합 기능

### URL 형식 지원
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`

### 자동 썸네일 생성
YouTube URL 입력 시 자동으로 썸네일 URL 생성:
```
https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg
```

## 사용 예시

### 관리자 인터페이스에서 영상 관리
1. YouTube URL 입력 시 미리보기 제공
2. 자동 썸네일 생성
3. 카테고리 다중 선택
4. 관련 AI 서비스 검색 및 연결
5. 리치 에디터로 영상 설명 작성
6. 사이트 노출 여부 설정

### 프론트엔드에서 영상 표시
1. 썸네일로 영상 목록 표시
2. 카테고리별 필터링
3. 관련 AI 서비스 정보 함께 표시
4. YouTube 임베드로 영상 재생