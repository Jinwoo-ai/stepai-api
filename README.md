# StepAI API

StepAI API는 AI 서비스 소개 및 이용방법 추천 서비스를 위한 RESTful API 서버입니다.

## 🚀 기능

- **AI 서비스 관리**: AI 서비스 정보 및 콘텐츠 관리
- **AI 영상 관리**: AI 활용 영상 콘텐츠 관리
- **카테고리 관리**: 계층적 카테고리 구조 (메인/서브)
- **대시보드**: 통계 및 현황 조회
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

### AI 서비스 관리
- `GET /api/ai-services` - AI 서비스 목록 조회 (페이지네이션, 필터링 지원)
- `POST /api/ai-services` - AI 서비스 생성
- `PUT /api/ai-services/:id` - AI 서비스 정보 수정
- `DELETE /api/ai-services/:id` - AI 서비스 삭제 (소프트 삭제)
- `GET /api/ai-services/search` - AI 서비스 검색
- `GET /api/ai-services/:id/contents` - AI 서비스 콘텐츠 조회
- `POST /api/ai-services/:id/contents` - AI 서비스 콘텐츠 저장

### AI 영상 관리
- `GET /api/ai-videos` - AI 영상 목록 조회 (페이지네이션, 필터링 지원)
- `POST /api/ai-videos` - AI 영상 생성
- `GET /api/ai-videos/:id` - AI 영상 상세 조회
- `PUT /api/ai-videos/:id` - AI 영상 정보 수정
- `DELETE /api/ai-videos/:id` - AI 영상 삭제 (소프트 삭제)

### 카테고리 관리
- `GET /api/categories` - 카테고리 목록 조회 (계층 구조)
- `POST /api/categories` - 카테고리 생성
- `PUT /api/categories/:id` - 카테고리 수정
- `DELETE /api/categories/:id` - 카테고리 삭제
- `PUT /api/categories/:id/reorder` - 카테고리 순서 변경 (드래그 앤 드롭)

### 대시보드
- `GET /api/dashboard/stats` - 대시보드 통계 조회

### 헬스 체크
- `GET /health` - 서버 상태 확인
- `GET /` - API 정보 및 엔드포인트 목록

## 🔧 환경 설정

### 환경 변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| NODE_ENV | 실행 환경 | development |
| PORT | 서버 포트 | 3004 |
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
│   │   ├── database.ts          # 데이터베이스 설정
│   │   ├── swagger.ts           # Swagger 설정
│   │   └── upload.ts            # 파일 업로드 설정
│   ├── routes/
│   │   ├── aiServices.ts        # AI 서비스 라우터
│   │   ├── aiVideos.ts          # AI 영상 라우터
│   │   ├── categories.ts        # 카테고리 라우터
│   │   └── dashboard.ts         # 대시보드 라우터
│   ├── services/
│   │   └── userService.ts       # 사용자 서비스
│   ├── types/
│   │   └── database.ts          # 타입 정의
│   └── index.ts                 # 메인 애플리케이션
├── db/
│   ├── create_tables.sql        # 데이터베이스 스키마
│   ├── stepai_api.d2           # 데이터베이스 다이어그램
│   └── stepai_api.svg          # 데이터베이스 다이어그램 (SVG)
├── docs/                        # API 문서
├── public/assets/               # 정적 파일 (업로드된 이미지 등)
├── stepai-admin/               # 관리자 프론트엔드
├── scripts/
│   └── deploy.sh               # 배포 스크립트
├── package.json
├── tsconfig.json
├── Dockerfile                  # Docker 설정
├── railway.json               # Railway 배포 설정
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