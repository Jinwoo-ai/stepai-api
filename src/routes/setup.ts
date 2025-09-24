import express from 'express';
import { pool } from '../configs/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = express.Router();

/**
 * @swagger
 * /api/setup/category-display-order:
 *   post:
 *     summary: 카테고리 표시 순서 테이블 생성 및 초기화
 *     tags: [Setup]
 *     responses:
 *       200:
 *         description: 성공
 */
router.post('/category-display-order', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // 1. 테이블 존재 여부 확인
    const [tableCheck] = await connection.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as table_exists 
       FROM information_schema.tables 
       WHERE table_schema = 'STEPAI' 
       AND table_name = 'ai_service_category_display_order'`
    );

    const tableExists = tableCheck[0].table_exists > 0;

    if (!tableExists) {
      // 2. 테이블 생성
      await connection.execute(`
        CREATE TABLE ai_service_category_display_order (
          id INT AUTO_INCREMENT PRIMARY KEY,
          category_id INT NOT NULL,
          ai_service_id INT NOT NULL,
          display_order INT NOT NULL DEFAULT 0,
          is_featured BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
          FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE,
          UNIQUE KEY unique_category_service_order (category_id, ai_service_id),
          INDEX idx_category_display_order (category_id, display_order),
          INDEX idx_category_featured (category_id, is_featured, display_order)
        )
      `);
    }

    // 3. 기존 데이터 확인
    const [dataCheck] = await connection.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as data_count FROM ai_service_category_display_order'
    );

    const hasData = dataCheck[0].data_count > 0;

    if (!hasData) {
      // 4. 기존 ai_service_categories에서 데이터 마이그레이션
      await connection.execute(`
        INSERT IGNORE INTO ai_service_category_display_order (category_id, ai_service_id, display_order)
        SELECT 
          category_id, 
          ai_service_id, 
          ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY created_at) as display_order
        FROM ai_service_categories
        WHERE category_id IS NOT NULL AND ai_service_id IS NOT NULL
      `);
    }

    // 5. 결과 확인
    const [result] = await connection.execute<RowDataPacket[]>(`
      SELECT 
        c.category_name,
        COUNT(asdo.id) as service_count
      FROM categories c
      LEFT JOIN ai_service_category_display_order asdo ON c.id = asdo.category_id
      GROUP BY c.id, c.category_name
      ORDER BY service_count DESC
      LIMIT 10
    `);

    await connection.commit();

    res.json({
      success: true,
      message: '카테고리 표시 순서 테이블이 성공적으로 설정되었습니다.',
      data: {
        tableExists: tableExists,
        hadData: hasData,
        categoryStats: result
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('카테고리 표시 순서 테이블 설정 실패:', error);
    res.status(500).json({
      success: false,
      error: '카테고리 표시 순서 테이블 설정에 실패했습니다.',
      details: error instanceof Error ? error.message : String(error)
    });
  } finally {
    connection.release();
  }
});

/**
 * @swagger
 * /api/setup/homepage-settings:
 *   post:
 *     summary: 메인페이지 설정 테이블 생성 및 초기화
 *     tags: [Setup]
 *     responses:
 *       200:
 *         description: 성공
 */
router.post('/homepage-settings', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // 메인페이지 설정 테이블들 생성
    const createTablesSQL = `
      -- 메인페이지 영상 설정 테이블
      CREATE TABLE IF NOT EXISTS homepage_videos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ai_video_id INT NOT NULL,
        display_order INT NOT NULL DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (ai_video_id) REFERENCES ai_videos(id) ON DELETE CASCADE,
        UNIQUE KEY unique_homepage_video (ai_video_id),
        INDEX idx_homepage_video_order (display_order, is_active)
      );

      -- 메인페이지 큐레이션 순서 설정 테이블
      CREATE TABLE IF NOT EXISTS homepage_curations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        curation_id INT NOT NULL,
        display_order INT NOT NULL DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (curation_id) REFERENCES curations(id) ON DELETE CASCADE,
        UNIQUE KEY unique_homepage_curation (curation_id),
        INDEX idx_homepage_curation_order (display_order, is_active)
      );

      -- 메인페이지 STEP PICK 서비스 설정 테이블
      CREATE TABLE IF NOT EXISTS homepage_step_pick_services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ai_service_id INT NOT NULL,
        display_order INT NOT NULL DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE,
        UNIQUE KEY unique_homepage_step_pick (ai_service_id),
        INDEX idx_homepage_step_pick_order (display_order, is_active)
      );

      -- 트렌드 섹션 설정 테이블
      CREATE TABLE IF NOT EXISTS trend_sections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        section_type VARCHAR(50) NOT NULL,
        section_title VARCHAR(100) NOT NULL,
        section_description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        display_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_trend_section (section_type)
      );

      -- 트렌드 섹션별 AI 서비스 설정 테이블
      CREATE TABLE IF NOT EXISTS trend_section_services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        trend_section_id INT NOT NULL,
        ai_service_id INT NOT NULL,
        display_order INT NOT NULL DEFAULT 0,
        is_featured BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (trend_section_id) REFERENCES trend_sections(id) ON DELETE CASCADE,
        FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE,
        UNIQUE KEY unique_trend_service (trend_section_id, ai_service_id),
        INDEX idx_trend_service_order (trend_section_id, display_order, is_featured)
      );
    `;

    // 테이블 생성
    const statements = createTablesSQL.split(';').filter(stmt => stmt.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
      }
    }

    // 기본 트렌드 섹션 데이터 삽입
    await connection.execute(`
      INSERT IGNORE INTO trend_sections (section_type, section_title, section_description, display_order) VALUES
      ('popular', '요즘 많이 쓰는', '사용자들이 가장 많이 이용하는 인기 AI 서비스', 1),
      ('latest', '최신 등록', '최근에 새로 등록된 따끈따끈한 AI 서비스', 2),
      ('step_pick', 'STEP PICK', 'STEP AI가 엄선한 추천 AI 서비스', 3)
    `);

    await connection.commit();

    res.json({
      success: true,
      message: '메인페이지 설정 테이블이 성공적으로 설정되었습니다.'
    });

  } catch (error) {
    await connection.rollback();
    console.error('메인페이지 설정 테이블 설정 실패:', error);
    res.status(500).json({
      success: false,
      error: '메인페이지 설정 테이블 설정에 실패했습니다.',
      details: error instanceof Error ? error.message : String(error)
    });
  } finally {
    connection.release();
  }
});

/**
 * @swagger
 * /api/setup/check-tables:
 *   get:
 *     summary: 필요한 테이블들의 존재 여부 확인
 *     tags: [Setup]
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/check-tables', async (req, res) => {
  try {
    const requiredTables = [
      'ai_services',
      'categories', 
      'ai_service_categories',
      'ai_service_category_display_order',
      'homepage_videos',
      'homepage_curations',
      'homepage_step_pick_services',
      'trend_sections',
      'trend_section_services'
    ];

    const tableChecks = await Promise.all(
      requiredTables.map(async (tableName) => {
        const [result] = await pool.execute<RowDataPacket[]>(
          `SELECT COUNT(*) as table_exists 
           FROM information_schema.tables 
           WHERE table_schema = 'STEPAI' 
           AND table_name = ?`,
          [tableName]
        );
        return {
          table: tableName,
          exists: result[0].table_exists > 0
        };
      })
    );

    res.json({
      success: true,
      data: tableChecks
    });

  } catch (error) {
    console.error('테이블 확인 실패:', error);
    res.status(500).json({
      success: false,
      error: '테이블 확인에 실패했습니다.'
    });
  }
});

export default router;