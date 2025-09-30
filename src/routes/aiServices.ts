import express from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getDatabaseConnection } from '../configs/database';
import { authenticateAdmin, AdminAuthenticatedRequest } from '../middleware/adminAuth';
import multer from 'multer';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

const router = express.Router();

// 파일 업로드 설정
const upload = multer({
  dest: 'uploads/',
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') {
      cb(null, true);
    } else {
      cb(new Error('엑셀 파일만 업로드 가능합니다.'));
    }
  }
});

// 이미지 업로드 설정 (개선된 버전)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'public/uploads/icons/');
    // 디렉토리가 없으면 생성
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${timestamp}_${randomString}${ext}`;
    cb(null, filename);
  }
});

const imageUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다. JPEG, PNG, GIF, WebP, SVG만 허용됩니다.'));
    }
  }
});

// 테스트 POST 라우트
router.post('/test', (_req, res) => {
  console.log('TEST POST ROUTE HIT');
  res.json({ message: 'test post works' });
});

// 데이터베이스 연결 테스트 라우트
router.get('/test-db', async (_req, res) => {
  try {
    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      // 간단한 쿼리 테스트
      const [result] = await connection.execute<RowDataPacket[]>('SELECT 1 as test');
      
      // 카테고리 22 존재 여부 확인
      const [categoryResult] = await connection.execute<RowDataPacket[]>(
        'SELECT id, category_name FROM categories WHERE id = ?',
        [22]
      );
      
      // AI 서비스 개수 확인
      const [serviceCount] = await connection.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM ai_services WHERE deleted_at IS NULL'
      );
      
      // ai_service_category_display_order 테이블 존재 여부 확인
      let categoryDisplayOrderExists = false;
      try {
        await connection.execute('SELECT 1 FROM ai_service_category_display_order LIMIT 1');
        categoryDisplayOrderExists = true;
      } catch (error) {
        categoryDisplayOrderExists = false;
      }
      
      res.json({
        success: true,
        data: {
          dbConnection: 'OK',
          testQuery: result[0],
          category22: categoryResult.length > 0 ? categoryResult[0] : 'Not found',
          totalServices: serviceCount[0].count,
          categoryDisplayOrderTable: categoryDisplayOrderExists ? 'EXISTS' : 'NOT EXISTS'
        }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      success: false,
      error: 'Database connection failed',
      details: error.message
    });
  }
});

// 아이콘 업로드 엔드포인트 (개선된 로컬 저장)
router.post('/upload-icon', imageUpload.single('icon'), async (req, res) => {
  try {
    console.log('Upload request received:', {
      hasFile: !!req.file,
      body: req.body,
      contentType: req.headers['content-type'],
      allHeaders: req.headers
    });
    
    if (!req.file) {
      console.log('No file received in request');
      return res.status(400).json({
        success: false,
        error: '이미지 파일이 필요합니다.'
      });
    }

    // multer가 이미 파일명을 생성했으므로 그대로 사용
    const fileName = req.file.filename;
    // 전체 URL로 반환
    const baseUrl = process.env.BASE_URL || 'https://stepai-admin-production.up.railway.app';
    const fileUrl = `${baseUrl}/uploads/icons/${fileName}`;
    
    res.json({
      success: true,
      data: {
        url: fileUrl,
        filename: fileName,
        originalName: req.file.originalname
      },
      message: '아이콘이 업로드되었습니다.'
    });
  } catch (error) {
    console.error('Error uploading icon:', error);
    
    // 업로드 실패 시 파일 삭제
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    // multer 에러 처리
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: '파일 크기가 너무 큽니다. (5MB 이하)'
      });
    }
    
    if (error.message.includes('지원하지 않는 파일 형식')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: '아이콘 업로드 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});



// Admin용 AI 서비스 검색 (DB만)
router.get('/admin-search', async (req, res) => {
  try {
    const query = req.query['q'] as string;
    if (!query || query.trim().length < 1) {
      return res.json({ success: true, data: [] });
    }

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      const [services] = await connection.execute<RowDataPacket[]>(
        `SELECT s.id, s.ai_name, COALESCE(s.ai_name_en, '') as ai_name_en, s.ai_description, s.ai_logo, s.company_name, s.headquarters, s.is_step_pick, s.is_new,
                c.id as category_id, c.category_name
         FROM ai_services s
         LEFT JOIN ai_service_categories ascat ON s.id = ascat.ai_service_id AND ascat.is_main_category = 1
         LEFT JOIN categories c ON ascat.category_id = c.id
         WHERE (s.ai_name LIKE ? OR s.ai_name_en LIKE ? OR s.company_name LIKE ? OR s.ai_description LIKE ?) 
         AND s.deleted_at IS NULL
         ORDER BY s.ai_name
         LIMIT 50`,
        [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]
      );
      
      const result = services.map(service => {
        const headquarters = service.headquarters;
        const baseUrl = process.env.BASE_URL || 'https://stepai-admin-production.up.railway.app';
        let flag_icon = `${baseUrl}/uploads/icons/국가없음.png`;
        if (headquarters) {
          const flagPath = path.join(process.cwd(), 'public/uploads/icons', `${headquarters}.png`);
          if (fs.existsSync(flagPath)) {
            flag_icon = `${baseUrl}/uploads/icons/${headquarters}.png`;
          }
        }
        
        return {
          id: service.id,
          ai_service_id: service.id,
          ai_name: service.ai_name,
          ai_name_en: service.ai_name_en,
          ai_description: service.ai_description,
          ai_logo: service.ai_logo,
          company_name: service.company_name,
          is_step_pick: service.is_step_pick,
          is_new: service.is_new,
          flag_icon: flag_icon,
          category: service.category_id ? {
            id: service.category_id,
            category_name: service.category_name
          } : null
        };
      });
      
      res.json({ 
        success: true, 
        data: result
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error in admin search API:', error);
    res.status(500).json({
      success: false,
      error: 'AI 서비스 검색 중 오류가 발생했습니다.'
    });
  }
});

// AI 서비스 검색 (웹훅 연동 - 프론트엔드용)
router.get('/search', async (req, res) => {
  try {
    const query = req.query['q'] as string;
    if (!query || query.trim().length < 1) {
      return res.json({ success: true, data: [] });
    }

    // 웹훅 URL 결정 (환경에 따라)
    const environment = process.env.NODE_ENV || 'development';
    const webhookUrl = environment === 'production' 
      ? 'https://stepai.app.n8n.cloud/webhook/71c95f80-ad76-480f-8283-d5d487fe91fa'
      : 'https://stepai.app.n8n.cloud/webhook-test/71c95f80-ad76-480f-8283-d5d487fe91fa';
    
    try {
      // 웹훅으로 검색 요청
      const webhookResponse = await axios.get(webhookUrl, {
        params: {
          user_query: query
        },
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'stepai-search-api/1.0'
        },
        timeout: 30000 // 30초 타임아웃
      });
      
      console.log('웹훅 검색 성공:', {
        status: webhookResponse.status,
        query: query,
        url: webhookUrl,
        hasAnswer: !!webhookResponse.data?.search_answer,
        serviceCount: webhookResponse.data?.search_result_id_list?.length || 0,
        videoCount: webhookResponse.data?.search_video_id_list?.length || 0
      });
      
      const webhookData = webhookResponse.data;
      const result = {
        search_answer: webhookData?.search_answer || '',
        ai_services: [],
        videos: []
      };
      
      const pool = getDatabaseConnection();
      const connection = await pool.getConnection();
      
      try {
        // AI 서비스 조회
        if (webhookData?.search_result_id_list?.length > 0) {
          const serviceIds = webhookData.search_result_id_list.slice(0, 20); // 최대 20개
          const placeholders = serviceIds.map(() => '?').join(',');
          
          const [services] = await connection.execute<RowDataPacket[]>(
            `SELECT s.id, s.ai_name, COALESCE(s.ai_name_en, '') as ai_name_en, s.ai_description, s.ai_logo, s.company_name, s.headquarters, s.is_step_pick, s.is_new,
                    c.id as category_id, c.category_name
             FROM ai_services s
             LEFT JOIN ai_service_categories ascat ON s.id = ascat.ai_service_id AND ascat.is_main_category = 1
             LEFT JOIN categories c ON ascat.category_id = c.id
             WHERE s.id IN (${placeholders}) AND s.deleted_at IS NULL AND s.ai_status = 'active'
             ORDER BY FIELD(s.id, ${placeholders})`,
            [...serviceIds, ...serviceIds]
          );
          
          // 각 서비스의 모든 카테고리 정보 조회
          for (const service of services) {
            const [allCategories] = await connection.execute<RowDataPacket[]>(
              `SELECT c.id, c.category_name, ascat.is_main_category
               FROM ai_service_categories ascat
               INNER JOIN categories c ON ascat.category_id = c.id
               WHERE ascat.ai_service_id = ?
               ORDER BY ascat.is_main_category DESC, c.category_name`,
              [service.id]
            );
            service.categories = allCategories;
          }
          
          result.ai_services = services.map(service => {
            const headquarters = service.headquarters;
            const baseUrl = process.env.BASE_URL || 'https://stepai-admin-production.up.railway.app';
            let flag_icon = `${baseUrl}/uploads/icons/국가없음.png`;
            if (headquarters) {
              const flagPath = path.join(process.cwd(), 'public/uploads/icons', `${headquarters}.png`);
              if (fs.existsSync(flagPath)) {
                flag_icon = `${baseUrl}/uploads/icons/${headquarters}.png`;
              }
            }
            
            return {
              id: service.id,
              ai_service_id: service.id,
              ai_name: service.ai_name,
              ai_name_en: service.ai_name_en,
              ai_description: service.ai_description,
              ai_logo: service.ai_logo,
              company_name: service.company_name,
              is_step_pick: service.is_step_pick,
              is_new: service.is_new,
              flag_icon: flag_icon,
              category_id: service.category_id,
              category_name: service.category_name,
              categories: service.categories || []
            };
          });
        }
        
        // 비디오 조회
        if (webhookData?.search_video_id_list?.length > 0) {
          const videoIds = webhookData.search_video_id_list.slice(0, 10); // 최대 10개
          const placeholders = videoIds.map(() => '?').join(',');
          
          const [videos] = await connection.execute<RowDataPacket[]>(
            `SELECT id, video_title, video_description, thumbnail_url, duration, view_count, video_url
             FROM ai_videos 
             WHERE id IN (${placeholders}) AND video_status = 'active'
             ORDER BY FIELD(id, ${placeholders})`,
            [...videoIds, ...videoIds]
          );
          result.videos = videos;
        }
      } finally {
        connection.release();
      }
      
      res.json({
        success: true,
        data: result,
        source: 'webhook'
      });
      
    } catch (webhookError) {
      console.error('웹훅 검색 실패:', {
        message: webhookError.message,
        status: webhookError.response?.status,
        statusText: webhookError.response?.statusText,
        data: webhookError.response?.data,
        url: webhookUrl,
        query: query,
        requestPayload: {
          method: 'GET',
          url: webhookUrl,
          params: { user_query: query },
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'stepai-search-api/1.0'
          },
          timeout: 30000
        }
      });
      
      // 웹훅 실패 시 기존 DB 검색으로 폴백
      const pool = getDatabaseConnection();
      const connection = await pool.getConnection();
      
      try {
        const [services] = await connection.execute<RowDataPacket[]>(
          `SELECT s.id, s.ai_name, COALESCE(s.ai_name_en, '') as ai_name_en, s.ai_description, s.ai_logo, s.company_name, s.headquarters, s.is_step_pick, s.is_new,
                  c.id as category_id, c.category_name
           FROM ai_services s
           LEFT JOIN ai_service_categories ascat ON s.id = ascat.ai_service_id AND ascat.is_main_category = 1
           LEFT JOIN categories c ON ascat.category_id = c.id
           WHERE (s.ai_name LIKE ? OR s.ai_name_en LIKE ? OR s.company_name LIKE ? OR s.ai_description LIKE ?) 
           AND s.deleted_at IS NULL AND s.ai_status = 'active'
           ORDER BY s.ai_name
           LIMIT 20`,
          [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]
        );
        
        // 각 서비스의 모든 카테고리 정보 조회
        for (const service of services) {
          const [allCategories] = await connection.execute<RowDataPacket[]>(
            `SELECT c.id, c.category_name, ascat.is_main_category
             FROM ai_service_categories ascat
             INNER JOIN categories c ON ascat.category_id = c.id
             WHERE ascat.ai_service_id = ?
             ORDER BY ascat.is_main_category DESC, c.category_name`,
            [service.id]
          );
          service.categories = allCategories;
        }
        
        // 비디오 검색
        const [videos] = await connection.execute<RowDataPacket[]>(
          `SELECT id, video_title, video_description, thumbnail_url, duration, view_count, video_url
           FROM ai_videos 
           WHERE (video_title LIKE ? OR video_description LIKE ?) 
           AND video_status = 'active'
           ORDER BY view_count DESC
           LIMIT 10`,
          [`%${query}%`, `%${query}%`]
        );
        
        const fallbackResult = {
          search_answer: `"${query}"에 대한 검색 결과입니다.`,
          ai_services: services.map(service => {
            const headquarters = service.headquarters;
            const baseUrl = process.env.BASE_URL || 'https://stepai-admin-production.up.railway.app';
            let flag_icon = `${baseUrl}/uploads/icons/국가없음.png`;
            if (headquarters) {
              const flagPath = path.join(process.cwd(), 'public/uploads/icons', `${headquarters}.png`);
              if (fs.existsSync(flagPath)) {
                flag_icon = `${baseUrl}/uploads/icons/${headquarters}.png`;
              }
            }
            
            return {
              id: service.id,
              ai_service_id: service.id,
              ai_name: service.ai_name,
              ai_name_en: service.ai_name_en,
              ai_description: service.ai_description,
              ai_logo: service.ai_logo,
              company_name: service.company_name,
              is_step_pick: service.is_step_pick,
              is_new: service.is_new,
              flag_icon: flag_icon,
              category_id: service.category_id,
              category_name: service.category_name,
              categories: service.categories || []
            };
          }),
          videos: videos
        };
        
        res.json({ 
          success: true, 
          data: fallbackResult,
          source: 'fallback'
        });
      } finally {
        connection.release();
      }
    }
  } catch (error) {
    console.error('Error in search API:', error);
    res.status(500).json({
      success: false,
      error: 'AI 서비스 검색 중 오류가 발생했습니다.'
    });
  }
});

// 샘플 엑셀 파일 다운로드 (정적 파일)
router.get('/sample-excel', async (req, res) => {
  try {
    const sampleData = [
      {
        '서비스명(국문)': 'ChatGPT',
        '서비스명(영문)': 'ChatGPT',
        '한줄설명': 'OpenAI의 대화형 인공지능 챗봇 서비스',
        '대표 URL': 'https://chat.openai.com',
        '기업명(국문)': '오픈AI',
        '기업명(영문)': 'OpenAI',
        '임베디드 영상 URL': '',
        '본사': '미국',
        '주요기능': '대화형 AI 모델로 다양한 질문에 답변 제공',
        '타겟 사용자': '일반 사용자, 개발자, 연구자',
        '추천활용사례': '코드 작성, 글쓰기, 번역, 요약 등',
        'Price': '무료, 유료',
        '난이도': '초급',
        '사용': '웹, 모바일 앱',
        'Alive': 'Yes',
        '표시위치': 'STEP_PICK',
        'NEW': 'No',
        '형태': '웹, API',
        'Target': 'GEN, BUS',
        '메인 카테고리': 'AI 글쓰기',
        '서브 카테고리': '대화형에이전트, 개인어시스턴트',
        'Tags': '#AI글쓰기 #대화형에이전트 #개인어시스턴트'
      },
      {
        '서비스명(국문)': 'Claude',
        '서비스명(영문)': 'Claude',
        '한줄설명': 'Anthropic의 AI 어시스턴트',
        '대표 URL': 'https://claude.ai',
        '기업명(국문)': '안스로픽',
        '기업명(영문)': 'Anthropic',
        '임베디드 영상 URL': '',
        '본사': '미국',
        '주요기능': '안전하고 도움이 되는 AI 어시스턴트',
        '타겟 사용자': '전문가, 연구자, 비즈니스 사용자',
        '추천활용사례': '문서 작성, 데이터 분석, 코드 리뷰',
        'Price': '무료, 유료',
        '난이도': '중급',
        '사용': '웹',
        'Alive': 'Yes',
        '표시위치': '',
        'NEW': 'Yes',
        '형태': '웹',
        'Target': 'PRO, BUS',
        '메인 카테고리': 'AI 글쓰기',
        '서브 카테고리': '블로그/아티클, 학술/전문문서',
        'Tags': '#AI글쓰기 #블로그 #전문문서'
      }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    
    const columnWidths = [
      { wch: 20 }, // 서비스명(국문)
      { wch: 20 }, // 서비스명(영문)
      { wch: 40 }, // 한줄설명
      { wch: 30 }, // 대표 URL
      { wch: 15 }, // 기업명(국문)
      { wch: 15 }, // 기업명(영문)
      { wch: 30 }, // 임베디드 영상 URL
      { wch: 10 }, // 본사
      { wch: 30 }, // 주요기능
      { wch: 25 }, // 타겟 사용자
      { wch: 30 }, // 추천활용사례
      { wch: 15 }, // Price
      { wch: 10 }, // 난이도
      { wch: 15 }, // 사용
      { wch: 8 },  // Alive
      { wch: 12 }, // 표시위치
      { wch: 8 },  // NEW
      { wch: 15 }, // 형태
      { wch: 12 }, // Target
      { wch: 20 }, // 메인 카테고리
      { wch: 30 }, // 서브 카테고리
      { wch: 40 }  // Tags
    ];
    
    worksheet['!cols'] = columnWidths;
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'AI_Services_Template');
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Disposition', 'attachment; filename="ai_services_template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Error creating sample excel:', error);
    res.status(500).json({
      success: false,
      error: '샘플 엑셀 파일 생성 중 오류가 발생했습니다.'
    });
  }
});

// AI 서비스 개별 조회
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const include_categories = req.query['include_categories'] !== 'false'; // 기본값을 true로 변경
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 서비스 ID입니다.'
      });
    }

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    // 로그인된 사용자 ID 추출
    let userId = null;
    if (req.headers.authorization) {
      const token = req.headers.authorization.replace('Bearer ', '');
      // 토큰으로 사용자 ID 조회
      try {
        const [userResult] = await connection.execute<RowDataPacket[]>(
          'SELECT id FROM users WHERE access_token = ?',
          [token]
        );
        if (userResult.length > 0) {
          userId = userResult[0].id;
        }
      } catch (error) {
        console.log('사용자 토큰 조회 실패:', error.message);
      }
    }
    
    try {
      // AI 서비스 기본 정보 조회 (대표 카테고리 포함)
      const [services] = await connection.execute<RowDataPacket[]>(
        `SELECT s.*, mc.id as main_category_id, mc.category_name as main_category_name
         FROM ai_services s
         LEFT JOIN ai_service_categories ascat ON s.id = ascat.ai_service_id AND ascat.is_main_category = 1
         LEFT JOIN categories mc ON ascat.category_id = mc.id
         WHERE s.id = ? AND s.deleted_at IS NULL`,
        [id]
      );
      
      if (services.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'AI 서비스를 찾을 수 없습니다.'
        });
      }
      
      let serviceData = { ...services[0] };
      
      // 대표 카테고리 정보 추가
      serviceData['category_id'] = serviceData['main_category_id'];
      serviceData['category_name'] = serviceData['main_category_name'];
      
      // 카테고리 정보 포함
      if (include_categories) {
        const [categories] = await connection.execute<RowDataPacket[]>(
          `SELECT c.id, c.category_name, c.parent_id, ascat.is_main_category,
                  p.category_name as parent_category_name
           FROM categories c 
           INNER JOIN ai_service_categories ascat ON c.id = ascat.category_id 
           LEFT JOIN categories p ON c.parent_id = p.id
           WHERE ascat.ai_service_id = ?`,
          [id]
        );
        serviceData['categories'] = categories;
      } else {
        // include_categories가 false인 경우도 모든 카테고리 정보 제공
        const [categories] = await connection.execute<RowDataPacket[]>(
          `SELECT c.id, c.category_name, ascat.is_main_category
           FROM ai_service_categories ascat
           INNER JOIN categories c ON ascat.category_id = c.id
           WHERE ascat.ai_service_id = ?
           ORDER BY ascat.is_main_category DESC, c.category_name`,
          [id]
        );
        serviceData['categories'] = categories;
      }
      
      // 태그 정보 포함
      const [tags] = await connection.execute<RowDataPacket[]>(
        `SELECT t.id, t.tag_name
         FROM tags t
         INNER JOIN ai_service_tags ast ON t.id = ast.tag_id
         WHERE ast.ai_service_id = ?
         ORDER BY t.tag_name`,
        [id]
      );
      serviceData['tags'] = tags.map(tag => tag['tag_name']).join(' #');
      if (serviceData['tags']) serviceData['tags'] = '#' + serviceData['tags'];
      serviceData['tag_ids'] = tags.map(tag => tag['id']);
      
      // AI 타입 정보 포함
      const [aiTypes] = await connection.execute<RowDataPacket[]>(
        `SELECT at.type_name
         FROM ai_types at
         INNER JOIN ai_service_types ast ON at.id = ast.ai_type_id
         WHERE ast.ai_service_id = ?
         ORDER BY at.type_name`,
        [id]
      );
      serviceData['ai_types'] = aiTypes.map(type => type['type_name']);
      serviceData['ai_type'] = aiTypes.map(type => type['type_name']).join(', ');
      
      // 가격 모델 정보 포함
      const [pricingModels] = await connection.execute<RowDataPacket[]>(
        `SELECT pm.model_name
         FROM pricing_models pm
         INNER JOIN ai_service_pricing_models aspm ON pm.id = aspm.pricing_model_id
         WHERE aspm.ai_service_id = ?
         ORDER BY pm.model_name`,
        [id]
      );
      serviceData['pricing_models'] = pricingModels.map(model => model['model_name']);
      
      // 타겟 타입 정보 포함
      const [targetTypes] = await connection.execute<RowDataPacket[]>(
        `SELECT tt.type_code, tt.type_name
         FROM target_types tt
         INNER JOIN ai_service_target_types astt ON tt.id = astt.target_type_id
         WHERE astt.ai_service_id = ?
         ORDER BY tt.type_code`,
        [id]
      );
      serviceData['target_types'] = targetTypes.map(type => ({ code: type['type_code'], name: type['type_name'] }));
      
      // 유사 서비스 정보 포함
      const [similarServices] = await connection.execute<RowDataPacket[]>(
        `SELECT s.id, s.ai_name, COALESCE(s.ai_name_en, '') as ai_name_en, s.ai_logo, s.company_name
         FROM ai_services s
         INNER JOIN ai_service_similar_services ass ON s.id = ass.similar_service_id
         WHERE ass.ai_service_id = ? AND s.deleted_at IS NULL
         ORDER BY s.ai_name`,
        [id]
      );
      serviceData['similar_services_list'] = similarServices;
      
      // 콘텐츠 정보 포함
      const [contents] = await connection.execute<RowDataPacket[]>(
        `SELECT content_type, content_title, content_text, content_order
         FROM ai_service_contents
         WHERE ai_service_id = ?
         ORDER BY content_order`,
        [id]
      );
      serviceData['contents'] = contents;
      
      // flag_icon 추가
      const headquarters = serviceData['headquarters'];
      const baseUrl = process.env.BASE_URL || 'https://stepai-admin-production.up.railway.app';
      if (headquarters) {
        const flagPath = path.join(process.cwd(), 'public/uploads/icons', `${headquarters}.png`);
        if (fs.existsSync(flagPath)) {
          serviceData['flag_icon'] = `${baseUrl}/uploads/icons/${headquarters}.png`;
        } else {
          serviceData['flag_icon'] = `${baseUrl}/uploads/icons/국가없음.png`;
        }
      } else {
        serviceData['flag_icon'] = `${baseUrl}/uploads/icons/국가없음.png`;
      }
      
      // 북마크 정보 추가
      if (userId) {
        const [bookmarkResult] = await connection.execute<RowDataPacket[]>(
          'SELECT id FROM user_favorite_services WHERE user_id = ? AND ai_service_id = ?',
          [userId, id]
        );
        serviceData['is_bookmarked'] = bookmarkResult.length > 0;
      }
      
      // ai_service_id 필드 추가
      serviceData['ai_service_id'] = serviceData['id'];
      
      res.json({
        success: true,
        data: serviceData
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching AI service:', error);
    res.status(500).json({
      success: false,
      error: 'AI 서비스 조회 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// AI 서비스 목록 조회
router.get('/', async (req, res) => {
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 10;
  const search = req.query['search'] as string;
  const category_id = req.query['category_id'] ? parseInt(req.query['category_id'] as string) : undefined;
  const ai_status = req.query['ai_status'] as string;
  const is_step_pick = req.query['is_step_pick'] as string;
  const is_new = req.query['is_new'] as string;
  const pricing_model = req.query['pricing_model'] as string;
  const ai_type = req.query['ai_type'] as string;
  const difficulty_level = req.query['difficulty_level'] as string;
  const nationality = req.query['nationality'] as string;
  const sort = req.query['sort'] as string;
  const include_categories = req.query['include_categories'] === 'true';
  
  // 로그인된 사용자 ID 추출
  let userId = null;
  if (req.headers.authorization) {
    const token = req.headers.authorization.replace('Bearer ', '');
    // 토큰으로 사용자 ID 조회
    try {
      const pool = getDatabaseConnection();
      const connection = await pool.getConnection();
      try {
        const [userResult] = await connection.execute<RowDataPacket[]>(
          'SELECT id FROM users WHERE access_token = ?',
          [token]
        );
        if (userResult.length > 0) {
          userId = userResult[0].id;
        }
      } finally {
        connection.release();
      }
    } catch (error) {
      console.log('사용자 토큰 조회 실패:', error.message);
    }
  }
  
  try {

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      const offset = (page - 1) * limit;
      const whereConditions: string[] = ['ai_services.deleted_at IS NULL'];
      const queryParams: any[] = [];

      if (search) {
        whereConditions.push('(ai_services.ai_name LIKE ? OR COALESCE(ai_services.ai_name_en, \'\') LIKE ? OR ai_services.ai_description LIKE ?)');
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      if (category_id) {
        whereConditions.push('EXISTS (SELECT 1 FROM ai_service_categories ascat WHERE ascat.ai_service_id = ai_services.id AND ascat.category_id = ?)');
        queryParams.push(category_id);
      }

      if (ai_status) {
        whereConditions.push('ai_services.ai_status = ?');
        queryParams.push(ai_status);
      }

      if (is_step_pick) {
        whereConditions.push('ai_services.is_step_pick = ?');
        queryParams.push(is_step_pick === 'true');
      }

      if (is_new) {
        whereConditions.push('ai_services.is_new = ?');
        queryParams.push(is_new === 'true');
      }

      if (pricing_model) {
        const pricingModels = pricing_model.split(',').map(model => model.trim());
        const placeholders = pricingModels.map(() => '?').join(',');
        whereConditions.push(`EXISTS (SELECT 1 FROM ai_service_pricing_models aspm INNER JOIN pricing_models pm ON aspm.pricing_model_id = pm.id WHERE aspm.ai_service_id = ai_services.id AND pm.model_name IN (${placeholders}))`);
        queryParams.push(...pricingModels);
      }

      if (ai_type) {
        const aiTypes = ai_type.split(',').map(type => type.trim());
        const placeholders = aiTypes.map(() => '?').join(',');
        whereConditions.push(`EXISTS (SELECT 1 FROM ai_service_types ast INNER JOIN ai_types at ON ast.ai_type_id = at.id WHERE ast.ai_service_id = ai_services.id AND at.type_name IN (${placeholders}))`);
        queryParams.push(...aiTypes);
      }

      if (difficulty_level) {
        const difficultyLevels = difficulty_level.split(',').map(level => level.trim());
        const placeholders = difficultyLevels.map(() => '?').join(',');
        whereConditions.push(`ai_services.difficulty_level IN (${placeholders})`);
        queryParams.push(...difficultyLevels);
      }

      if (nationality) {
        if (nationality === 'domestic') {
          whereConditions.push('ai_services.headquarters = ?');
          queryParams.push('대한민국');
        } else if (nationality === 'overseas') {
          whereConditions.push('(ai_services.headquarters IS NULL OR ai_services.headquarters != ?)');
          queryParams.push('대한민국');
        }
      }

      const whereClause = whereConditions.join(' AND ');

      // 전체 개수 조회
      const [countResult] = await connection.execute<RowDataPacket[]>(
        `SELECT COUNT(DISTINCT ai_services.id) as total FROM ai_services WHERE ${whereClause}`,
        queryParams
      );

      const total = countResult[0]?.['total'] || 0;
      const totalPages = Math.ceil(total / limit);

      // AI 서비스 목록 조회 (정렬 옵션 적용)
      let orderByClause = 'ai_services.created_at DESC';
      
      if (sort === 'popular') {
        orderByClause = 'ai_services.view_count DESC, ai_services.created_at DESC';
      } else if (sort === 'latest') {
        orderByClause = 'ai_services.created_at DESC';
      } else if (sort === 'name') {
        orderByClause = 'ai_services.ai_name ASC';
      } else if (category_id) {
        orderByClause = `
          CASE WHEN cdo.display_order IS NOT NULL THEN 0 ELSE 1 END,
          cdo.display_order ASC,
          ai_services.created_at DESC
        `;
      }
      
      let serviceQuery = `SELECT DISTINCT ai_services.*, 
                COALESCE(ai_services.ai_name_en, '') as ai_name_en,
                mc.id as main_category_id,
                mc.category_name as main_category_name`;
      
      if (userId) {
        serviceQuery += `,
                CASE WHEN uf.id IS NOT NULL THEN true ELSE false END as is_bookmarked`;
      }
      
      serviceQuery += `
         FROM ai_services 
         LEFT JOIN ai_service_categories main_ascat ON ai_services.id = main_ascat.ai_service_id AND main_ascat.is_main_category = 1
         LEFT JOIN categories mc ON main_ascat.category_id = mc.id
         ${category_id && !sort ? 'LEFT JOIN ai_service_category_display_order cdo ON ai_services.id = cdo.ai_service_id AND cdo.category_id = ?' : ''}`;
      
      if (userId) {
        serviceQuery += `
         LEFT JOIN user_favorite_services uf ON ai_services.id = uf.ai_service_id AND uf.user_id = ?`;
      }
      
      serviceQuery += `
         WHERE ${whereClause} 
         ORDER BY ${orderByClause}
         LIMIT ? OFFSET ?`;
      
      const serviceQueryParams = [];
      if (category_id && !sort) {
        serviceQueryParams.push(category_id);
      }
      if (userId) {
        serviceQueryParams.push(userId);
      }
      serviceQueryParams.push(...queryParams, limit, offset);
      
      const [services] = await connection.execute<RowDataPacket[]>(serviceQuery, serviceQueryParams);

      // 카테고리 정보 포함
      const servicesWithCategories = [];
      for (const service of services) {
        let serviceData = { ...service };
        
        // 대표 카테고리 정보 추가
        serviceData['category_id'] = service['main_category_id'];
        serviceData['category_name'] = service['main_category_name'];
        
        if (include_categories) {
          const [categories] = await connection.execute<RowDataPacket[]>(
            `SELECT c.id, c.category_name, c.parent_id, ascat.is_main_category,
                    p.category_name as parent_category_name
             FROM categories c 
             INNER JOIN ai_service_categories ascat ON c.id = ascat.category_id 
             LEFT JOIN categories p ON c.parent_id = p.id
             WHERE ascat.ai_service_id = ?`,
            [service['id']]
          );
          serviceData['categories'] = categories;
        } else {
          // include_categories가 false인 경우도 모든 카테고리 정보 제공
          const [categories] = await connection.execute<RowDataPacket[]>(
            `SELECT c.id, c.category_name, ascat.is_main_category
             FROM ai_service_categories ascat
             INNER JOIN categories c ON ascat.category_id = c.id
             WHERE ascat.ai_service_id = ?
             ORDER BY ascat.is_main_category DESC, c.category_name`,
            [service['id']]
          );
          serviceData['categories'] = categories;
        }
        
        // 태그 정보 포함
        const [tags] = await connection.execute<RowDataPacket[]>(
          `SELECT t.id, t.tag_name
           FROM tags t
           INNER JOIN ai_service_tags ast ON t.id = ast.tag_id
           WHERE ast.ai_service_id = ?
           ORDER BY t.tag_name`,
          [service['id']]
        );
        serviceData['tags'] = tags.map(tag => tag['tag_name']).join(' #');
        if (serviceData['tags']) serviceData['tags'] = '#' + serviceData['tags'];
        serviceData['tag_ids'] = tags.map(tag => tag['id']);
        
        // AI 타입 정보 포함
        const [aiTypes] = await connection.execute<RowDataPacket[]>(
          `SELECT at.type_name
           FROM ai_types at
           INNER JOIN ai_service_types ast ON at.id = ast.ai_type_id
           WHERE ast.ai_service_id = ?
           ORDER BY at.type_name`,
          [service['id']]
        );
        serviceData['ai_types'] = aiTypes.map(type => type['type_name']);
        serviceData['ai_type'] = aiTypes.map(type => type['type_name']).join(', '); // 호환성을 위한 필드
        
        // 가격 모델 정보 포함
        const [pricingModels] = await connection.execute<RowDataPacket[]>(
          `SELECT pm.model_name
           FROM pricing_models pm
           INNER JOIN ai_service_pricing_models aspm ON pm.id = aspm.pricing_model_id
           WHERE aspm.ai_service_id = ?
           ORDER BY pm.model_name`,
          [service['id']]
        );
        serviceData['pricing_models'] = pricingModels.map(model => model['model_name']);
        
        // 타겟 타입 정보 포함
        const [targetTypes] = await connection.execute<RowDataPacket[]>(
          `SELECT tt.type_code, tt.type_name
           FROM target_types tt
           INNER JOIN ai_service_target_types astt ON tt.id = astt.target_type_id
           WHERE astt.ai_service_id = ?
           ORDER BY tt.type_code`,
          [service['id']]
        );
        serviceData['target_types'] = targetTypes.map(type => ({ code: type['type_code'], name: type['type_name'] }));
        
        // 유사 서비스 정보 포함
        const [similarServices] = await connection.execute<RowDataPacket[]>(
          `SELECT s.id, s.ai_name, COALESCE(s.ai_name_en, '') as ai_name_en, s.ai_logo, s.company_name
           FROM ai_services s
           INNER JOIN ai_service_similar_services ass ON s.id = ass.similar_service_id
           WHERE ass.ai_service_id = ?
           ORDER BY s.ai_name`,
          [service['id']]
        );
        serviceData['similar_services_list'] = similarServices;
        
        // 콘텐츠 정보 포함
        const [contents] = await connection.execute<RowDataPacket[]>(
          `SELECT content_type, content_title, content_text, content_order
           FROM ai_service_contents
           WHERE ai_service_id = ?
           ORDER BY content_order`,
          [service['id']]
        );
        serviceData['contents'] = contents;
        
        // flag_icon 추가
        const headquarters = serviceData['headquarters'];
        const baseUrl = process.env.BASE_URL || 'https://stepai-admin-production.up.railway.app';
        if (headquarters) {
          const flagPath = path.join(process.cwd(), 'public/uploads/icons', `${headquarters}.png`);
          if (fs.existsSync(flagPath)) {
            serviceData['flag_icon'] = `${baseUrl}/uploads/icons/${headquarters}.png`;
          } else {
            serviceData['flag_icon'] = `${baseUrl}/uploads/icons/국가없음.png`;
          }
        } else {
          serviceData['flag_icon'] = `${baseUrl}/uploads/icons/국가없음.png`;
        }
        
        // 북마크 정보 추가
        if (userId) {
          serviceData['is_bookmarked'] = !!service['is_bookmarked'];
        }
        
        // ai_service_id 필드 추가
        serviceData['ai_service_id'] = serviceData['id'];
        
        servicesWithCategories.push(serviceData);
      }

      res.json({
        success: true,
        data: {
          data: servicesWithCategories,
          pagination: {
            page,
            limit,
            total,
            totalPages
          }
        }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching AI services:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      query_params: {
        page: page,
        limit: limit,
        search: search,
        category_id: category_id,
        ai_status: ai_status,
        is_step_pick: is_step_pick,
        include_categories: include_categories
      }
    });
    res.status(500).json({
      success: false,
      error: 'AI 서비스 조회 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});



// 엑셀 다운로드 엔드포인트
router.get('/download-excel', async (req, res) => {
  try {
    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      const [services] = await connection.execute<RowDataPacket[]>(
        `SELECT s.*, 
                GROUP_CONCAT(DISTINCT at.type_name SEPARATOR ', ') as ai_types,
                GROUP_CONCAT(DISTINCT pm.model_name SEPARATOR ', ') as pricing_models,
                GROUP_CONCAT(DISTINCT tt.type_code SEPARATOR ', ') as target_types,
                GROUP_CONCAT(DISTINCT c.category_name SEPARATOR ', ') as categories,
                GROUP_CONCAT(DISTINCT t.tag_name SEPARATOR ', ') as tag_names
         FROM ai_services s
         LEFT JOIN ai_service_types ast ON s.id = ast.ai_service_id
         LEFT JOIN ai_types at ON ast.ai_type_id = at.id
         LEFT JOIN ai_service_pricing_models aspm ON s.id = aspm.ai_service_id
         LEFT JOIN pricing_models pm ON aspm.pricing_model_id = pm.id
         LEFT JOIN ai_service_target_types astt ON s.id = astt.ai_service_id
         LEFT JOIN target_types tt ON astt.target_type_id = tt.id
         LEFT JOIN ai_service_categories asc ON s.id = asc.ai_service_id
         LEFT JOIN categories c ON asc.category_id = c.id
         LEFT JOIN ai_service_tags ast2 ON s.id = ast2.ai_service_id
         LEFT JOIN tags t ON ast2.tag_id = t.id
         WHERE s.deleted_at IS NULL
         GROUP BY s.id
         ORDER BY s.created_at DESC`
      );
      
      // 샘플 데이터 생성
      const sampleData = [
        {
          '서비스명(국문)': 'ChatGPT',
          '서비스명(영문)': 'ChatGPT',
          '한줄설명': 'OpenAI의 대화형 인공지능 챗봇 서비스',
          '대표 URL': 'https://chat.openai.com',
          '로고(URL)': 'https://example.com/chatgpt-logo.png',
          '기업명(국문)': '오픈AI',
          '기업명(영문)': 'OpenAI',
          '임베디드 영상 URL': '',
          '본사': '미국',
          '주요기능': '대화형 AI 모델로 다양한 질문에 답변 제공',
          '타겟 사용자': '일반 사용자, 개발자, 연구자',
          '추천활용사례': '코드 작성, 글쓰기, 번역, 요약 등',
          'Price': '무료, 유료',
          '난이도': '초급',
          '사용': '웹, 모바일 앱',
          'Alive': 'Yes',
          '표시위치': 'STEP_PICK',
          'NEW': 'No',
          '형태': '웹, API',
          'Target': 'GEN, BUS',
          '메인 카테고리': 'AI 글쓰기',
          '서브 카테고리': '대화형에이전트, 개인어시스턴트',
          'Tags': '#AI글쓰기 #대화형에이전트 #개인어시스턴트'
        },
        {
          '서비스명(국문)': 'Claude',
          '서비스명(영문)': 'Claude',
          '한줄설명': 'Anthropic의 AI 어시스턴트',
          '대표 URL': 'https://claude.ai',
          '로고(URL)': 'https://example.com/claude-logo.png',
          '기업명(국문)': '안스로픽',
          '기업명(영문)': 'Anthropic',
          '임베디드 영상 URL': '',
          '본사': '미국',
          '주요기능': '안전하고 도움이 되는 AI 어시스턴트',
          '타겟 사용자': '전문가, 연구자, 비즈니스 사용자',
          '추천활용사례': '문서 작성, 데이터 분석, 코드 리뷰',
          'Price': '무료, 유료',
          '난이도': '중급',
          '사용': '웹',
          'Alive': 'Yes',
          '표시위치': '',
          'NEW': 'Yes',
          '형태': '웹',
          'Target': 'PRO, BUS',
          '메인 카테고리': 'AI 글쓰기',
          '서브 카테고리': '블로그/아티클, 학술/전문문서',
          'Tags': '#AI글쓰기 #블로그 #전문문서'
        }
      ];
      
      const excelData = sampleData;
      
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // 컨럼 너비 설정
      const columnWidths = [
        { wch: 20 }, // 서비스명(국문)
        { wch: 20 }, // 서비스명(영문)
        { wch: 40 }, // 한줄설명
        { wch: 30 }, // 대표 URL
        { wch: 30 }, // 로고(URL)
        { wch: 15 }, // 기업명(국문)
        { wch: 15 }, // 기업명(영문)
        { wch: 30 }, // 임베디드 영상 URL
        { wch: 10 }, // 본사
        { wch: 30 }, // 주요기능
        { wch: 25 }, // 타겟 사용자
        { wch: 30 }, // 추천활용사례
        { wch: 15 }, // Price
        { wch: 10 }, // 난이도
        { wch: 15 }, // 사용
        { wch: 8 },  // Alive
        { wch: 12 }, // 표시위치
        { wch: 8 },  // NEW
        { wch: 15 }, // 형태
        { wch: 12 }, // Target
        { wch: 20 }, // 메인 카테고리
        { wch: 30 }, // 서브 카테고리
        { wch: 40 }  // Tags
      ];
      
      worksheet['!cols'] = columnWidths;
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'AI_Services_Template');
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Disposition', 'attachment; filename="ai_services_template.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error downloading excel:', error);
    res.status(500).json({
      success: false,
      error: '엑셀 다운로드 중 오류가 발생했습니다.'
    });
  }
});

// 난이도 매핑 함수
const mapDifficultyLevel = (difficulty: string): string => {
  if (!difficulty) return 'beginner';
  const difficultyMap: { [key: string]: string } = {
    '초급': 'beginner',
    '중급': 'intermediate', 
    '고급': 'advanced'
  };
  return difficultyMap[difficulty.trim()] || 'beginner';
};

// 난이도 역매핑 함수 (다운로드용)
const mapDifficultyLevelReverse = (difficulty: string): string => {
  if (!difficulty) return '초급';
  const difficultyMap: { [key: string]: string } = {
    'beginner': '초급',
    'intermediate': '중급',
    'advanced': '고급'
  };
  return difficultyMap[difficulty.trim()] || '초급';
};

// Excel 업로드는 별도 라우터(excelUpload.ts)에서 처리

// AI 서비스 생성
router.post('/', authenticateAdmin, async (req: AdminAuthenticatedRequest, res) => {
  try {
    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const {
        ai_name, ai_name_en, ai_description, ai_website, ai_logo,
        company_name, company_name_en, embedded_video_url, headquarters,
        pricing_info, difficulty_level, usage_availability,
        nationality, is_visible, is_step_pick, is_new, categories, contents, sns,
        similar_service_ids, selected_tags, ai_type_ids, pricing_model_ids, target_type_ids
      } = req.body;
      
      // AI 서비스 생성 (새로운 스키마에 맞게 수정)
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO ai_services (
          ai_name, ai_name_en, ai_description, ai_website, ai_logo,
          company_name, company_name_en, embedded_video_url, headquarters,
          pricing_info, difficulty_level, usage_availability,
          nationality, ai_status, is_visible, is_step_pick, is_new
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ai_name, ai_name_en, ai_description, ai_website, ai_logo,
          company_name, company_name_en, embedded_video_url, headquarters,
          pricing_info, difficulty_level, usage_availability,
          nationality, 'active', is_visible, is_step_pick, is_new
        ]
      );
      
      const serviceId = result.insertId;
      
      // AI 타입 처리
      if (ai_type_ids && Array.isArray(ai_type_ids)) {
        for (const typeId of ai_type_ids) {
          await connection.execute(
            'INSERT IGNORE INTO ai_service_types (ai_service_id, ai_type_id) VALUES (?, ?)',
            [serviceId, typeId]
          );
        }
      }
      
      // 가격 모델 처리
      if (pricing_model_ids && Array.isArray(pricing_model_ids)) {
        for (const modelId of pricing_model_ids) {
          await connection.execute(
            'INSERT IGNORE INTO ai_service_pricing_models (ai_service_id, pricing_model_id) VALUES (?, ?)',
            [serviceId, modelId]
          );
        }
      }
      
      // 타겟 타입 처리
      if (target_type_ids && Array.isArray(target_type_ids)) {
        for (const targetId of target_type_ids) {
          await connection.execute(
            'INSERT IGNORE INTO ai_service_target_types (ai_service_id, target_type_id) VALUES (?, ?)',
            [serviceId, targetId]
          );
        }
      }
      
      // 콘텐츠 처리
      if (contents && Array.isArray(contents)) {
        for (const content of contents) {
          if (content.content_text && content.content_text.trim()) {
            await connection.execute(
              'INSERT INTO ai_service_contents (ai_service_id, content_type, content_title, content_text, content_order) VALUES (?, ?, ?, ?, ?)',
              [serviceId, content.content_type, content.content_title, content.content_text, content.content_order]
            );
          }
        }
      }
      
      // SNS 처리
      if (sns && Array.isArray(sns)) {
        for (const snsItem of sns) {
          if (snsItem.sns_url && snsItem.sns_url.trim()) {
            await connection.execute(
              'INSERT INTO ai_service_sns (ai_service_id, sns_type, sns_url, sns_order) VALUES (?, ?, ?, ?)',
              [serviceId, snsItem.sns_type, snsItem.sns_url, snsItem.sns_order]
            );
          }
        }
      }
      
      // 유사 서비스 관계 처리
      if (similar_service_ids && Array.isArray(similar_service_ids)) {
        for (const similarId of similar_service_ids) {
          await connection.execute(
            'INSERT IGNORE INTO ai_service_similar_services (ai_service_id, similar_service_id) VALUES (?, ?)',
            [serviceId, similarId]
          );
          await connection.execute(
            'INSERT IGNORE INTO ai_service_similar_services (ai_service_id, similar_service_id) VALUES (?, ?)',
            [similarId, serviceId]
          );
        }
      }
      
      // 태그 처리
      if (selected_tags && Array.isArray(selected_tags)) {
        for (const tagId of selected_tags) {
          await connection.execute(
            'INSERT IGNORE INTO ai_service_tags (ai_service_id, tag_id) VALUES (?, ?)',
            [serviceId, tagId]
          );
          // 태그 사용 횟수 증가
          await connection.execute(
            'UPDATE tags SET tag_count = tag_count + 1 WHERE id = ?',
            [tagId]
          );
        }
      }
      
      // 카테고리 처리
      if (categories && Array.isArray(categories)) {
        for (const category of categories) {
          await connection.execute(
            'INSERT IGNORE INTO ai_service_categories (ai_service_id, category_id, is_main_category) VALUES (?, ?, ?)',
            [serviceId, category.category_id, category.is_main]
          );
        }
      }
      
      await connection.commit();
      
      res.status(201).json({
        success: true,
        data: { id: serviceId },
        message: 'AI 서비스가 생성되었습니다.'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating AI service:', error);
    res.status(500).json({
      success: false,
      error: 'AI 서비스 생성 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 유사 서비스 추가
router.post('/:id/similar-services', authenticateAdmin, async (req: AdminAuthenticatedRequest, res) => {
  try {
    const serviceId = parseInt(req.params.id);
    const { similar_service_id } = req.body;
    
    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 양방향 관계 추가
      await connection.execute(
        'INSERT IGNORE INTO ai_service_similar_services (ai_service_id, similar_service_id) VALUES (?, ?)',
        [serviceId, similar_service_id]
      );
      await connection.execute(
        'INSERT IGNORE INTO ai_service_similar_services (ai_service_id, similar_service_id) VALUES (?, ?)',
        [similar_service_id, serviceId]
      );
      
      await connection.commit();
      
      res.json({
        success: true,
        message: '유사 서비스가 추가되었습니다.'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error adding similar service:', error);
    res.status(500).json({
      success: false,
      error: '유사 서비스 추가 중 오류가 발생했습니다.'
    });
  }
});

// 유사 서비스 제거
router.delete('/:id/similar-services/:similarId', authenticateAdmin, async (req: AdminAuthenticatedRequest, res) => {
  try {
    const serviceId = parseInt(req.params.id);
    const similarId = parseInt(req.params.similarId);
    
    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 양방향 관계 제거
      await connection.execute(
        'DELETE FROM ai_service_similar_services WHERE (ai_service_id = ? AND similar_service_id = ?) OR (ai_service_id = ? AND similar_service_id = ?)',
        [serviceId, similarId, similarId, serviceId]
      );
      
      await connection.commit();
      
      res.json({
        success: true,
        message: '유사 서비스가 제거되었습니다.'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error removing similar service:', error);
    res.status(500).json({
      success: false,
      error: '유사 서비스 제거 중 오류가 발생했습니다.'
    });
  }
});

// AI 서비스 삭제
router.delete('/:id', authenticateAdmin, async (req: AdminAuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 서비스 ID입니다.'
      });
    }

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 서비스 존재 확인
      const [existingServices] = await connection.execute<RowDataPacket[]>(
        'SELECT id FROM ai_services WHERE id = ? AND deleted_at IS NULL',
        [id]
      );
      
      if (existingServices.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'AI 서비스를 찾을 수 없습니다.'
        });
      }
      
      // 관련 데이터 삭제
      await connection.execute('DELETE FROM ai_service_types WHERE ai_service_id = ?', [id]);
      await connection.execute('DELETE FROM ai_service_pricing_models WHERE ai_service_id = ?', [id]);
      await connection.execute('DELETE FROM ai_service_target_types WHERE ai_service_id = ?', [id]);
      await connection.execute('DELETE FROM ai_service_contents WHERE ai_service_id = ?', [id]);
      await connection.execute('DELETE FROM ai_service_sns WHERE ai_service_id = ?', [id]);
      await connection.execute('DELETE FROM ai_service_similar_services WHERE ai_service_id = ? OR similar_service_id = ?', [id, id]);
      await connection.execute('DELETE FROM ai_service_tags WHERE ai_service_id = ?', [id]);
      await connection.execute('DELETE FROM ai_service_categories WHERE ai_service_id = ?', [id]);
      
      // 서비스 삭제 (소프트 삭제)
      await connection.execute(
        'UPDATE ai_services SET deleted_at = NOW() WHERE id = ?',
        [id]
      );
      
      await connection.commit();
      
      res.json({
        success: true,
        message: 'AI 서비스가 삭제되었습니다.'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting AI service:', error);
    res.status(500).json({
      success: false,
      error: 'AI 서비스 삭제 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// AI 서비스 수정
router.put('/:id', authenticateAdmin, async (req: AdminAuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const {
        ai_name, ai_name_en, ai_description, ai_website, ai_logo,
        company_name, company_name_en, embedded_video_url, headquarters,
        pricing_info, difficulty_level, usage_availability,
        nationality, is_visible, is_step_pick, is_new, categories, contents, sns,
        similar_service_ids, selected_tags, ai_type_ids, pricing_model_ids, target_type_ids
      } = req.body;
      
      // 동적 업데이트 쿼리 생성
      const updateFields = [];
      const updateValues = [];
      
      Object.keys(req.body).forEach(key => {
        if (['categories', 'contents', 'sns', 'similar_service_ids', 'selected_tags', 'ai_type_ids', 'pricing_model_ids', 'target_type_ids'].includes(key)) {
          return; // 관계 데이터는 별도 처리
        }
        updateFields.push(`${key} = ?`);
        updateValues.push(req.body[key]);
      });
      
      if (updateFields.length > 0) {
        updateFields.push('updated_at = NOW()');
        updateValues.push(id);
        
        await connection.execute(
          `UPDATE ai_services SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues
        );
      }
      
      // 관계 데이터가 제공된 경우만 삭제
      if (req.body.ai_type_ids !== undefined) {
        await connection.execute('DELETE FROM ai_service_types WHERE ai_service_id = ?', [id]);
      }
      if (req.body.pricing_model_ids !== undefined) {
        await connection.execute('DELETE FROM ai_service_pricing_models WHERE ai_service_id = ?', [id]);
      }
      if (req.body.target_type_ids !== undefined) {
        await connection.execute('DELETE FROM ai_service_target_types WHERE ai_service_id = ?', [id]);
      }
      if (req.body.contents !== undefined) {
        await connection.execute('DELETE FROM ai_service_contents WHERE ai_service_id = ?', [id]);
      }
      if (req.body.sns !== undefined) {
        await connection.execute('DELETE FROM ai_service_sns WHERE ai_service_id = ?', [id]);
      }
      
      // AI 타입 처리
      if (ai_type_ids && Array.isArray(ai_type_ids)) {
        for (const typeId of ai_type_ids) {
          await connection.execute(
            'INSERT IGNORE INTO ai_service_types (ai_service_id, ai_type_id) VALUES (?, ?)',
            [id, typeId]
          );
        }
      }
      
      // 가격 모델 처리
      if (pricing_model_ids && Array.isArray(pricing_model_ids)) {
        for (const modelId of pricing_model_ids) {
          await connection.execute(
            'INSERT IGNORE INTO ai_service_pricing_models (ai_service_id, pricing_model_id) VALUES (?, ?)',
            [id, modelId]
          );
        }
      }
      
      // 타겟 타입 처리
      if (target_type_ids && Array.isArray(target_type_ids)) {
        for (const targetId of target_type_ids) {
          await connection.execute(
            'INSERT IGNORE INTO ai_service_target_types (ai_service_id, target_type_id) VALUES (?, ?)',
            [id, targetId]
          );
        }
      }
      
      // 콘텐츠 처리
      if (contents && Array.isArray(contents)) {
        for (const content of contents) {
          if (content.content_text && content.content_text.trim()) {
            await connection.execute(
              'INSERT INTO ai_service_contents (ai_service_id, content_type, content_title, content_text, content_order) VALUES (?, ?, ?, ?, ?)',
              [id, content.content_type, content.content_title, content.content_text, content.content_order]
            );
          }
        }
      }
      
      // SNS 처리
      if (sns && Array.isArray(sns)) {
        for (const snsItem of sns) {
          if (snsItem.sns_url && snsItem.sns_url.trim()) {
            await connection.execute(
              'INSERT INTO ai_service_sns (ai_service_id, sns_type, sns_url, sns_order) VALUES (?, ?, ?, ?)',
              [id, snsItem.sns_type, snsItem.sns_url, snsItem.sns_order]
            );
          }
        }
      }
      
      // 유사 서비스 처리
      if (req.body.similar_service_ids !== undefined) {
        await connection.execute(
          'DELETE FROM ai_service_similar_services WHERE ai_service_id = ? OR similar_service_id = ?',
          [id, id]
        );
      }
      
      // 새 유사 서비스 관계 추가
      if (similar_service_ids && Array.isArray(similar_service_ids)) {
        for (const similarId of similar_service_ids) {
          await connection.execute(
            'INSERT IGNORE INTO ai_service_similar_services (ai_service_id, similar_service_id) VALUES (?, ?)',
            [id, similarId]
          );
          await connection.execute(
            'INSERT IGNORE INTO ai_service_similar_services (ai_service_id, similar_service_id) VALUES (?, ?)',
            [similarId, id]
          );
        }
      }
      
      // 태그 처리
      if (req.body.selected_tags !== undefined) {
        await connection.execute('DELETE FROM ai_service_tags WHERE ai_service_id = ?', [id]);
      }
      if (selected_tags && Array.isArray(selected_tags)) {
        for (const tagId of selected_tags) {
          await connection.execute(
            'INSERT IGNORE INTO ai_service_tags (ai_service_id, tag_id) VALUES (?, ?)',
            [id, tagId]
          );
        }
      }
      
      // 카테고리 처리
      if (req.body.categories !== undefined) {
        await connection.execute('DELETE FROM ai_service_categories WHERE ai_service_id = ?', [id]);
      }
      if (categories && Array.isArray(categories)) {
        for (const category of categories) {
          await connection.execute(
            'INSERT IGNORE INTO ai_service_categories (ai_service_id, category_id, is_main_category) VALUES (?, ?, ?)',
            [id, category.category_id, category.is_main]
          );
        }
      }
      
      await connection.commit();
      
      res.json({
        success: true,
        message: 'AI 서비스가 수정되었습니다.'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating AI service:', error);
    res.status(500).json({
      success: false,
      error: 'AI 서비스 수정 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

export default router;