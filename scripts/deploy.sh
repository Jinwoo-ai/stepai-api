#!/bin/bash

# StepAI API 배포 스크립트

echo "🚀 StepAI API 배포를 시작합니다..."

# 환경 변수 확인
if [ -z "$NODE_ENV" ]; then
    export NODE_ENV=production
fi

# 의존성 설치
echo "📦 의존성을 설치합니다..."
npm ci --only=production

# TypeScript 빌드
echo "🔨 TypeScript를 빌드합니다..."
npm run build

# 빌드 결과 확인
if [ ! -d "dist" ]; then
    echo "❌ 빌드 실패: dist 폴더가 생성되지 않았습니다."
    exit 1
fi

echo "✅ 빌드가 완료되었습니다."

# 서버 시작
echo "🚀 서버를 시작합니다..."
npm start 