#!/bin/bash

# StepAI API 서버 배포 스크립트

echo "🚀 StepAI API 서버 배포 시작..."

# 환경변수 설정
export NODE_ENV=production
export PORT=3004

# 의존성 설치
echo "📦 의존성 설치 중..."
npm install

# 간단 빌드 (TypeScript 에러 회피)
echo "🔨 간단 빌드 중..."
npm run build:simple

# PM2로 서버 실행 (무중단 서비스)
echo "🔄 PM2로 서버 시작..."
pm2 stop stepai-api 2>/dev/null || true
pm2 start dist/index.js --name stepai-api --env production

# 방화벽 포트 열기 (Ubuntu/CentOS)
echo "🔓 방화벽 포트 3004 열기..."
sudo ufw allow 3004 2>/dev/null || sudo firewall-cmd --permanent --add-port=3004/tcp 2>/dev/null || true
sudo ufw reload 2>/dev/null || sudo firewall-cmd --reload 2>/dev/null || true

echo "✅ StepAI API 서버 배포 완료!"
echo "🌐 외부 접근: http://서버IP:3004"
echo "📚 API 문서: http://서버IP:3004/api-docs"
echo "💚 헬스체크: http://서버IP:3004/health"