import express from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getDatabaseConnection } from '../configs/database';

const router = express.Router();

// 메인페이지용 큐레이션 조회
router.get('/main', async (req, res) => {
  try {
    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      // 모든 활성 큐레이션 조회
      const [curations] = await connection.execute<RowDataPacket[]>(
        `SELECT c.id, c.curation_title, c.curation_description, c.curation_order
         FROM curations c
         WHERE c.curation_status = 'active' AND c.deleted_at IS NULL
         ORDER BY c.curation_order ASC`
      );

      const result = {};
      
      for (const curation of curations) {
        try {
          // 각 큐레이션의 AI 서비스 조회
          const [aiServices] = await connection.execute<RowDataPacket[]>(
            `SELECT a.id, a.ai_name, a.ai_description, a.ai_logo, a.company_name, a.pricing_model,
                    cas.service_order
             FROM ai_services a
             INNER JOIN curation_ai_services cas ON a.id = cas.ai_service_id
             WHERE cas.curation_id = ? AND a.deleted_at IS NULL
             ORDER BY cas.service_order ASC`,
            [curation.id]
          );

          // 각 AI 서비스의 카테고리 및 태그 조회
          const servicesWithCategories = [];
          for (const service of aiServices) {
            try {
              const [categories] = await connection.execute<RowDataPacket[]>(
                `SELECT cat.id, cat.category_name
                 FROM categories cat
                 INNER JOIN ai_service_categories asc ON cat.id = asc.category_id
                 WHERE asc.ai_service_id = ?`,
                [service.id]
              );
              
              // 태그 정보 추가
              const [tags] = await connection.execute<RowDataPacket[]>(
                `SELECT t.id, t.tag_name
                 FROM tags t
                 INNER JOIN ai_service_tags ast ON t.id = ast.tag_id
                 WHERE ast.ai_service_id = ?
                 ORDER BY t.tag_name`,
                [service.id]
              );
              service['tags'] = tags.map(tag => tag['tag_name']).join(' #');
              if (service['tags']) service['tags'] = '#' + service['tags'];
              service['tag_ids'] = tags.map(tag => tag['id']);
              
              servicesWithCategories.push({
                ...service,
                categories: categories || []
              });
            } catch (categoryError) {
              console.error('Category query error:', categoryError);
              servicesWithCategories.push({
                ...service,
                categories: []
              });
            }
          }

          // 큐레이션 제목에 따라 분류
          const title = (curation.curation_title || '').toLowerCase();
          if (title.includes('popular') || title.includes('인기') || title.includes('많이')) {
            result['popular'] = servicesWithCategories;
          } else if (title.includes('latest') || title.includes('최신') || title.includes('등록')) {
            result['latest'] = servicesWithCategories;
          } else if (title.includes('pick') || title.includes('추천')) {
            result['step-pick'] = servicesWithCategories;
          } else {
            // 기본값 설정
            if (!result['popular']) result['popular'] = servicesWithCategories;
          }
        } catch (serviceError) {
          console.error('Service query error for curation:', curation.id, serviceError);
        }
      }

      // 기본값 설정
      if (!result['popular']) result['popular'] = [];
      if (!result['latest']) result['latest'] = [];
      if (!result['step-pick']) result['step-pick'] = [];

      res.json({
        success: true,
        data: result
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching main curations:', error);
    res.status(500).json({
      success: false,
      error: '큐레이션 조회 중 오류가 발생했습니다.'
    });
  }
});

// 큐레이션 목록 조회
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 10;
    const search = req.query['search'] as string;
    const curation_status = req.query['curation_status'] as string;
    const include_ai_services = req.query['include_ai_services'] === 'true';

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      const offset = (page - 1) * limit;
      const whereConditions: string[] = ['curations.deleted_at IS NULL'];
      const queryParams: any[] = [];

      if (search) {
        whereConditions.push('(curations.curation_title LIKE ? OR curations.curation_description LIKE ?)');
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      if (curation_status) {
        whereConditions.push('curations.curation_status = ?');
        queryParams.push(curation_status);
      }

      const whereClause = whereConditions.join(' AND ');

      // 전체 개수 조회
      const [countResult] = await connection.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as total FROM curations WHERE ${whereClause}`,
        queryParams
      );

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      // 큐레이션 목록 조회
      const [curations] = await connection.execute<RowDataPacket[]>(
        `SELECT * FROM curations WHERE ${whereClause} 
         ORDER BY curations.curation_order ASC, curations.created_at DESC LIMIT ? OFFSET ?`,
        [...queryParams, limit, offset]
      );

      // AI 서비스 정보 포함
      const curationsWithServices = [];
      for (const curation of curations) {
        let curationData = { ...curation };
        
        if (include_ai_services) {
          try {

            
            // 먼저 연결 테이블에서 서비스 ID들 조회
            const [serviceIds] = await connection.execute<RowDataPacket[]>(
              'SELECT ai_service_id, service_order FROM curation_ai_services WHERE curation_id = ? ORDER BY service_order ASC',
              [curation.id]
            );

            
            const aiServices = [];
            for (const serviceLink of serviceIds) {
              const [services] = await connection.execute<RowDataPacket[]>(
                'SELECT id, ai_name, ai_description, ai_logo, company_name, difficulty_level FROM ai_services WHERE id = ?',
                [serviceLink.ai_service_id]
              );
              
              if (services.length > 0) {
                const service = services[0];
                
                // 태그 정보 추가
                const [tags] = await connection.execute<RowDataPacket[]>(
                  `SELECT t.id, t.tag_name
                   FROM tags t
                   INNER JOIN ai_service_tags ast ON t.id = ast.tag_id
                   WHERE ast.ai_service_id = ?
                   ORDER BY t.tag_name`,
                  [service.id]
                );
                service['tags'] = tags.map(tag => tag['tag_name']).join(' #');
                if (service['tags']) service['tags'] = '#' + service['tags'];
                service['tag_ids'] = tags.map(tag => tag['id']);
                
                aiServices.push({
                  ...service,
                  service_order: serviceLink.service_order
                });
              }
            }
            
            curationData.ai_services = aiServices;
          } catch (serviceError) {
            console.error('AI services query error for curation:', curation.id, serviceError);
            curationData.ai_services = [];
          }
        }
        
        curationsWithServices.push(curationData);
      }

      res.json({
        success: true,
        data: {
          data: curationsWithServices,
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
    console.error('Error fetching curations:', error);
    res.status(500).json({
      success: false,
      error: '큐레이션 조회 중 오류가 발생했습니다.'
    });
  }
});

// 큐레이션 생성
router.post('/', async (req, res) => {
  try {
    const { 
      curation_title, 
      curation_description, 
      curation_thumbnail, 
      curation_order = 0,
      curation_status = 'active',
      ai_service_ids = []
    } = req.body;

    if (!curation_title) {
      return res.status(400).json({
        success: false,
        error: '큐레이션 제목은 필수입니다.'
      });
    }

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // 큐레이션 생성
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO curations (curation_title, curation_description, curation_thumbnail, 
                               curation_order, curation_status) 
         VALUES (?, ?, ?, ?, ?)`,
        [curation_title, curation_description || null, curation_thumbnail || null, 
         curation_order, curation_status]
      );

      const curationId = result.insertId;

      // AI 서비스 연결
      if (ai_service_ids && ai_service_ids.length > 0) {
        for (let i = 0; i < ai_service_ids.length; i++) {
          await connection.execute(
            'INSERT INTO curation_ai_services (curation_id, ai_service_id, service_order) VALUES (?, ?, ?)',
            [curationId, ai_service_ids[i], i + 1]
          );
        }
      }

      await connection.commit();

      res.status(201).json({
        success: true,
        data: { id: curationId },
        message: '큐레이션이 생성되었습니다.'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating curation:', error);
    res.status(500).json({
      success: false,
      error: '큐레이션 생성 중 오류가 발생했습니다.'
    });
  }
});

// 큐레이션 수정
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { 
      curation_title, 
      curation_description, 
      curation_thumbnail, 
      curation_order,
      curation_status,
      ai_service_ids = []
    } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다.'
      });
    }

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // 큐레이션 존재 확인
      const [existingCurations] = await connection.execute<RowDataPacket[]>(
        'SELECT id FROM curations WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existingCurations.length === 0) {
        return res.status(404).json({
          success: false,
          error: '큐레이션을 찾을 수 없습니다.'
        });
      }

      // 기본 정보 업데이트
      const updateFields: string[] = [];
      const updateParams: any[] = [];

      const fieldsToUpdate = [
        'curation_title', 'curation_description', 'curation_thumbnail', 
        'curation_order', 'curation_status'
      ];

      fieldsToUpdate.forEach(field => {
        if (req.body[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          updateParams.push(req.body[field]);
        }
      });

      if (updateFields.length > 0) {
        await connection.execute(
          `UPDATE curations SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
          [...updateParams, id]
        );
      }

      // AI 서비스 업데이트
      if (ai_service_ids !== undefined) {
        await connection.execute('DELETE FROM curation_ai_services WHERE curation_id = ?', [id]);
        if (ai_service_ids && ai_service_ids.length > 0) {
          for (let i = 0; i < ai_service_ids.length; i++) {
            await connection.execute(
              'INSERT INTO curation_ai_services (curation_id, ai_service_id, service_order) VALUES (?, ?, ?)',
              [id, ai_service_ids[i], i + 1]
            );
          }
        }
      }

      await connection.commit();

      res.json({
        success: true,
        message: '큐레이션이 수정되었습니다.'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating curation:', error);
    res.status(500).json({
      success: false,
      error: '큐레이션 수정 중 오류가 발생했습니다.'
    });
  }
});

// 큐레이션 삭제
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다.'
      });
    }

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      const [result] = await connection.execute<ResultSetHeader>(
        'UPDATE curations SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: '큐레이션을 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        message: '큐레이션이 삭제되었습니다.'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting curation:', error);
    res.status(500).json({
      success: false,
      error: '큐레이션 삭제 중 오류가 발생했습니다.'
    });
  }
});

export default router;