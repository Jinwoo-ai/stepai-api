import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'StepAI API',
      version: '1.0.0',
      description: 'StepAI API 서버 문서',
      contact: {
        name: 'StepAI Team',
        email: 'support@stepai.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: '개발 서버'
      },
      {
        url: 'https://web-production-e8790.up.railway.app',
        description: 'Railway 프로덕션 서버'
      }
    ],
    components: {
      schemas: {
                 User: {
           type: 'object',
           properties: {
             id: {
               type: 'integer',
               description: '사용자 ID'
             },
             username: {
               type: 'string',
               description: '사용자명'
             },
             email: {
               type: 'string',
               format: 'email',
               description: '이메일'
             },
             password_hash: {
               type: 'string',
               description: '비밀번호 해시'
             },
             user_status: {
               type: 'string',
               enum: ['active', 'inactive', 'pending', 'deleted'],
               description: '사용자 상태'
             },
             deleted_at: {
               type: 'string',
               format: 'date-time',
               description: '삭제일'
             },
             created_at: {
               type: 'string',
               format: 'date-time',
               description: '생성일'
             },
             updated_at: {
               type: 'string',
               format: 'date-time',
               description: '수정일'
             }
           },
           required: ['username', 'email', 'password_hash']
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
             ai_type: {
               type: 'string',
               description: 'AI 서비스 타입 (LLM, RAG, gpts, prompter, etc.)'
             },
             ai_status: {
               type: 'string',
               enum: ['active', 'inactive', 'pending', 'deleted'],
               description: 'AI 서비스 상태'
             },
             nationality: {
               type: 'string',
               description: '국가'
             },
             deleted_at: {
               type: 'string',
               format: 'date-time',
               description: '삭제일'
             },
             created_at: {
               type: 'string',
               format: 'date-time',
               description: '생성일'
             },
             updated_at: {
               type: 'string',
               format: 'date-time',
               description: '수정일'
             }
           },
           required: ['ai_name', 'ai_type']
         },
        AIServiceContent: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: '콘텐츠 ID'
            },
            ai_service_id: {
              type: 'integer',
              description: 'AI 서비스 ID'
            },
            content_title: {
              type: 'string',
              description: '콘텐츠 제목'
            },
            content_url: {
              type: 'string',
              description: '콘텐츠 URL'
            },
            content_type: {
              type: 'string',
              enum: ['link', 'image', 'video', 'text', 'audio', 'pdf'],
              description: '콘텐츠 타입'
            },
            content_description: {
              type: 'string',
              description: '콘텐츠 설명'
            },
            content_order_index: {
              type: 'integer',
              description: '콘텐츠 순서'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive'],
              description: '콘텐츠 상태'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: '생성일'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: '수정일'
            }
          },
          required: ['ai_service_id', 'content_title', 'content_type']
        },
        AIServiceTag: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: '태그 ID'
            },
            ai_service_id: {
              type: 'integer',
              description: 'AI 서비스 ID'
            },
            tag_name: {
              type: 'string',
              description: '태그명'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: '생성일'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: '수정일'
            }
          },
          required: ['ai_service_id', 'tag_name']
        },
        AICategory: {
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
            created_at: {
              type: 'string',
              format: 'date-time',
              description: '생성일'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: '수정일'
            }
          },
          required: ['category_name']
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: '요청 성공 여부'
            },
            data: {
              description: '응답 데이터'
            },
            message: {
              type: 'string',
              description: '성공 메시지'
            },
            error: {
              type: 'string',
              description: '에러 메시지'
            }
          },
          required: ['success']
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              description: '데이터 배열'
            },
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
  apis: ['./src/routes/*.ts', './src/index.ts']
};

export const specs = swaggerJsdoc(options); 