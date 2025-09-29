# 엑셀 업로드 기능 호환성 가이드

## 📋 개요
StepAI API의 엑셀 업로드 기능은 XLSX 라이브러리 v0.18.5를 사용하여 다양한 엑셀 파일 형식을 지원합니다.

## ✅ 지원하는 파일 형식

### 1. Excel 2007+ (.xlsx) - **권장**
- **호환성**: 완벽 지원
- **특징**: 최신 Excel 형식, 대용량 데이터 지원
- **권장 이유**: 가장 안정적이고 기능이 풍부함

### 2. Excel 97-2003 (.xls)
- **호환성**: 완벽 지원
- **특징**: 구형 Excel 형식
- **제한사항**: 65,536행 제한

### 3. Excel Binary (.xlsb)
- **호환성**: 완벽 지원
- **특징**: 바이너리 형식으로 파일 크기가 작음
- **용도**: 대용량 데이터 처리 시 유용

### 4. CSV (.csv)
- **호환성**: 완벽 지원
- **특징**: 텍스트 기반 형식
- **제한사항**: 서식 정보 없음

## 🔧 기술적 특징

### 파일 크기 제한
- **Multer 설정**: 기본적으로 제한 없음
- **테스트 결과**: 1000행 데이터 (1.3MB) 정상 처리
- **권장**: 10MB 이하 파일 사용

### 문자 인코딩
- **한글 지원**: 완벽 지원
- **특수 문자**: 이모지, 특수 기호 지원
- **인코딩**: UTF-8 자동 처리

### 빈 셀 처리
- **빈 문자열**: `""` 로 처리
- **null 값**: `undefined` 로 처리
- **undefined 값**: `undefined` 로 처리

## 📝 업로드 요구사항

### 필수 조건
1. **인증**: 관리자 토큰 필요
2. **Content-Type**: `multipart/form-data`
3. **필드명**: `excel`
4. **필수 컬럼**: `서비스명(국문)`, `형태`

### 올바른 업로드 방법
```bash
curl 'http://localhost:3004/api/ai-services/upload-excel' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN' \
  -F 'excel=@your_file.xlsx'
```

### 잘못된 업로드 방법
```bash
# ❌ Content-Type을 application/json으로 설정
curl 'http://localhost:3004/api/ai-services/upload-excel' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  --data-raw 'binary_data'
```

## 🚨 일반적인 오류 및 해결방법

### 1. 500 Internal Server Error
**원인**: 
- 관리자 인증 실패
- 데이터베이스 연결 오류
- 필수 컬럼 누락

**해결방법**:
```bash
# 1. 관리자 로그인으로 토큰 획득
curl -X POST 'http://localhost:3004/api/admin/login' \
  -H 'Content-Type: application/json' \
  -d '{"email": "admin@stepai.com", "password": "stepai1234"}'

# 2. 올바른 multipart/form-data 형식 사용
curl 'http://localhost:3004/api/ai-services/upload-excel' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -F 'excel=@file.xlsx'
```

### 2. 파일 형식 오류
**원인**: 지원하지 않는 파일 확장자

**해결방법**: `.xlsx`, `.xls`, `.xlsb` 확장자 사용

### 3. 데이터 처리 오류
**원인**: 
- 필수 컬럼 누락
- 잘못된 데이터 형식
- 참조 무결성 위반

**해결방법**: 
- 템플릿 파일 사용
- 데이터 검증 후 업로드

## 📊 성능 최적화

### 배치 처리
- **배치 크기**: 5개 행씩 처리
- **트랜잭션**: 배치별 트랜잭션 관리
- **타임아웃**: 5분 설정

### 권장사항
1. **파일 크기**: 10MB 이하
2. **행 수**: 1000행 이하 권장
3. **형식**: .xlsx 형식 사용
4. **데이터 검증**: 업로드 전 필수 컬럼 확인

## 🔍 디버깅 가이드

### 로그 확인
```bash
# API 서버 로그 확인
npm run pm2:logs

# 또는 개발 모드에서 실시간 로그
npm run dev
```

### 테스트 파일 생성
```javascript
// 테스트용 엑셀 파일 생성
node test_excel_upload.js
```

### 데이터베이스 확인
```sql
-- 업로드된 데이터 확인
SELECT * FROM ai_services ORDER BY created_at DESC LIMIT 10;

-- 관련 테이블 확인
SELECT * FROM ai_service_categories WHERE ai_service_id = YOUR_SERVICE_ID;
SELECT * FROM ai_service_tags WHERE ai_service_id = YOUR_SERVICE_ID;
```

## 📋 체크리스트

업로드 전 확인사항:
- [ ] 관리자 토큰 유효성 확인
- [ ] 파일 형식 확인 (.xlsx, .xls, .xlsb)
- [ ] 필수 컬럼 존재 확인 (서비스명(국문), 형태)
- [ ] 파일 크기 확인 (10MB 이하)
- [ ] multipart/form-data 형식 사용
- [ ] 필드명 'excel' 사용

## 🆕 최신 업데이트

### v1.0 (2024-09-30)
- ID 기반 업데이트/생성 지원
- 유사 서비스 연결 기능
- 배치 처리로 성능 최적화
- 상세한 오류 메시지 제공
- 다양한 엑셀 형식 지원 확인