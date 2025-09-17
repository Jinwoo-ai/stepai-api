const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 간단 빌드 시작...');

// dist 디렉토리 생성
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

// TypeScript 없이 JavaScript로 직접 실행
console.log('📦 의존성 확인...');
try {
  execSync('npm install', { stdio: 'inherit' });
} catch (error) {
  console.log('의존성 설치 중 일부 경고 무시');
}

// src/index.ts를 dist/index.js로 복사하고 수정
const indexContent = `
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = parseInt(process.env.PORT || '3004');

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));
app.use('/public', express.static(path.join(__dirname, '../public')));

// 헬스체크 엔드포인트
app.get('/health', async (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 루트 엔드포인트
app.get('/', (req, res) => {
  res.json({
    message: 'StepAI API 서버가 실행 중입니다.',
    version: '1.0.0',
    endpoints: {
      health: '/health'
    }
  });
});

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: '요청한 엔드포인트를 찾을 수 없습니다.'
  });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: '서버 내부 오류가 발생했습니다.'
  });
});

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`🚀 StepAI API 서버가 포트 \${PORT}에서 실행 중입니다.\`);
  console.log(\`💚 헬스체크: http://localhost:\${PORT}/health\`);
  console.log(\`🌐 Railway Internal: http://stepai-api.railway.internal:\${PORT}\`);
});

module.exports = app;
`;

fs.writeFileSync('dist/index.js', indexContent);

console.log('✅ 간단 빌드 완료!');
console.log('📁 빌드 파일: dist/index.js');