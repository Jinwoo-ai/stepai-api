# StepAI API

StepAI API는 AI 서비스 관리 시스템을 위한 RESTful API 서버입니다.

## 🚀 기능

- **사용자 관리**: 사용자 CRUD 작업
- **AI 서비스 관리**: AI 서비스 정보 관리
- **콘텐츠 관리**: AI 서비스별 콘텐츠 관리
- **태그 관리**: AI 서비스 태그 관리
- **파일 업로드**: 이미지 및 파일 업로드 관리
- **페이지네이션**: 대용량 데이터 처리
- **필터링**: 다양한 조건으로 데이터 검색
- **환경별 설정**: 개발, 스테이징, 프로덕션 환경 지원

## 📋 요구사항

- Node.js 18.0.0 이상
- MySQL 8.0 이상
- TypeScript 5.3.2 이상

## 🛠️ 설치

1. 저장소 클론
```bash
git clone <repository-url>
cd stepai_api
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
```bash
cp env.example .env
# .env 파일을 편집하여 데이터베이스 설정을 구성하세요
```

4. 데이터베이스 설정
```bash
# MySQL에 접속하여 데이터베이스 생성
mysql -u root -p
CREATE DATABASE stepai_dev;
CREATE DATABASE stepai_staging;
CREATE DATABASE stepai_prod;

# 테이블 생성
mysql -u root -p stepai_dev < db/create_tables.sql
```

## 🚀 실행

### 개발 모드
```bash
npm run dev
```

### 프로덕션 모드
```bash
npm run build
npm start
```

## 📊 API 엔드포인트

### 사용자 관리
- `POST /api/users` - 사용자 생성
- `GET /api/users` - 사용자 목록 조회
- `GET /api/users/:id` - 사용자 조회 (ID)
- `GET /api/users/email/:email` - 사용자 조회 (이메일)
- `PUT /api/users/:id` - 사용자 정보 수정
- `DELETE /api/users/:id` - 사용자 삭제

### AI 서비스 관리
- `POST /api/ai-services` - AI 서비스 생성
- `GET /api/ai-services` - AI 서비스 목록 조회
- `GET /api/ai-services/:id` - AI 서비스 조회
- `PUT /api/ai-services/:id` - AI 서비스 정보 수정
- `DELETE /api/ai-services/:id` - AI 서비스 삭제
- `GET /api/ai-services/stats/overview` - AI 서비스 통계

### 파일 업로드 관리
- `POST /api/assets/upload/:type` - 파일 업로드 (categories, companies, ai-services)
- `GET /api/assets/list/:type` - 파일 목록 조회
- `DELETE /api/assets/delete/:type/:filename` - 파일 삭제
- `GET /assets/:type/:filename` - 파일 다운로드

### 헬스 체크
- `GET /health` - 서버 상태 확인

## 🔧 환경 설정

### 환경 변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| NODE_ENV | 실행 환경 | development |
| PORT | 서버 포트 | 3000 |
| DB_HOST | 데이터베이스 호스트 | localhost |
| DB_PORT | 데이터베이스 포트 | 3306 |
| DB_USER | 데이터베이스 사용자 | root |
| DB_PASSWORD | 데이터베이스 비밀번호 | - |
| DB_NAME | 데이터베이스 이름 | stepai_dev |

### 환경별 설정

#### 개발 환경
```bash
NODE_ENV=development
DB_NAME=stepai_dev
```

#### 스테이징 환경
```bash
NODE_ENV=staging
DB_NAME=stepai_staging
```

#### 프로덕션 환경
```bash
NODE_ENV=production
DB_NAME=stepai_prod
```

## 📁 프로젝트 구조

```
stepai_api/
├── src/
│   ├── configs/
│   │   └── database.ts          # 데이터베이스 설정
│   ├── services/
│   │   ├── userService.ts       # 사용자 서비스
│   │   ├── aiService.ts         # AI 서비스
│   │   ├── aiServiceContent.ts  # AI 서비스 콘텐츠
│   │   └── aiServiceTag.ts      # AI 서비스 태그
│   ├── routes/
│   │   ├── users.ts             # 사용자 라우터
│   │   └── aiServices.ts        # AI 서비스 라우터
│   ├── types/
│   │   └── database.ts          # 타입 정의
│   └── index.ts                 # 메인 애플리케이션
├── db/
│   └── create_tables.sql        # 데이터베이스 스키마
├── package.json
├── tsconfig.json
└── README.md
```

## 🧪 테스트

```bash
npm test
```

## 📝 로그

서버는 Morgan을 사용하여 HTTP 요청 로그를 기록합니다.

## 🔒 보안

- Helmet을 사용한 보안 헤더 설정
- CORS 설정
- SQL 인젝션 방지 (Prepared Statements)
- 입력 검증

## 🤝 기여

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 지원

문제가 있거나 질문이 있으시면 이슈를 생성해 주세요. 