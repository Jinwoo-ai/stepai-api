# 🚀 StepAI API 배포 가이드

## 📋 배포 전 준비사항

### 1. 환경 변수 설정
다음 환경 변수들을 설정해야 합니다:

```bash
# 데이터베이스 설정
DB_HOST=your-database-host
DB_PORT=3306
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=your-database-name

# 서버 설정
NODE_ENV=production
PORT=3000
```

### 2. 데이터베이스 준비
- MySQL 데이터베이스 생성
- `db/create_tables.sql` 실행하여 테이블 생성

## 🎯 배포 플랫폼별 가이드

### 1. Railway (추천)

**장점:**
- Vercel과 가장 유사한 경험
- 무료 티어 제공
- GitHub 연동 자동 배포
- 데이터베이스도 함께 제공

**배포 단계:**
1. [Railway](https://railway.app) 가입
2. GitHub 저장소 연결
3. 새 프로젝트 생성
4. 환경 변수 설정
5. 자동 배포 완료

### 2. Render

**장점:**
- 무료 티어 제공
- PostgreSQL 데이터베이스 포함
- GitHub 연동 자동 배포

**배포 단계:**
1. [Render](https://render.com) 가입
2. GitHub 저장소 연결
3. Web Service 생성
4. 환경 변수 설정
5. 자동 배포 완료

### 3. Heroku

**배포 단계:**
1. [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) 설치
2. Heroku 계정 생성
3. 다음 명령어 실행:

```bash
# Heroku 로그인
heroku login

# 새 앱 생성
heroku create your-app-name

# 환경 변수 설정
heroku config:set NODE_ENV=production
heroku config:set DB_HOST=your-db-host
heroku config:set DB_USER=your-db-user
heroku config:set DB_PASSWORD=your-db-password
heroku config:set DB_NAME=your-db-name

# 배포
git push heroku main
```

### 4. DigitalOcean App Platform

**배포 단계:**
1. [DigitalOcean](https://www.digitalocean.com) 계정 생성
2. App Platform에서 새 앱 생성
3. GitHub 저장소 연결
4. 환경 변수 설정
5. 배포 완료

## 🔧 로컬 테스트

배포 전 로컬에서 테스트:

```bash
# 의존성 설치
npm install

# 빌드
npm run build

# 프로덕션 모드로 실행
NODE_ENV=production npm start
```

## 📊 배포 후 확인사항

1. **헬스체크**: `https://your-domain.com/health`
2. **API 문서**: `https://your-domain.com/api-docs`
3. **기본 엔드포인트**: `https://your-domain.com/`

## 🛠️ 문제 해결

### 데이터베이스 연결 오류
- 환경 변수가 올바르게 설정되었는지 확인
- 데이터베이스가 외부 접속을 허용하는지 확인
- 방화벽 설정 확인

### 포트 오류
- `PORT` 환경 변수가 올바르게 설정되었는지 확인
- 플랫폼에서 지정한 포트 사용

### 빌드 오류
- `package.json`의 스크립트가 올바른지 확인
- TypeScript 컴파일 오류 확인

## 🔒 보안 고려사항

1. **환경 변수**: 민감한 정보는 환경 변수로 관리
2. **CORS**: 필요한 도메인만 허용
3. **Rate Limiting**: API 요청 제한 설정
4. **HTTPS**: SSL 인증서 설정

## 📈 모니터링

배포 후 다음을 모니터링하세요:
- 서버 응답 시간
- 에러 로그
- 데이터베이스 성능
- API 사용량 