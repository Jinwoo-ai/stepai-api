import { getDatabaseConnection } from '../configs/database';

async function migrateAIServiceAttributes() {
  const pool = getDatabaseConnection();
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // AI 타입 테이블
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ai_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type_name VARCHAR(50) UNIQUE NOT NULL,
        type_description VARCHAR(200),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // AI 서비스-타입 관계 테이블
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

    // 가격 모델 테이블
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS pricing_models (
        id INT AUTO_INCREMENT PRIMARY KEY,
        model_name VARCHAR(50) UNIQUE NOT NULL,
        model_description VARCHAR(200),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // AI 서비스-가격모델 관계 테이블
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

    // 타겟 타입 테이블
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS target_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type_code VARCHAR(10) UNIQUE NOT NULL,
        type_name VARCHAR(50) NOT NULL,
        type_description VARCHAR(200),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // AI 서비스-타겟타입 관계 테이블
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

    await connection.commit();
    console.log('Tables created successfully');
  } catch (error) {
    await connection.rollback();
    console.error('Migration failed:', error);
    throw error;
  } finally {
    connection.release();
  }
}

migrateAIServiceAttributes().catch(console.error);