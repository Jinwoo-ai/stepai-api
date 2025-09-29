const mysql = require('mysql2/promise');

async function syncTestDbSchema() {
  const connection = await mysql.createConnection({
    host: 'resource.local.topialive.co.kr',
    port: 13001,
    user: 'admin',
    password: 'spib5aslzaspIdude3r8',
    database: 'STEPAI_TEST'
  });

  try {
    console.log('STEPAI_TEST 데이터베이스 스키마 동기화 시작...\n');

    // 1. ai_service_category_display_order 테이블에 is_featured 컬럼 추가
    console.log('1. ai_service_category_display_order 테이블 수정...');
    try {
      await connection.execute(`
        ALTER TABLE ai_service_category_display_order 
        ADD COLUMN is_featured TINYINT(1) DEFAULT FALSE COMMENT '상단 고정 여부'
      `);
      console.log('✅ is_featured 컬럼 추가 완료');
    } catch (error) {
      console.log('⚠️  is_featured 컬럼이 이미 존재하거나 오류:', error.message);
    }

    // 2. homepage_step_pick_services 테이블에 category_id 컬럼 추가
    console.log('\n2. homepage_step_pick_services 테이블 수정...');
    try {
      await connection.execute(`
        ALTER TABLE homepage_step_pick_services 
        ADD COLUMN category_id INT(11) NULL COMMENT '카테고리 ID'
      `);
      console.log('✅ category_id 컬럼 추가 완료');
    } catch (error) {
      console.log('⚠️  category_id 컬럼이 이미 존재하거나 오류:', error.message);
    }

    // 3. trend_sections 테이블에 is_category_based 컬럼 추가
    console.log('\n3. trend_sections 테이블 수정...');
    try {
      await connection.execute(`
        ALTER TABLE trend_sections 
        ADD COLUMN is_category_based TINYINT(1) DEFAULT FALSE COMMENT '카테고리 기반 여부'
      `);
      console.log('✅ is_category_based 컬럼 추가 완료');
    } catch (error) {
      console.log('⚠️  is_category_based 컬럼이 이미 존재하거나 오류:', error.message);
    }

    // 4. trend_section_services 테이블에 category_id 컬럼 추가
    console.log('\n4. trend_section_services 테이블 수정...');
    try {
      await connection.execute(`
        ALTER TABLE trend_section_services 
        ADD COLUMN category_id INT(11) NULL COMMENT '카테고리 ID'
      `);
      console.log('✅ category_id 컬럼 추가 완료');
    } catch (error) {
      console.log('⚠️  category_id 컬럼이 이미 존재하거나 오류:', error.message);
    }

    // 5. 누락된 인덱스 추가
    console.log('\n5. 누락된 인덱스 추가...');
    
    const indexes = [
      {
        table: 'ai_services',
        name: 'idx_ai_services_nationality',
        sql: 'CREATE INDEX idx_ai_services_nationality ON ai_services(nationality)'
      },
      {
        table: 'ai_services',
        name: 'idx_ai_services_status',
        sql: 'CREATE INDEX idx_ai_services_status ON ai_services(ai_status)'
      },
      {
        table: 'categories',
        name: 'idx_categories_status',
        sql: 'CREATE INDEX idx_categories_status ON categories(category_status)'
      },
      {
        table: 'ai_service_contents',
        name: 'idx_content_type',
        sql: 'CREATE INDEX idx_content_type ON ai_service_contents(content_type)'
      },
      {
        table: 'ai_service_sns',
        name: 'idx_sns_type',
        sql: 'CREATE INDEX idx_sns_type ON ai_service_sns(sns_type)'
      },
      {
        table: 'ai_service_views',
        name: 'idx_view_date',
        sql: 'CREATE INDEX idx_view_date ON ai_service_views(view_date)'
      },
      {
        table: 'ai_video_views',
        name: 'idx_video_view_date',
        sql: 'CREATE INDEX idx_video_view_date ON ai_video_views(view_date)'
      },
      {
        table: 'ai_videos',
        name: 'idx_video_status',
        sql: 'CREATE INDEX idx_video_status ON ai_videos(video_status)'
      },
      {
        table: 'ai_videos',
        name: 'idx_video_view_count',
        sql: 'CREATE INDEX idx_video_view_count ON ai_videos(view_count)'
      },
      {
        table: 'rankings',
        name: 'idx_ranking_type',
        sql: 'CREATE INDEX idx_ranking_type ON rankings(ranking_type)'
      },
      {
        table: 'rankings',
        name: 'idx_entity_type',
        sql: 'CREATE INDEX idx_entity_type ON rankings(entity_type)'
      },
      {
        table: 'reviews',
        name: 'idx_review_type',
        sql: 'CREATE INDEX idx_review_type ON reviews(review_type)'
      },
      {
        table: 'reviews',
        name: 'idx_rating',
        sql: 'CREATE INDEX idx_rating ON reviews(rating)'
      },
      {
        table: 'trend_section_services',
        name: 'idx_display_order',
        sql: 'CREATE INDEX idx_display_order ON trend_section_services(display_order)'
      },
      {
        table: 'user_favorites',
        name: 'idx_favorite_type',
        sql: 'CREATE INDEX idx_favorite_type ON user_favorites(favorite_type)'
      },
      {
        table: 'users',
        name: 'idx_industry',
        sql: 'CREATE INDEX idx_industry ON users(industry)'
      },
      {
        table: 'users',
        name: 'idx_job_role',
        sql: 'CREATE INDEX idx_job_role ON users(job_role)'
      }
    ];

    for (const index of indexes) {
      try {
        await connection.execute(index.sql);
        console.log(`✅ ${index.table}.${index.name} 인덱스 추가 완료`);
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log(`⚠️  ${index.table}.${index.name} 인덱스가 이미 존재함`);
        } else {
          console.log(`❌ ${index.table}.${index.name} 인덱스 추가 실패:`, error.message);
        }
      }
    }

    // 6. 누락된 테이블 생성 (백업 테이블 제외)
    console.log('\n6. 누락된 테이블 생성...');
    
    // user_favorite_services 테이블 생성
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS user_favorite_services (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          ai_service_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE,
          UNIQUE KEY unique_user_service (user_id, ai_service_id)
        )
      `);
      console.log('✅ user_favorite_services 테이블 생성 완료');
    } catch (error) {
      console.log('⚠️  user_favorite_services 테이블 생성 오류:', error.message);
    }

    // user_favorite_videos 테이블 생성
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS user_favorite_videos (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          ai_video_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (ai_video_id) REFERENCES ai_videos(id) ON DELETE CASCADE,
          UNIQUE KEY unique_user_video (user_id, ai_video_id)
        )
      `);
      console.log('✅ user_favorite_videos 테이블 생성 완료');
    } catch (error) {
      console.log('⚠️  user_favorite_videos 테이블 생성 오류:', error.message);
    }

    console.log('\n=== 스키마 동기화 완료 ===');

  } catch (error) {
    console.error('스키마 동기화 중 오류:', error);
  } finally {
    await connection.end();
  }
}

syncTestDbSchema();