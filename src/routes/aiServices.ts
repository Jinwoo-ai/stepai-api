import express from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getDatabaseConnection } from '../configs/database';
import multer from 'multer';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

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
    const uploadPath = 'public/uploads/icons/';
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

// 아이콘 업로드 엔드포인트 (개선된 로컬 저장)
router.post('/upload-icon', imageUpload.single('icon'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '이미지 파일이 필요합니다.'
      });
    }

    // multer가 이미 파일명을 생성했으므로 그대로 사용
    const fileName = req.file.filename;
    const fileUrl = `/uploads/icons/${fileName}`;
    
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
    
    res.status(500).json({
      success: false,
      error: '아이콘 업로드 중 오류가 발생했습니다.'
    });
  }
});



// AI 서비스 검색
router.get('/search', async (req, res) => {
  try {
    const query = req.query['q'] as string;
    if (!query || query.trim().length < 1) {
      return res.json({ success: true, data: [] });
    }

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      const [services] = await connection.execute<RowDataPacket[]>(
        `SELECT id, ai_name, ai_name_en, ai_logo, company_name 
         FROM ai_services 
         WHERE (ai_name LIKE ? OR ai_name_en LIKE ? OR company_name LIKE ?) 
         AND deleted_at IS NULL AND ai_status = 'active'
         ORDER BY ai_name
         LIMIT 20`,
        [`%${query}%`, `%${query}%`, `%${query}%`]
      );
      
      res.json({ success: true, data: services });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error searching AI services:', error);
    res.status(500).json({
      success: false,
      error: 'AI 서비스 검색 중 오류가 발생했습니다.'
    });
  }
});

// AI 서비스 개별 조회
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const include_categories = req.query['include_categories'] === 'true';
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 서비스 ID입니다.'
      });
    }

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      // AI 서비스 기본 정보 조회
      const [services] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM ai_services WHERE id = ? AND deleted_at IS NULL',
        [id]
      );
      
      if (services.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'AI 서비스를 찾을 수 없습니다.'
        });
      }
      
      let serviceData = { ...services[0] };
      
      // 카테고리 정보 포함
      if (include_categories) {
        const [categories] = await connection.execute<RowDataPacket[]>(
          `SELECT c.id, c.category_name, c.parent_id, ac.is_main_category,
                  p.category_name as parent_category_name
           FROM categories c 
           INNER JOIN ai_service_categories ac ON c.id = ac.category_id 
           LEFT JOIN categories p ON c.parent_id = p.id
           WHERE ac.ai_service_id = ?`,
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
        `SELECT s.id, s.ai_name, s.ai_logo, s.company_name
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
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 10;
    const search = req.query['search'] as string;
    const category_id = req.query['category_id'] ? parseInt(req.query['category_id'] as string) : undefined;
    const ai_status = req.query['ai_status'] as string;
    const is_step_pick = req.query['is_step_pick'] as string;
    const include_categories = req.query['include_categories'] === 'true';

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      const offset = (page - 1) * limit;
      const whereConditions: string[] = ['ai_services.deleted_at IS NULL'];
      const queryParams: any[] = [];

      if (search) {
        whereConditions.push('(ai_services.ai_name LIKE ? OR ai_services.ai_description LIKE ?)');
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      if (category_id) {
        whereConditions.push('EXISTS (SELECT 1 FROM ai_service_categories ac WHERE ac.ai_service_id = ai_services.id AND ac.category_id = ?)');
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

      const whereClause = whereConditions.join(' AND ');

      // 전체 개수 조회
      const [countResult] = await connection.execute<RowDataPacket[]>(
        `SELECT COUNT(DISTINCT ai_services.id) as total FROM ai_services WHERE ${whereClause}`,
        queryParams
      );

      const total = countResult[0]?.['total'] || 0;
      const totalPages = Math.ceil(total / limit);

      // AI 서비스 목록 조회
      const [services] = await connection.execute<RowDataPacket[]>(
        `SELECT DISTINCT ai_services.* FROM ai_services WHERE ${whereClause} 
         ORDER BY ai_services.created_at DESC LIMIT ? OFFSET ?`,
        [...queryParams, limit, offset]
      );

      // 카테고리 정보 포함
      const servicesWithCategories = [];
      for (const service of services) {
        let serviceData = { ...service };
        
        if (include_categories) {
          const [categories] = await connection.execute<RowDataPacket[]>(
            `SELECT c.id, c.category_name, c.parent_id, ac.is_main_category,
                    p.category_name as parent_category_name
             FROM categories c 
             INNER JOIN ai_service_categories ac ON c.id = ac.category_id 
             LEFT JOIN categories p ON c.parent_id = p.id
             WHERE ac.ai_service_id = ?`,
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
          `SELECT s.id, s.ai_name, s.ai_logo, s.company_name
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
    res.status(500).json({
      success: false,
      error: 'AI 서비스 조회 중 오류가 발생했습니다.'
    });
  }
});

// 엑셀 업로드 엔드포인트
router.post('/upload-excel', upload.single('excel'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '엑셀 파일이 필요합니다.'
      });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return res.status(400).json({
        success: false,
        error: '엑셀 파일에 시트가 없습니다.'
      });
    }
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      let successCount = 0;
      let updateCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i] as any;
        
        try {
          // 필수 필드 검증
          if (!row['서비스명(국문)'] || !row['형태']) {
            errors.push(`행 ${i + 2}: 서비스명(국문)과 형태는 필수입니다.`);
            errorCount++;
            continue;
          }

          // 서비스명으로 기존 서비스 확인
          const [existingServices] = await connection.execute<RowDataPacket[]>(
            'SELECT id FROM ai_services WHERE ai_name = ? AND deleted_at IS NULL',
            [row['서비스명(국문)']]
          );

          let serviceId: number;
          let isUpdate = false;

          if (existingServices.length > 0) {
            // 기존 서비스 업데이트
            serviceId = existingServices[0]['id'];
            isUpdate = true;
            
            await connection.execute(
              `UPDATE ai_services SET
                ai_name_en = ?, ai_description = ?, ai_website = ?, ai_logo = ?,
                company_name = ?, company_name_en = ?, embedded_video_url = ?, headquarters = ?,
                main_features = ?, target_users = ?, use_cases = ?,
                pricing_info = ?, difficulty_level = ?, usage_availability = ?,
                is_visible = ?, is_step_pick = ?, updated_at = NOW()
               WHERE id = ?`,
              [
                row['서비스명(영문)'] || null,
                row['한줄설명'] || null,
                row['대표 URL'] || null,
                row['로고(URL)'] || null,
                row['기업명(국문)'] || null,
                row['기업명(영문)'] || null,
                row['임베디드 영상 URL'] || null,
                row['본사'] || null,
                row['주요기능'] || null,
                row['타겟 사용자'] || null,
                row['추천활용사례'] || null,
                row['Price'] || null,
                row['난이도'] || 'beginner',
                row['사용'] || null,
                row['Alive'] === 'Yes' || true,
                row['표시위치'] === 'STEP_PICK' || false,
                serviceId
              ]
            );
            
            // 기존 관계 데이터 삭제
            await connection.execute('DELETE FROM ai_service_types WHERE ai_service_id = ?', [serviceId]);
            await connection.execute('DELETE FROM ai_service_pricing_models WHERE ai_service_id = ?', [serviceId]);
            await connection.execute('DELETE FROM ai_service_target_types WHERE ai_service_id = ?', [serviceId]);
            await connection.execute('DELETE FROM ai_service_tags WHERE ai_service_id = ?', [serviceId]);
            await connection.execute('DELETE FROM ai_service_categories WHERE ai_service_id = ?', [serviceId]);
          } else {
            // 새 서비스 생성
            const [result] = await connection.execute<ResultSetHeader>(
              `INSERT INTO ai_services (
                ai_name, ai_name_en, ai_description, ai_website, ai_logo,
                company_name, company_name_en, embedded_video_url, headquarters,
                main_features, target_users, use_cases,
                pricing_info, difficulty_level, usage_availability,
                ai_status, is_visible, is_step_pick
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                row['서비스명(국문)'],
                row['서비스명(영문)'] || null,
                row['한줄설명'] || null,
                row['대표 URL'] || null,
                row['로고(URL)'] || null,
                row['기업명(국문)'] || null,
                row['기업명(영문)'] || null,
                row['임베디드 영상 URL'] || null,
                row['본사'] || null,
                row['주요기능'] || null,
                row['타겟 사용자'] || null,
                row['추천활용사례'] || null,
                row['Price'] || null,
                row['난이도'] || 'beginner',
                row['사용'] || null,
                'active',
                row['Alive'] === 'Yes' || true,
                row['표시위치'] === 'STEP_PICK' || false
              ]
            );
            serviceId = result.insertId!;
          }

          // AI 타입 처리 (형태 컬럼)
          if (row['형태']) {
            const aiTypes = row['형태'].toString().split(/[,;]/).map((type: string) => type.trim()).filter((type: string) => type);
            for (const aiType of aiTypes) {
              const [typeResult] = await connection.execute<RowDataPacket[]>(
                'SELECT id FROM ai_types WHERE type_name = ?',
                [aiType]
              );
              if (typeResult.length > 0) {
                await connection.execute(
                  'INSERT IGNORE INTO ai_service_types (ai_service_id, ai_type_id) VALUES (?, ?)',
                  [serviceId, typeResult[0]['id']]
                );
              }
            }
          }

          // 가격 모델 처리 (Price 컬럼)
          if (row['Price']) {
            const pricingModels = row['Price'].toString().split(/[,;]/).map((model: string) => model.trim()).filter((model: string) => model);
            for (const pricingModel of pricingModels) {
              let [modelResult] = await connection.execute<RowDataPacket[]>(
                'SELECT id FROM pricing_models WHERE model_name = ?',
                [pricingModel]
              );
              
              if (modelResult.length === 0) {
                // 새 가격 모델 생성
                const [newModel] = await connection.execute<ResultSetHeader>(
                  'INSERT INTO pricing_models (model_name) VALUES (?)',
                  [pricingModel]
                );
                modelResult = [{ id: newModel.insertId }] as RowDataPacket[];
              }
              
              await connection.execute(
                'INSERT IGNORE INTO ai_service_pricing_models (ai_service_id, pricing_model_id) VALUES (?, ?)',
                [serviceId, modelResult[0]['id']]
              );
            }
          }

          // 타겟 타입 처리 (Target 컬럼)
          if (row['Target']) {
            const targetTypes = row['Target'].toString().split(/[,;]/).map((type: string) => type.trim()).filter((type: string) => type);
            for (const targetType of targetTypes) {
              const [typeResult] = await connection.execute<RowDataPacket[]>(
                'SELECT id FROM target_types WHERE type_code = ?',
                [targetType]
              );
              if (typeResult.length > 0) {
                await connection.execute(
                  'INSERT IGNORE INTO ai_service_target_types (ai_service_id, target_type_id) VALUES (?, ?)',
                  [serviceId, typeResult[0]['id']]
                );
              }
            }
          }

          // 메인 카테고리 처리
          if (row['메인 카테고리']) {
            const [mainCategories] = await connection.execute<RowDataPacket[]>(
              'SELECT id FROM categories WHERE category_name = ? AND category_status = "active" AND parent_id IS NULL',
              [row['메인 카테고리']]
            );
            
            if (mainCategories.length > 0) {
              await connection.execute(
                'INSERT IGNORE INTO ai_service_categories (ai_service_id, category_id, is_main_category) VALUES (?, ?, ?)',
                [serviceId, mainCategories[0]['id'], true]
              );
            }
          }

          // 태그 처리 (Tags 컬럼에서 #으로 시작하는 태그들 추출)
          if (row['Tags']) {
            const tagText = row['Tags'].toString();
            const tagMatches = tagText.match(/#([^#\s]+)/g);
            
            if (tagMatches) {
              for (const tagMatch of tagMatches) {
                const tagName = tagMatch.substring(1); // # 제거
                
                // 태그가 존재하는지 확인
                let [existingTags] = await connection.execute<RowDataPacket[]>(
                  'SELECT id FROM tags WHERE tag_name = ?',
                  [tagName]
                );
                
                let tagId;
                if (existingTags.length > 0) {
                  tagId = existingTags[0]['id'];
                } else {
                  // 새 태그 생성
                  const [newTag] = await connection.execute<ResultSetHeader>(
                    'INSERT INTO tags (tag_name) VALUES (?)',
                    [tagName]
                  );
                  tagId = newTag.insertId;
                }
                
                // AI 서비스와 태그 연결
                await connection.execute(
                  'INSERT IGNORE INTO ai_service_tags (ai_service_id, tag_id) VALUES (?, ?)',
                  [serviceId, tagId]
                );
              }
            }
          }

          // 콘텐츠 정보 저장 (Rich Text 형태로)
          const contentTypes = [
            { type: 'target_users', title: '타겟 사용자', field: '타겟 사용자', order: 1 },
            { type: 'main_features', title: '주요 기능', field: '주요기능', order: 2 },
            { type: 'use_cases', title: '추천 활용사례', field: '추천활용사례', order: 3 }
          ];
          
          for (const contentType of contentTypes) {
            if (row[contentType.field]) {
              // 텍스트를 Rich Text HTML 형태로 변환
              const htmlContent = `<p>${row[contentType.field].toString().replace(/\n/g, '</p><p>')}</p>`;
              
              await connection.execute(
                'INSERT INTO ai_service_contents (ai_service_id, content_type, content_title, content_text, content_order) VALUES (?, ?, ?, ?, ?)',
                [serviceId, contentType.type, contentType.title, htmlContent, contentType.order]
              );
            }
          }

          if (isUpdate) {
            updateCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error(`Error processing row ${i + 2}:`, error);
          errors.push(`행 ${i + 2}: 처리 중 오류가 발생했습니다.`);
          errorCount++;
        }
      }

      await connection.commit();
      
      // 유사 서비스 연결 처리 (모든 AI 서비스 입력 후 별도 처리)
      await connection.beginTransaction();
      
      // 기존 유사 서비스 관계 모두 삭제
      await connection.execute('DELETE FROM ai_service_similar_services');
      
      for (let i = 0; i < data.length; i++) {
        const row = data[i] as any;
        
        if (row['서비스명(국문)'] && row['유사 서비스']) {
          const [currentService] = await connection.execute<RowDataPacket[]>(
            'SELECT id FROM ai_services WHERE ai_name = ? AND deleted_at IS NULL',
            [row['서비스명(국문)']]
          );
          
          if (currentService.length > 0) {
            const serviceId = currentService[0]['id'];
            const similarServicesText = row['유사 서비스'];
            const similarNames = similarServicesText.split(/[,;]/).map((name: string) => name.trim()).filter((name: string) => name);
            
            for (const similarName of similarNames) {
              const [matchingServices] = await connection.execute<RowDataPacket[]>(
                'SELECT id FROM ai_services WHERE ai_name = ? AND id != ? AND deleted_at IS NULL',
                [similarName, serviceId]
              );
              
              for (const matchingService of matchingServices) {
                await connection.execute(
                  'INSERT IGNORE INTO ai_service_similar_services (ai_service_id, similar_service_id) VALUES (?, ?)',
                  [serviceId, matchingService['id']]
                );
                await connection.execute(
                  'INSERT IGNORE INTO ai_service_similar_services (ai_service_id, similar_service_id) VALUES (?, ?)',
                  [matchingService['id'], serviceId]
                );
              }
            }
          }
        }
      }

      await connection.commit();

      // 업로드된 파일 삭제
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        message: `엑셀 업로드 완료: 신규 ${successCount}건, 업데이트 ${updateCount}건, 실패 ${errorCount}건`,
        data: {
          successCount,
          updateCount,
          errorCount,
          errors: errors.slice(0, 10)
        }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error uploading excel:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: '엑셀 업로드 중 오류가 발생했습니다.'
    });
  }
});

// AI 서비스 생성
router.post('/', async (req, res) => {
  try {
    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const {
        ai_name, ai_name_en, ai_description, ai_website, ai_logo,
        company_name, company_name_en, embedded_video_url, headquarters,
        pricing_info, difficulty_level, usage_availability,
        nationality, is_visible, is_step_pick, categories, contents, sns,
        similar_service_ids, selected_tags, ai_type_ids, pricing_model_ids, target_type_ids
      } = req.body;
      
      // AI 서비스 생성 (새로운 스키마에 맞게 수정)
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO ai_services (
          ai_name, ai_name_en, ai_description, ai_website, ai_logo,
          company_name, company_name_en, embedded_video_url, headquarters,
          pricing_info, difficulty_level, usage_availability,
          nationality, ai_status, is_visible, is_step_pick
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ai_name, ai_name_en, ai_description, ai_website, ai_logo,
          company_name, company_name_en, embedded_video_url, headquarters,
          pricing_info, difficulty_level, usage_availability,
          nationality, 'active', is_visible, is_step_pick
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
router.post('/:id/similar-services', async (req, res) => {
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
router.delete('/:id/similar-services/:similarId', async (req, res) => {
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
router.delete('/:id', async (req, res) => {
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
router.put('/:id', async (req, res) => {
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
        nationality, is_visible, is_step_pick, categories, contents, sns,
        similar_service_ids, selected_tags, ai_type_ids, pricing_model_ids, target_type_ids
      } = req.body;
      
      // AI 서비스 수정 (새로운 스키마에 맞게)
      await connection.execute(
        `UPDATE ai_services SET
          ai_name = ?, ai_name_en = ?, ai_description = ?, ai_website = ?, ai_logo = ?,
          company_name = ?, company_name_en = ?, embedded_video_url = ?, headquarters = ?,
          pricing_info = ?, difficulty_level = ?, usage_availability = ?,
          nationality = ?, is_visible = ?, is_step_pick = ?, updated_at = NOW()
         WHERE id = ?`,
        [
          ai_name, ai_name_en, ai_description, ai_website, ai_logo,
          company_name, company_name_en, embedded_video_url, headquarters,
          pricing_info, difficulty_level, usage_availability,
          nationality, is_visible, is_step_pick, id
        ]
      );
      
      // 기존 관계 데이터 삭제
      await connection.execute('DELETE FROM ai_service_types WHERE ai_service_id = ?', [id]);
      await connection.execute('DELETE FROM ai_service_pricing_models WHERE ai_service_id = ?', [id]);
      await connection.execute('DELETE FROM ai_service_target_types WHERE ai_service_id = ?', [id]);
      await connection.execute('DELETE FROM ai_service_contents WHERE ai_service_id = ?', [id]);
      await connection.execute('DELETE FROM ai_service_sns WHERE ai_service_id = ?', [id]);
      
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
      
      // 기존 유사 서비스 관계 삭제
      await connection.execute(
        'DELETE FROM ai_service_similar_services WHERE ai_service_id = ? OR similar_service_id = ?',
        [id, id]
      );
      
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
      
      // 기존 태그 관계 삭제 및 새 태그 추가
      await connection.execute('DELETE FROM ai_service_tags WHERE ai_service_id = ?', [id]);
      if (selected_tags && Array.isArray(selected_tags)) {
        for (const tagId of selected_tags) {
          await connection.execute(
            'INSERT IGNORE INTO ai_service_tags (ai_service_id, tag_id) VALUES (?, ?)',
            [id, tagId]
          );
        }
      }
      
      // 기존 카테고리 관계 삭제 및 새 카테고리 추가
      await connection.execute('DELETE FROM ai_service_categories WHERE ai_service_id = ?', [id]);
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