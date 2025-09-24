import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { testConnection } from './configs/database';

// 라우터들 import
import aiServicesRouter from './routes/aiServices';
import aiVideosRouter from './routes/aiVideos';
import categoriesRouter from './routes/categories';
import dashboardRouter from './routes/dashboard';
import curationsRouter from './routes/curations';
import usersRouter from './routes/users';
import siteSettingsRouter from './routes/siteSettings';
import tagsRouter from './routes/tags';
import aiTypesRouter from './routes/aiTypes';
import categoryDisplayOrderRouter from './routes/categoryDisplayOrder';
import setupRouter from './routes/setup';
import homepageSettingsRouter from './routes/homepageSettings';
import adPartnershipsRouter from './routes/adPartnerships';
import setupDbRouter from './routes/setup-db';

const app = express();
const PORT = parseInt(process.env['PORT'] || '3004');

// 미들웨어 설정
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 디버깅용 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});



// 정적 파일 서빙
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));
app.use('/public', express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

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
        },
        AIService: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'AI 서비스 ID'
            },
            ai_name: {
              type: 'string',
              description: 'AI 서비스명'
            },
            ai_description: {
              type: 'string',
              description: 'AI 서비스 설명'
            },
            ai_logo: {
              type: 'string',
              description: 'AI 서비스 로고 URL'
            },
            company_name: {
              type: 'string',
              description: '개발사명'
            },
            pricing_model: {
              type: 'string',
              enum: ['free', 'freemium', 'paid', 'subscription'],
              description: '가격 모델'
            },
            difficulty_level: {
              type: 'string',
              enum: ['beginner', 'intermediate', 'advanced'],
              description: '난이도'
            },
            is_step_pick: {
              type: 'boolean',
              description: 'STEP PICK 여부'
            },
            categories: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Category'
              },
              description: '카테고리 목록'
            }
          }
        },
        AIVideo: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: '영상 ID'
            },
            video_title: {
              type: 'string',
              description: '영상 제목'
            },
            video_description: {
              type: 'string',
              description: '영상 설명'
            },
            video_url: {
              type: 'string',
              description: '영상 URL'
            },
            thumbnail_url: {
              type: 'string',
              description: '썸네일 URL'
            },
            video_duration: {
              type: 'string',
              description: '영상 길이'
            },
            view_count: {
              type: 'integer',
              description: '조회수'
            },
            like_count: {
              type: 'integer',
              description: '좋아요 수'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: '생성일'
            },
            ai_services: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/AIService'
              },
              description: '연관 AI 서비스'
            }
          }
        },
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: '카테고리 ID'
            },
            category_name: {
              type: 'string',
              description: '카테고리명'
            },
            category_icon: {
              type: 'string',
              description: '카테고리 아이콘'
            },
            parent_id: {
              type: 'integer',
              nullable: true,
              description: '부모 카테고리 ID'
            },
            children: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Category'
              },
              description: '하위 카테고리'
            }
          }
        },
        Curation: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: '큐레이션 ID'
            },
            curation_title: {
              type: 'string',
              description: '큐레이션 제목'
            },
            curation_description: {
              type: 'string',
              description: '큐레이션 설명'
            },
            ai_services: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/AIService'
              },
              description: '포함된 AI 서비스'
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

// API 라우터들 (더 구체적인 라우트를 먼저 등록)
app.use('/api/tags', tagsRouter);
app.use('/api/ai-services', aiServicesRouter);
app.use('/api/videos', aiVideosRouter);
app.use('/api/ai-videos', aiVideosRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/curations', curationsRouter);
app.use('/api/users', usersRouter);
app.use('/api/site-settings', siteSettingsRouter);
app.use('/api/ai-types', aiTypesRouter);
app.use('/api/category-display-order', categoryDisplayOrderRouter);
app.use('/api/setup', setupRouter);
app.use('/api/homepage-settings', homepageSettingsRouter);
app.use('/api/ad-partnerships', adPartnershipsRouter);
app.use('/api/setup-db', setupDbRouter);

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
      aiServices: '/api/ai-services',
      aiVideos: '/api/ai-videos',
      categories: '/api/categories',
      dashboard: '/api/dashboard',
      curations: '/api/curations',
      users: '/api/users',
      siteSettings: '/api/site-settings',
      tags: '/api/tags',
      adPartnerships: '/api/ad-partnerships'
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

});

export default app;

