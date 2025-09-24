# 카테고리별 AI 서비스 표시 순서 관리 API

## 📋 개요
Admin에서 각 카테고리별로 상단에 표시될 AI 서비스 20개씩을 설정하고 표시 순서를 조정할 수 있는 기능입니다.

## 🗄️ 데이터베이스 스키마

### ai_service_category_display_order 테이블
```sql
CREATE TABLE ai_service_category_display_order (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  ai_service_id INT NOT NULL,
  display_order INT NOT NULL DEFAULT 0, -- 표시 순서 (낮을수록 상단)
  is_featured BOOLEAN DEFAULT FALSE, -- 상단 고정 여부
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE,
  UNIQUE KEY unique_category_service_order (category_id, ai_service_id)
);
```

## 🔧 API 엔드포인트

### 1. 카테고리별 표시 순서 조회
```http
GET /api/category-display-order/{categoryId}?limit=20
```

**Parameters:**
- `categoryId` (path): 카테고리 ID
- `limit` (query): 조회할 서비스 수 (기본값: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "ai_service_id": 5,
      "display_order": 1,
      "is_featured": true,
      "ai_service": {
        "id": 5,
        "ai_name": "ChatGPT",
        "ai_description": "OpenAI의 대화형 AI",
        "ai_logo": "/uploads/icons/chatgpt.png",
        "company_name": "OpenAI",
        "pricing_model": "freemium",
        "difficulty_level": "beginner",
        "is_step_pick": true
      }
    }
  ]
}
```

### 2. 카테고리에 AI 서비스 추가
```http
POST /api/category-display-order/{categoryId}/services
```

**Request Body:**
```json
{
  "ai_service_id": 5,
  "display_order": 1,
  "is_featured": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "카테고리에 AI 서비스가 추가되었습니다."
}
```

### 3. 카테고리 내 서비스 순서 변경
```http
PUT /api/category-display-order/{categoryId}/reorder
```

**Request Body:**
```json
{
  "services": [
    {
      "ai_service_id": 5,
      "display_order": 1,
      "is_featured": true
    },
    {
      "ai_service_id": 3,
      "display_order": 2,
      "is_featured": false
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "순서가 성공적으로 변경되었습니다."
}
```

### 4. 카테고리에서 AI 서비스 제거
```http
DELETE /api/category-display-order/{categoryId}/services/{serviceId}
```

**Response:**
```json
{
  "success": true,
  "message": "카테고리에서 AI 서비스가 제거되었습니다."
}
```

### 5. 추가 가능한 AI 서비스 목록 조회
```http
GET /api/category-display-order/available-services?category_id=1&search=chatgpt&limit=50
```

**Parameters:**
- `category_id` (query): 카테고리 ID
- `search` (query): 검색어 (선택사항)
- `limit` (query): 조회할 서비스 수 (기본값: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "ai_name": "Claude",
      "ai_description": "Anthropic의 AI 어시스턴트",
      "ai_logo": "/uploads/icons/claude.png",
      "company_name": "Anthropic",
      "pricing_model": "freemium",
      "difficulty_level": "beginner",
      "is_step_pick": false
    }
  ]
}
```

## 🌐 프론트엔드 연동

### 카테고리 페이지에서 표시 순서 기반 조회
```http
GET /api/categories/{categoryId}/ai-services?use_display_order=true&limit=20
```

**Parameters:**
- `use_display_order=true`: 표시 순서 기반 조회 활성화
- `limit`: 조회할 서비스 수

이 파라미터를 추가하면 기존 카테고리 API에서 표시 순서를 고려한 결과를 반환합니다.

## 🛠️ 초기 설정

### 테이블 생성 및 초기화
```http
POST /api/setup/category-display-order
```

**설명**: 카테고리 표시 순서 관리에 필요한 테이블을 생성하고 기존 데이터를 마이그레이션합니다.

**Response**:
```json
{
  "success": true,
  "message": "카테고리 표시 순서 테이블이 성공적으로 설정되었습니다.",
  "data": {
    "tableExists": false,
    "hadData": false,
    "categoryStats": [
      {
        "category_name": "AI 글쓰기",
        "service_count": 15
      }
    ]
  }
}
```

### 테이블 상태 확인
```http
GET /api/setup/check-tables
```

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
      "table": "ai_service_category_display_order",
      "exists": true
    }
  ]
}
```

## 💡 사용 시나리오

### 1. Admin에서 카테고리 관리
1. **초기 설정**: 테이블 설정 버튼 클릭하여 필요한 테이블 생성
2. 카테고리 선택
3. 현재 표시 순서 조회
4. 새로운 AI 서비스 추가 (검색 후 선택)
5. 드래그 앤 드롭으로 순서 변경
6. 상단 고정(Featured) 설정
7. 변경사항 저장

### 2. 프론트엔드에서 표시
1. 카테고리 페이지 접근
2. `use_display_order=true` 파라미터로 API 호출
3. 상단 고정 서비스 우선 표시
4. 설정된 순서대로 최대 20개 표시

## 🔄 데이터 마이그레이션

기존 `ai_service_categories` 테이블의 데이터를 새로운 표시 순서 테이블로 마이그레이션:

```sql
INSERT INTO ai_service_category_display_order (category_id, ai_service_id, display_order)
SELECT 
  category_id, 
  ai_service_id, 
  ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY created_at) as display_order
FROM ai_service_categories;
```

## 📊 관리 기능

### Admin 페이지 구현 예시
```javascript
// 카테고리별 서비스 목록 조회
const fetchCategoryServices = async (categoryId) => {
  const response = await fetch(`/api/category-display-order/${categoryId}?limit=20`);
  return response.json();
};

// 순서 변경
const reorderServices = async (categoryId, services) => {
  const response = await fetch(`/api/category-display-order/${categoryId}/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ services })
  });
  return response.json();
};

// 서비스 추가
const addServiceToCategory = async (categoryId, serviceId, order) => {
  const response = await fetch(`/api/category-display-order/${categoryId}/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ai_service_id: serviceId,
      display_order: order,
      is_featured: false
    })
  });
  return response.json();
};
```

이 시스템을 통해 각 카테고리별로 최적화된 AI 서비스 목록을 관리할 수 있습니다.