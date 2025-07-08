import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from 'dotenv';
import swaggerUi from 'swagger-ui-express';

// 환경 변수 로드
config();

// 데이터베이스 연결 테스트
import { testConnection } from './configs/database';

// Swagger 설정
import { specs } from './configs/swagger';

// 라우터 임포트
import userRoutes from './routes/users';
import aiServiceRoutes from './routes/aiServices';
import aiServiceContentRoutes from './routes/aiServiceContents';
import aiServiceTagRoutes from './routes/aiServiceTags';
import aiCategoryRoutes from './routes/aiCategories';
import assetRoutes from './routes/assets';

const app = express();
const PORT = process.env['PORT'] || 3000;

// 미들웨어 설정
app.use(helmet()); // 보안 헤더 설정
app.use(cors()); // CORS 설정
app.use(morgan('combined')); // 로깅
app.use(express.json({ limit: '10mb' })); // JSON 파싱
app.use(express.urlencoded({ extended: true })); // URL 인코딩 파싱

// 기본 라우트
app.get('/', (_req, res) => {
  res.json({
    message: 'StepAI API 서버가 실행 중입니다.',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    status: 'ok'
  });
});

// 간단한 헬스체크 (데이터베이스 연결 없이)
app.get('/ping', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 헬스 체크
app.get('/health', async (_req, res) => {
  try {
    let dbConnected = false;
    try {
      dbConnected = await testConnection();
    } catch (error) {
      console.log('헬스체크 중 데이터베이스 연결 실패:', error);
    }
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'disconnected',
      environment: process.env['NODE_ENV'] || 'development',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '서버 상태 확인 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Swagger UI 설정
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// 정적 파일 서빙 (Asset 파일들)
app.use('/assets', express.static('public/assets'));

// API 라우터 설정
app.use('/api/users', userRoutes);
app.use('/api/ai-services', aiServiceRoutes);
app.use('/api/ai-service-contents', aiServiceContentRoutes);
app.use('/api/ai-service-tags', aiServiceTagRoutes);
app.use('/api/ai-categories', aiCategoryRoutes);
app.use('/api/assets', assetRoutes);

// 404 에러 핸들러
app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    error: '요청한 엔드포인트를 찾을 수 없습니다.'
  });
});

// 전역 에러 핸들러
app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('서버 오류:', error);
  
  res.status(500).json({
    success: false,
    error: '서버 내부 오류가 발생했습니다.'
  });
});

// 서버 시작
const startServer = async () => {
  try {
    // 데이터베이스 연결 테스트 (선택사항)
    let dbConnected = false;
    try {
      dbConnected = await testConnection();
      console.log(`📊 데이터베이스 연결: ${dbConnected ? '성공' : '실패'}`);
    } catch (error) {
      console.log('⚠️ 데이터베이스 연결 실패 (서버는 계속 시작됩니다):', error);
    }

    app.listen(PORT, () => {
      console.log(`🚀 StepAI API 서버가 포트 ${PORT}에서 실행 중입니다.`);
      console.log(`📊 환경: ${process.env['NODE_ENV'] || 'development'}`);
      console.log(`📚 Swagger 문서: http://localhost:${PORT}/api-docs`);
      console.log(`🔗 API 문서: http://localhost:${PORT}/api`);
      console.log(`💚 헬스 체크: http://localhost:${PORT}/health`);
      console.log(`💾 데이터베이스: ${dbConnected ? '연결됨' : '연결되지 않음'}`);
    });
  } catch (error) {
    console.error('서버 시작 실패:', error);
    process.exit(1);
  }
};

// 프로세스 종료 시 정리
process.on('SIGINT', async () => {
  console.log('\n🛑 서버를 종료합니다...');
  
  try {
    const { closeDatabaseConnection } = await import('./configs/database');
    await closeDatabaseConnection();
    console.log('✅ 데이터베이스 연결이 종료되었습니다.');
  } catch (error) {
    console.error('❌ 데이터베이스 연결 종료 중 오류:', error);
  }
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 서버를 종료합니다...');
  
  try {
    const { closeDatabaseConnection } = await import('./configs/database');
    await closeDatabaseConnection();
    console.log('✅ 데이터베이스 연결이 종료되었습니다.');
  } catch (error) {
    console.error('❌ 데이터베이스 연결 종료 중 오류:', error);
  }
  
  process.exit(0);
});

// 서버 시작
startServer();
