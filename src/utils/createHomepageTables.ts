import mysql from 'mysql2/promise';
import { dbConfig } from '../configs/database';

async function createHomepageTables() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('Creating homepage tables...');

    // homepage_videos 테이블
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS homepage_videos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ai_video_id INT NOT NULL,
        display_order INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (ai_video_id) REFERENCES ai_videos(id) ON DELETE CASCADE,
        INDEX idx_display_order (display_order),
        INDEX idx_is_active (is_active)
      )
    `);
    console.log('✓ homepage_videos table created');

    // homepage_curations 테이블
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS homepage_curations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        curation_id INT NOT NULL,
        display_order INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (curation_id) REFERENCES curations(id) ON DELETE CASCADE,
        INDEX idx_display_order (display_order),
        INDEX idx_is_active (is_active)
      )
    `);
    console.log('✓ homepage_curations table created');

    // homepage_step_pick_services 테이블
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS homepage_step_pick_services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ai_service_id INT NOT NULL,
        category_id INT NULL,
        display_order INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        INDEX idx_category_display (category_id, display_order),
        INDEX idx_is_active (is_active)
      )
    `);
    console.log('✓ homepage_step_pick_services table created');

    // trend_sections 테이블
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS trend_sections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        section_type VARCHAR(50) NOT NULL,
        section_title VARCHAR(100) NOT NULL,
        section_description TEXT,
        is_category_based BOOLEAN NOT NULL DEFAULT TRUE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        display_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_display_order (display_order),
        INDEX idx_is_active (is_active)
      )
    `);
    console.log('✓ trend_sections table created');

    // trend_section_services 테이블
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS trend_section_services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        trend_section_id INT NOT NULL,
        ai_service_id INT NOT NULL,
        category_id INT NULL,
        display_order INT NOT NULL DEFAULT 0,
        is_featured BOOLEAN NOT NULL DEFAULT FALSE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (trend_section_id) REFERENCES trend_sections(id) ON DELETE CASCADE,
        FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        INDEX idx_section_category_display (trend_section_id, category_id, display_order),
        INDEX idx_is_active (is_active)
      )
    `);
    console.log('✓ trend_section_services table created');

    console.log('All homepage tables created successfully!');
  } catch (error) {
    console.error('Error creating homepage tables:', error);
  } finally {
    await connection.end();
  }
}

createHomepageTables();