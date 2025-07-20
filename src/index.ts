import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { testConnection } from './configs/database';
import { trackContentView } from './middleware/contentViewTracker';

// 라우터들 import
import usersRouter from './routes/users';
import groupsRouter from './routes/groups';
import expertsRouter from './routes/experts';
import contentsRouter from './routes/contents';
import aiServicesRouter from './routes/aiServices';
import rankingsRouter from './routes/rankings';
import assetsRouter from './routes/assets';

const app = express();
const PORT = process.env['PORT'] || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 콘텐츠 조회 추적 미들웨어 (라우터보다 먼저 적용)
app.use(trackContentView);

// 정적 파일 서빙
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));
app.use('/public', express.static(path.join(__dirname, '../public')));

// Swagger 설정
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'StepAI API',
      version: '1.0.0',
      description: 'AI 전문가 매칭 서비스 API',
    },
    servers: [
      {
        url: process.env['NODE_ENV'] === 'production' 
          ? 'https://web-production-e8790.up.railway.app' 
          : `http://localhost:${PORT}`,
        description: process.env['NODE_ENV'] === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: '요청 성공 여부'
            },
            data: {
              type: 'object',
              description: '응답 데이터'
            },
            error: {
              type: 'string',
              description: '오류 메시지'
            },
            message: {
              type: 'string',
              description: '성공 메시지'
            }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            pagination: {
              type: 'object',
              properties: {
                page: {
                  type: 'integer',
                  description: '현재 페이지'
                },
                limit: {
                  type: 'integer',
                  description: '페이지당 항목 수'
                },
                total: {
                  type: 'integer',
                  description: '전체 항목 수'
                },
                totalPages: {
                  type: 'integer',
                  description: '전체 페이지 수'
                }
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI 설정
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API 라우터들
app.use('/api/users', usersRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/experts', expertsRouter);
app.use('/api/contents', contentsRouter);
app.use('/api/ai-services', aiServicesRouter);
app.use('/api/rankings', rankingsRouter);
app.use('/api/assets', assetsRouter);

// 헬스체크 엔드포인트
app.get('/health', async (_req, res) => {
  try {
    const dbConnected = await testConnection();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'disconnected',
      environment: process.env['NODE_ENV'] || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// 루트 엔드포인트
app.get('/', (_req, res) => {
  res.json({
    message: 'StepAI API 서버가 실행 중입니다.',
    version: '1.0.0',
    endpoints: {
      docs: '/api-docs',
      health: '/health',
      users: '/api/users',
      groups: '/api/groups',
      experts: '/api/experts',
      contents: '/api/contents',
      aiServices: '/api/ai-services',
      rankings: '/api/rankings',
      assets: '/api/assets'
    }
  });
});

// 404 핸들러
app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    error: '요청한 엔드포인트를 찾을 수 없습니다.'
  });
});

// 에러 핸들러
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: '서버 내부 오류가 발생했습니다.'
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 StepAI API 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📚 API 문서: http://localhost:${PORT}/api-docs`);
  console.log(`💚 헬스체크: http://localhost:${PORT}/health`);
  console.log(`📊 콘텐츠 조회 추적이 활성화되었습니다.`);
});

export default app;

