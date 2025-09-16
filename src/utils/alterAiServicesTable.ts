import { getDatabaseConnection } from '../configs/database';

async function alterAiServicesTable() {
  const pool = getDatabaseConnection();
  const connection = await pool.getConnection();
  
  try {
    console.log('Starting ai_services table alteration...');
    
    // 1. 정규화된 테이블들 생성
    console.log('Creating normalized tables...');
    
    // AI Types 테이블
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ai_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type_name VARCHAR(50) NOT NULL UNIQUE,
        type_description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Pricing Models 테이블
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS pricing_models (
        id INT AUTO_INCREMENT PRIMARY KEY,
        model_name VARCHAR(50) NOT NULL UNIQUE,
        model_description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Target Types 테이블
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS target_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type_code VARCHAR(10) NOT NULL UNIQUE,
        type_name VARCHAR(50) NOT NULL,
        type_description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // AI Service Types 관계 테이블
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ai_service_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ai_service_id INT NOT NULL,
        ai_type_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE,
        FOREIGN KEY (ai_type_id) REFERENCES ai_types(id) ON DELETE CASCADE,
        UNIQUE KEY unique_ai_service_type (ai_service_id, ai_type_id)
      )
    `);
    
    // AI Service Pricing Models 관계 테이블
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ai_service_pricing_models (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ai_service_id INT NOT NULL,
        pricing_model_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE,
        FOREIGN KEY (pricing_model_id) REFERENCES pricing_models(id) ON DELETE CASCADE,
        UNIQUE KEY unique_ai_service_pricing (ai_service_id, pricing_model_id)
      )
    `);
    
    // AI Service Target Types 관계 테이블
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ai_service_target_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ai_service_id INT NOT NULL,
        target_type_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ai_service_id) REFERENCES ai_services(id) ON DELETE CASCADE,
        FOREIGN KEY (target_type_id) REFERENCES target_types(id) ON DELETE CASCADE,
        UNIQUE KEY unique_ai_service_target (ai_service_id, target_type_id)
      )
    `);
    
    // 2. 기본 데이터 입력
    console.log('Inserting base data...');
    
    // AI 타입 기본 데이터
    const aiTypes = [
      { type_name: 'WEB', type_description: '웹 기반 서비스' },
      { type_name: 'MOB', type_description: '모바일 앱' },
      { type_name: 'DES', type_description: '데스크톱 애플리케이션' },
      { type_name: 'EXT', type_description: '브라우저 확장 프로그램' },
      { type_name: 'API', type_description: 'API 서비스' }
    ];
    
    for (const aiType of aiTypes) {
      await connection.execute(
        'INSERT IGNORE INTO ai_types (type_name, type_description) VALUES (?, ?)',
        [aiType.type_name, aiType.type_description]
      );
    }
    
    // 타겟 타입 기본 데이터
    const targetTypes = [
      { type_code: 'B', type_name: 'B2B', type_description: 'Business to Business' },
      { type_code: 'C', type_name: 'B2C', type_description: 'Business to Consumer' },
      { type_code: 'G', type_name: 'B2G', type_description: 'Business to Government' }
    ];
    
    for (const targetType of targetTypes) {
      await connection.execute(
        'INSERT IGNORE INTO target_types (type_code, type_name, type_description) VALUES (?, ?, ?)',
        [targetType.type_code, targetType.type_name, targetType.type_description]
      );
    }
    
    // 3. ai_services 테이블에서 정규화된 컬럼들 제거
    console.log('Removing normalized columns from ai_services table...');
    
    // 컬럼 존재 여부 확인 후 삭제
    const columnsToRemove = ['ai_type', 'pricing_model', 'target_type', 'similar_services'];
    
    for (const column of columnsToRemove) {
      try {
        // 컬럼 존재 여부 확인
        const [columns] = await connection.execute(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = 'STEPAI' 
          AND TABLE_NAME = 'ai_services' 
          AND COLUMN_NAME = ?
        `, [column]);
        
        if ((columns as any[]).length > 0) {
          await connection.execute(`ALTER TABLE ai_services DROP COLUMN ${column}`);
          console.log(`Dropped column: ${column}`);
        } else {
          console.log(`Column ${column} does not exist, skipping...`);
        }
      } catch (error) {
        console.log(`Error dropping column ${column}:`, error);
      }
    }
    
    console.log('ai_services table alteration completed successfully!');
    
  } catch (error) {
    console.error('Error altering ai_services table:', error);
    throw error;
  } finally {
    connection.release();
  }
}

alterAiServicesTable();