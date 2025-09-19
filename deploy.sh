#!/bin/bash

echo "🚀 StepAI API 배포 시작..."

# Git pull
echo "📥 최신 코드 가져오기..."
git pull origin main

# 의존성 설치
echo "📦 의존성 설치..."
npm install

# TypeScript 빌드
echo "🔨 TypeScript 빌드..."
npm run build

# PM2로 재시작
echo "🔄 PM2 재시작..."
npx pm2 restart stepai-api || npx pm2 start ecosystem.config.js

# 상태 확인
echo "✅ 배포 완료! 상태 확인:"
npx pm2 status stepai-api
npx pm2 logs stepai-api --lines 10