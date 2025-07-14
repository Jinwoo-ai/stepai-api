# StepAI API 전체 목록

## 📋 API 개요

StepAI API는 AI 서비스 관리 시스템을 위한 RESTful API입니다. 모든 응답은 JSON 형식으로 반환되며, 성공 시 `success: true`, 실패 시 `success: false`를 포함합니다.

---

## 🔐 사용자 관리 API

### 사용자 생성
- **HTTP Method**: `POST`
- **Endpoint**: `/api/users`
- **Body**:
  ```json
  {
    "username": "사용자명",
    "email": "이메일",
    "password": "비밀번호",
    "user_status": "active"
  }
  ```
- **Response**: 생성된 사용자 정보

### 사용자 목록 조회
- **HTTP Method**: `GET`
- **Endpoint**: `/api/users`
- **Query Parameters**:
  - `page`: 페이지 번호 (기본값: 1)
  - `limit`: 페이지당 항목 수 (기본값: 10)
  - `user_status`: 사용자 상태 필터
- **Response**: 사용자 목록 및 페이지네이션 정보

### 사용자 조회 (ID)
- **HTTP Method**: `GET`
- **Endpoint**: `/api/users/:id`
- **Response**: 특정 사용자 정보

### 사용자 조회 (이메일)
- **HTTP Method**: `GET`
- **Endpoint**: `/api/users/email/:email`
- **Response**: 이메일로 사용자 검색 결과

### 사용자 정보 수정
- **HTTP Method**: `PUT`
- **Endpoint**: `/api/users/:id`
- **Body**: 수정할 사용자 정보
- **Response**: 수정된 사용자 정보

### 사용자 삭제
- **HTTP Method**: `DELETE`
- **Endpoint**: `/api/users/:id`
- **Response**: 삭제 성공 메시지

---

## 🤖 AI 서비스 관리 API

### AI 서비스 생성
- **HTTP Method**: `POST`
- **Endpoint**: `/api/ai-services`
- **Body**:
  ```json
  {
    "ai_name": "AI 서비스명",
    "ai_description": "AI 서비스 설명",
    "ai_type": "LLM",
    "ai_status": "active",
    "nationality": "한국",
    "category_ids": [1, 2, 3]
  }
  ```
- **Response**: 생성된 AI 서비스 정보

### AI 서비스 목록 조회
- **HTTP Method**: `GET`
- **Endpoint**: `/api/ai-services`
- **Query Parameters**:
  - `page`: 페이지 번호 (기본값: 1)
  - `limit`: 페이지당 항목 수 (기본값: 10)
  - `ai_status`: AI 서비스 상태 필터
  - `ai_type`: AI 서비스 타입 필터
  - `nationality`: 국가 필터
  - `category_id`: 카테고리 ID 필터
  - `include_contents`: 콘텐츠 정보 포함 여부 (boolean)
  - `include_tags`: 태그 정보 포함 여부 (boolean)
  - `include_categories`: 카테고리 정보 포함 여부 (boolean)
  - `include_companies`: 회사 정보 포함 여부 (boolean)
- **Response**: AI 서비스 목록 및 페이지네이션 정보 (선택한 관련 데이터 포함)

### AI 서비스 조회 (ID)
- **HTTP Method**: `GET`
- **Endpoint**: `/api/ai-services/:id`
- **Response**: 특정 AI 서비스 정보

### AI 서비스 상세 조회
- **HTTP Method**: `GET`
- **Endpoint**: `/api/ai-services/:id/detail`
- **Response**: AI 서비스 정보와 관련 콘텐츠, 태그, 카테고리, 회사 정보

### AI 서비스 검색
- **HTTP Method**: `GET`
- **Endpoint**: `/api/ai-services/search`
- **Query Parameters**:
  - `q`: 검색어 (필수)
- **Response**: 검색 결과

### AI 서비스 정보 수정
- **HTTP Method**: `PUT`
- **Endpoint**: `/api/ai-services/:id`
- **Body**: 수정할 AI 서비스 정보
- **Response**: 수정된 AI 서비스 정보

### AI 서비스 삭제
- **HTTP Method**: `DELETE`
- **Endpoint**: `/api/ai-services/:id`
- **Response**: 삭제 성공 메시지

### AI 서비스 통계
- **HTTP Method**: `GET`
- **Endpoint**: `/api/ai-services/stats/overview`
- **Response**: AI 서비스 통계 정보

---

## 📄 AI 서비스 콘텐츠 관리 API

### 콘텐츠 생성
- **HTTP Method**: `POST`
- **Endpoint**: `/api/ai-service-contents`
- **Body**:
  ```json
  {
    "ai_service_id": 1,
    "content_title": "콘텐츠 제목",
    "content_url": "콘텐츠 URL",
    "content_type": "link",
    "content_description": "콘텐츠 설명",
    "content_order_index": 1
  }
  ```
- **Response**: 생성된 콘텐츠 정보

### 콘텐츠 목록 조회
- **HTTP Method**: `GET`
- **Endpoint**: `/api/ai-service-contents`
- **Query Parameters**:
  - `page`: 페이지 번호 (기본값: 1)
  - `limit`: 페이지당 항목 수 (기본값: 10)
  - `ai_service_id`: AI 서비스 ID 필터
  - `content_type`: 콘텐츠 타입 필터
- **Response**: 콘텐츠 목록 및 페이지네이션 정보

### 콘텐츠 조회 (ID)
- **HTTP Method**: `GET`
- **Endpoint**: `/api/ai-service-contents/:id`
- **Response**: 특정 콘텐츠 정보

### 콘텐츠 정보 수정
- **HTTP Method**: `PUT`
- **Endpoint**: `/api/ai-service-contents/:id`
- **Body**: 수정할 콘텐츠 정보
- **Response**: 수정된 콘텐츠 정보

### 콘텐츠 삭제
- **HTTP Method**: `DELETE`
- **Endpoint**: `/api/ai-service-contents/:id`
- **Response**: 삭제 성공 메시지

---

## 🏷️ AI 서비스 태그 관리 API

### 태그 생성
- **HTTP Method**: `POST`
- **Endpoint**: `/api/ai-service-tags`
- **Body**:
  ```json
  {
    "ai_service_id": 1,
    "tag_name": "태그명"
  }
  ```
- **Response**: 생성된 태그 정보

### 태그 목록 조회
- **HTTP Method**: `GET`
- **Endpoint**: `/api/ai-service-tags`
- **Query Parameters**:
  - `page`: 페이지 번호 (기본값: 1)
  - `limit`: 페이지당 항목 수 (기본값: 10)
  - `ai_service_id`: AI 서비스 ID 필터
- **Response**: 태그 목록 및 페이지네이션 정보

### 태그 조회 (ID)
- **HTTP Method**: `GET`
- **Endpoint**: `/api/ai-service-tags/:id`
- **Response**: 특정 태그 정보

### 태그 정보 수정
- **HTTP Method**: `PUT`
- **Endpoint**: `/api/ai-service-tags/:id`
- **Body**: 수정할 태그 정보
- **Response**: 수정된 태그 정보

### 태그 삭제
- **HTTP Method**: `DELETE`
- **Endpoint**: `/api/ai-service-tags/:id`
- **Response**: 삭제 성공 메시지

---

## 📂 AI 카테고리 관리 API

### 카테고리 생성
- **HTTP Method**: `POST`
- **Endpoint**: `/api/ai-categories`
- **Body**:
  ```json
  {
    "category_name": "카테고리명",
    "category_icon": "아이콘 URL"
  }
  ```
- **Response**: 생성된 카테고리 정보

### 카테고리 목록 조회
- **HTTP Method**: `GET`
- **Endpoint**: `/api/ai-categories`
- **Query Parameters**:
  - `page`: 페이지 번호 (기본값: 1)
  - `limit`: 페이지당 항목 수 (기본값: 10)
- **Response**: 카테고리 목록 및 페이지네이션 정보

### 카테고리 조회 (ID)
- **HTTP Method**: `GET`
- **Endpoint**: `/api/ai-categories/:id`
- **Response**: 특정 카테고리 정보

### 카테고리 정보 수정
- **HTTP Method**: `PUT`
- **Endpoint**: `/api/ai-categories/:id`
- **Body**: 수정할 카테고리 정보
- **Response**: 수정된 카테고리 정보

### 카테고리 삭제
- **HTTP Method**: `DELETE`
- **Endpoint**: `/api/ai-categories/:id`
- **Response**: 삭제 성공 메시지

---

## 📁 파일 업로드 관리 API

### 파일 업로드
- **HTTP Method**: `POST`
- **Endpoint**: `/api/assets/upload/:type`
- **Path Parameters**:
  - `type`: 업로드 타입 (categories, companies, ai-services)
- **Body**: `multipart/form-data`
  - `file`: 업로드할 파일
- **Response**: 업로드된 파일 정보 (URL 포함)

### 파일 목록 조회
- **HTTP Method**: `GET`
- **Endpoint**: `/api/assets/list/:type`
- **Path Parameters**:
  - `type`: 파일 타입 (categories, companies, ai-services)
- **Response**: 파일 목록 및 메타데이터

### 파일 삭제
- **HTTP Method**: `DELETE`
- **Endpoint**: `/api/assets/delete/:type/:filename`
- **Path Parameters**:
  - `type`: 파일 타입
  - `filename`: 삭제할 파일명
- **Response**: 삭제 성공 메시지

### 파일 다운로드
- **HTTP Method**: `GET`
- **Endpoint**: `/assets/:type/:filename`
- **Response**: 파일 바이너리 데이터

---

## 🔍 시스템 API

### 서버 상태 확인
- **HTTP Method**: `GET`
- **Endpoint**: `/health`
- **Response**: 서버 상태, 데이터베이스 연결 상태, 환경 정보

### 기본 정보
- **HTTP Method**: `GET`
- **Endpoint**: `/`
- **Response**: API 서버 기본 정보

### 간단한 헬스체크
- **HTTP Method**: `GET`
- **Endpoint**: `/ping`
- **Response**: 서버 상태 및 업타임

---

## 📚 Swagger 문서

- **URL**: `/api-docs`
- **설명**: API 문서화 및 테스트 인터페이스

---

## 🔧 공통 응답 형식

### 성공 응답
```json
{
  "success": true,
  "data": { ... },
  "message": "성공 메시지"
}
```

### 페이지네이션 응답
```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  },
  "message": "조회 성공"
}
```

### 오류 응답
```json
{
  "success": false,
  "error": "오류 메시지"
}
```

---

## 📝 사용 예시

### 파일 업로드 후 AI 서비스 생성
1. 카테고리 아이콘 업로드: `POST /api/assets/upload/categories`
2. 회사 로고 업로드: `POST /api/assets/upload/companies`
3. AI 서비스 콘텐츠 업로드: `POST /api/assets/upload/ai-services`
4. AI 서비스 생성: `POST /api/ai-services` (업로드된 파일 URL 포함)

### AI 서비스 상세 정보 조회
- `GET /api/ai-services/1/detail` - 관련 콘텐츠, 태그, 카테고리, 회사 정보 포함

### 검색 및 필터링
- `GET /api/ai-services/search?q=ChatGPT` - AI 서비스 검색
- `GET /api/ai-services?category_id=1&ai_status=active` - 카테고리별 활성 서비스 조회 