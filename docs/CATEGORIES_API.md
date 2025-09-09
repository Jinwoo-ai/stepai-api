# Categories API 문서

## 개요
카테고리 관리를 위한 API입니다. 메인 카테고리와 서브 카테고리의 계층 구조를 지원합니다.

## 엔드포인트

### 1. 카테고리 목록 조회
```
GET /api/categories
```

**응답 예시:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "category_name": "텍스트 생성",
      "category_description": "AI를 활용한 텍스트 생성 도구들",
      "category_icon": "📝",
      "parent_id": null,
      "category_order": 1,
      "category_status": "active",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z",
      "children": [
        {
          "id": 7,
          "category_name": "챗봇/대화",
          "category_description": "대화형 AI 서비스",
          "category_icon": "💬",
          "parent_id": 1,
          "category_order": 1,
          "category_status": "active",
          "created_at": "2024-01-01T00:00:00.000Z",
          "updated_at": "2024-01-01T00:00:00.000Z"
        }
      ]
    }
  ]
}
```

### 2. 카테고리 생성
```
POST /api/categories
```

**요청 본문:**
```json
{
  "category_name": "새 카테고리",
  "category_description": "카테고리 설명",
  "category_icon": "🆕",
  "parent_id": null,
  "category_order": 1
}
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "id": 123
  },
  "message": "카테고리가 생성되었습니다."
}
```

### 3. 카테고리 수정
```
PUT /api/categories/:id
```

**요청 본문:**
```json
{
  "category_name": "수정된 카테고리명",
  "category_description": "수정된 설명",
  "category_icon": "✏️",
  "category_status": "active"
}
```

### 4. 카테고리 삭제
```
DELETE /api/categories/:id
```

### 5. 카테고리 순서 변경
```
PUT /api/categories/:id/reorder
```

**요청 본문:**
```json
{
  "new_order": 2,
  "parent_id": 1
}
```

## 데이터 구조

### Category 객체
| 필드 | 타입 | 설명 | 필수 |
|------|------|------|------|
| id | number | 카테고리 ID | - |
| category_name | string | 카테고리명 | ✓ |
| category_description | string | 카테고리 설명 | - |
| category_icon | string | 카테고리 아이콘 | - |
| parent_id | number | 부모 카테고리 ID | - |
| category_order | number | 정렬 순서 | - |
| category_status | string | 상태 (active, inactive) | - |