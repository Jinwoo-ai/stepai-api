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

// 엑셀 업로드 엔드포인트 (타임아웃 방지 개선 버전)
router.post('/upload-excel', upload.single('excel'), async (req, res) => {
  // 응답 타임아웃 설정 (5분)
  req.setTimeout(300000);
  res.setTimeout(300000);
  
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
      let successCount = 0;
      let updateCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // 배치 처리를 위한 청크 크기 설정
      const BATCH_SIZE = 5; // 더 작은 배치로 처리
      const totalRows = data.length;
      
      console.log(`총 ${totalRows}개 행을 ${BATCH_SIZE}개씩 배치 처리 시작`);
      
      for (let batchStart = 0; batchStart < totalRows; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, totalRows);
        const batch = data.slice(batchStart, batchEnd);
        
        // 배치별로 트랜잭션 처리
        await connection.beginTransaction();
        
        try {
          for (let i = 0; i < batch.length; i++) {
            const row = batch[i] as any;
            const actualRowIndex = batchStart + i;
            
            try {
              // 필수 필드 검증
              if (!row['서비스명(국문)'] || !row['형태']) {
                errors.push(`행 ${actualRowIndex + 2}: 서비스명(국문)과 형태는 필수입니다.`);
                errorCount++;
                continue;
              }

              // ai_name_en 기준으로 기존 서비스 확인 (없으면 ai_name으로 확인)
              let existingServices = [];
              if (row['서비스명(영문)']) {
                const [services] = await connection.execute<RowDataPacket[]>(
                  'SELECT id FROM ai_services WHERE ai_name_en = ? AND deleted_at IS NULL',
                  [row['서비스명(영문)']]
                );
                existingServices = services;
              }
              
              // ai_name_en으로 찾지 못했으면 ai_name으로 확인
              if (existingServices.length === 0) {
                const [services] = await connection.execute<RowDataPacket[]>(
                  'SELECT id FROM ai_services WHERE ai_name = ? AND deleted_at IS NULL',
                  [row['서비스명(국문)']]
                );
                existingServices = services;
              }

              let serviceId: number;
              let isUpdate = false;

              if (existingServices.length > 0) {
                // 기존 서비스 업데이트 (로고 보존)
                serviceId = existingServices[0]['id'];
                isUpdate = true;
                
                // 기존 로고 조회
                const [existingService] = await connection.execute<RowDataPacket[]>(
                  'SELECT ai_logo FROM ai_services WHERE id = ?',
                  [serviceId]
                );
                const existingLogo = existingService[0]?.ai_logo;
                
                // 로고 URL이 있으면 새 값 사용, 없으면 기존 값 유지
                const logoToUse = row['로고(URL)'] ? row['로고(URL)'] : existingLogo;
                
                await connection.execute(
                  `UPDATE ai_services SET
                    ai_name_en = ?, ai_description = ?, ai_website = ?, ai_logo = ?,
                    company_name = ?, company_name_en = ?, embedded_video_url = ?, headquarters = ?,
                    main_features = ?, target_users = ?, use_cases = ?,
                    pricing_info = ?, difficulty_level = ?, usage_availability = ?,
                    is_visible = ?, is_step_pick = ?, is_new = ?, updated_at = NOW()
                   WHERE id = ?`,
                  [
                    row['서비스명(영문)'] || null,
                    row['한줄설명'] || null,
                    row['대표 URL'] || null,
                    logoToUse,
                    row['기업명(국문)'] || null,
                    row['기업명(영문)'] || null,
                    row['임베디드 영상 URL'] || null,
                    row['본사'] || null,
                    row['주요기능'] || null,
                    row['타겟 사용자'] || null,
                    row['추천활용사례'] || null,
                    row['Price'] || null,
                    mapDifficultyLevel(row['난이도']) || 'beginner',
                    row['사용'] || null,
                    row['Alive'] === 'Yes' || true,
                    row['표시위치'] === 'STEP_PICK' || false,
                    row['NEW'] === 'Yes' || false,
                    serviceId
                  ]
                );
                
                // 기존 관계 데이터 삭제 (카테고리 포함)
                await connection.execute('DELETE FROM ai_service_types WHERE ai_service_id = ?', [serviceId]);
                await connection.execute('DELETE FROM ai_service_pricing_models WHERE ai_service_id = ?', [serviceId]);
                await connection.execute('DELETE FROM ai_service_target_types WHERE ai_service_id = ?', [serviceId]);
                await connection.execute('DELETE FROM ai_service_tags WHERE ai_service_id = ?', [serviceId]);
                await connection.execute('DELETE FROM ai_service_categories WHERE ai_service_id = ?', [serviceId]);
                await connection.execute('DELETE FROM ai_service_contents WHERE ai_service_id = ?', [serviceId]);
              } else {
                // 새 서비스 생성
                const [result] = await connection.execute<ResultSetHeader>(
                  `INSERT INTO ai_services (
                    ai_name, ai_name_en, ai_description, ai_website, ai_logo,
                    company_name, company_name_en, embedded_video_url, headquarters,
                    main_features, target_users, use_cases,
                    pricing_info, difficulty_level, usage_availability,
                    ai_status, is_visible, is_step_pick, is_new
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
                    mapDifficultyLevel(row['난이도']) || 'beginner',
                    row['사용'] || null,
                    'active',
                    row['Alive'] === 'Yes' || true,
                    row['표시위치'] === 'STEP_PICK' || false,
                    row['NEW'] === 'Yes' || false
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

              // 메인 카테고리 처리 (대표 카테고리로 설정)
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

              // 서브 카테고리 처리 (대표 카테고리 아님)
              if (row['서브 카테고리']) {
                const subCategoryNames = row['서브 카테고리'].toString().split(/[,;]/).map((name: string) => name.trim()).filter((name: string) => name);
                
                for (const subCategoryName of subCategoryNames) {
                  // 서브 카테고리 존재 확인 (모든 카테고리에서 검색)
                  const [subCategories] = await connection.execute<RowDataPacket[]>(
                    'SELECT id FROM categories WHERE category_name = ? AND category_status = "active"',
                    [subCategoryName]
                  );
                  
                  if (subCategories.length > 0) {
                    await connection.execute(
                      'INSERT IGNORE INTO ai_service_categories (ai_service_id, category_id, is_main_category) VALUES (?, ?, ?)',
                      [serviceId, subCategories[0]['id'], false]
                    );
                  }
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
              console.error(`Error processing row ${actualRowIndex + 2}:`, error);
              errors.push(`행 ${actualRowIndex + 2}: 처리 중 오류가 발생했습니다.`);
              errorCount++;
            }
          }
          
          await connection.commit();
          console.log(`배치 ${Math.floor(batchStart / BATCH_SIZE) + 1}/${Math.ceil(totalRows / BATCH_SIZE)} 완료`);
          
        } catch (batchError) {
          await connection.rollback();
          console.error(`배치 처리 오류:`, batchError);
          // 배치 전체 실패 시 해당 배치의 모든 행을 오류로 처리
          for (let i = 0; i < batch.length; i++) {
            errors.push(`행 ${batchStart + i + 2}: 배치 처리 중 오류가 발생했습니다.`);
            errorCount++;
          }
        }
      }
      
      // 유사 서비스 연결 처리 (모든 AI 서비스 입력 후 별도 처리)
      console.log('유사 서비스 처리 시작...');
      await connection.beginTransaction();
      
      try {
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
        console.log('유사 서비스 처리 완료');
      } catch (similarError) {
        await connection.rollback();
        console.error('유사 서비스 처리 오류:', similarError);
      }

      // 업로드된 파일 삭제
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        message: `엑셀 업로드 완료: 신규 ${successCount}건, 업데이트 ${updateCount}건, 실패 ${errorCount}건 (배치 처리로 성능 최적화)`,
        data: {
          successCount,
          updateCount,
          errorCount,
          errors: errors.slice(0, 10),
          description: '엑셀 업로드 시 주의사항:\n\n필드 설명:\n- 서비스명(국문): 필수 필드\n- 서비스명(영문): 중복 확인 기준\n- 로고(URL): AI 서비스 로고 이미지 URL\n- 난이도: 초급/중급/고급 입력\n- Alive: Yes/No (서비스 활성 상태)\n- 표시위치: STEP_PICK 또는 빈값 (메인페이지 STEP PICK 섹션 표시)\n- NEW: Yes/No (신규 서비스 표시 - 카드에 NEW 뱃지 표시)\n- 메인 카테고리: 대표 카테고리 1개\n- 서브 카테고리: 콤마로 구분하여 여러 개 (메인 카테고리 외 추가 분류)\n- 형태: AI 타입 (콤마로 구분)\n- Tags: #으로 시작하는 태그\n\n주의사항:\n- 로고(URL) 필드에 이미지 URL 입력 시 자동으로 ai_logo에 저장됨\n- 서비스명(영문) 기준으로 중복 확인 후 업데이트\n- 배치 처리로 타임아웃 방지 및 성능 최적화'
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

export default router;