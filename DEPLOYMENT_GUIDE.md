# StepAI API 배포 가이드

## 물리 서버 배포 설정

### 1. 환경변수 설정

서버에서 다음 환경변수들을 설정해야 합니다:

#### 데이터베이스 설정
```
DB_HOST=resource.local.topialive.co.kr
DB_PORT=13001
DB_USER=admin
DB_PASSWORD=spib5aslzaspIdude3r8
DB_NAME=STEPAI
```

#### 서버 설정
```
NODE_ENV=production
PORT=3004
```

#### AWS S3 설정 (파일 업로드용)
```
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET=stepai-uploads
```

### 2. AWS S3 설정

1. AWS 계정 생성 및 IAM 사용자 생성
2. S3 버킷 생성 (예: stepai-uploads)
3. IAM 사용자에게 S3 권한 부여
4. Access Key ID와 Secret Access Key 생성
5. 서버 환경변수에 추가

### 3. 파일 업로드 API 엔드포인트

#### 로컬 파일 업로드 (개발용)
```
POST /api/ai-services/upload-icon
Content-Type: multipart/form-data
Body: icon (file)
```

#### AWS S3 업로드 (프로덕션용)
```
POST /api/ai-services/upload-icon-s3
Content-Type: multipart/form-data
Body: icon (file)
```

### 4. 배포 후 확인사항

1. 헬스체크: `GET /health`
2. API 문서: `GET /api-docs`
3. 파일 업로드 테스트: `POST /api/ai-services/upload-icon-s3`

### 5. 파일 업로드 문제 해결

물리 서버에서는:
- 로컬 파일 업로드가 안정적으로 작동
- 파일이 영구적으로 저장됨
- 추가 CDN 설정 불필요

### 6. 관리자 페이지 설정

관리자 페이지에서 파일 업로드 시:
- 개발환경: `/api/ai-services/upload-icon` 사용
- 모든 환경: `/api/ai-services/upload-icon` 사용

환경에 따라 자동으로 엔드포인트를 선택하도록 프론트엔드 수정 필요.