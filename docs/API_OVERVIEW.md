# StepAI API 개요

## 프로젝트 구조
StepAI는 AI 서비스 소개 및 이용방법 추천 서비스를 위한 API입니다.

## 주요 기능
- **카테고리 관리**: 계층형 카테고리 구조 (메인/서브)
- **AI 서비스 관리**: AI 서비스 정보, 콘텐츠, SNS 링크 관리
- **영상 콘텐츠 관리**: YouTube 영상과 AI 서비스 연결

## API 엔드포인트 구조

### 1. Categories API (`/api/categories`)
- 계층형 카테고리 관리
- 드래그 앤 드롭 순서 변경 지원
- 메인/서브 카테고리 구조

### 2. AI Services API (`/api/ai-services`)
- AI 서비스 CRUD 작업
- 카테고리 연결 (다중 선택, 메인 카테고리 지정)
- 리치 콘텐츠 관리
- SNS 링크 관리
- 유사 서비스 연결

### 3. AI Videos API (`/api/ai-videos`)
- YouTube 영상 관리
- 카테고리 및 AI 서비스 연결
- 자동 썸네일 생성

## 공통 응답 형식

### 성공 응답
```json
{
  "success": true,
  "data": { ... },
  "message": "작업이 완료되었습니다."
}
```

### 페이지네이션 응답
```json
{
  "success": true,
  "data": {
    "data": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

### 에러 응답
```json
{
  "success": false,
  "error": "오류 메시지"
}
```

## 데이터베이스 관계

### 핵심 엔티티
- **Categories**: 계층형 카테고리 (parent_id로 계층 구조)
- **AI Services**: AI 서비스 정보
- **AI Videos**: YouTube 영상 정보

### 관계 테이블
- **ai_service_categories**: AI 서비스 ↔ 카테고리 (다대다, 메인 카테고리 지정)
- **ai_video_categories**: AI 영상 ↔ 카테고리 (다대다)
- **ai_video_services**: AI 영상 ↔ AI 서비스 (다대다, 사용 순서)
- **ai_service_contents**: AI 서비스 콘텐츠 (target_users, main_features, use_cases)
- **ai_service_sns**: AI 서비스 SNS 링크

## 환경 설정

### 필수 환경 변수
```env
NODE_ENV=development
PORT=3004
DB_HOST=your-db-host
DB_PORT=3306
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
```

### 데이터베이스 설정
- MySQL 8.0 이상 또는 MariaDB 10.3 이상
- UTF8MB4 문자셋 사용
- 타임존: Asia/Seoul (+09:00)

## 관리자 인터페이스 연동

### 포트 설정
- API 서버: 포트 3004
- 관리자 인터페이스: API_BASE_URL = 'http://localhost:3004'

### 주요 기능
1. **카테고리 관리**
   - 드래그 앤 드롭으로 순서 변경
   - 메인/서브 카테고리 추가
   - 상태 토글 (active/inactive)

2. **AI 서비스 관리**
   - 기본 정보 입력
   - 카테고리 다중 선택 (메인 카테고리 지정)
   - ReactQuill로 리치 콘텐츠 작성
   - SNS 링크 관리
   - 유사 서비스 검색 및 연결

3. **영상 콘텐츠 관리**
   - YouTube URL 입력 및 미리보기
   - 자동 썸네일 생성
   - 카테고리 및 AI 서비스 연결
   - 리치 에디터로 설명 작성

## 보안 및 검증

### 입력 검증
- 필수 필드 검증
- URL 형식 검증
- SQL 인젝션 방지 (Prepared Statements)

### 에러 처리
- 트랜잭션 롤백
- 상세한 에러 메시지
- HTTP 상태 코드 준수

## 성능 최적화

### 데이터베이스 인덱스
- 카테고리: parent_id, category_status
- AI 서비스: ai_status, ai_type, nationality
- 관계 테이블: 외래 키 인덱스

### 페이지네이션
- 기본 페이지 크기: 10개
- 최대 페이지 크기: 100개
- OFFSET/LIMIT 사용

## 향후 확장 계획
- 파일 업로드 API
- 사용자 인증/권한 관리
- 통계 및 분석 API
- 검색 엔진 최적화