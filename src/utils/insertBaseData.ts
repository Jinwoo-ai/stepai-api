import { getDatabaseConnection } from '../configs/database';

async function insertBaseData() {
  const pool = getDatabaseConnection();
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // AI 타입 기본 데이터 입력
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
    
    // 타겟 타입 기본 데이터 입력
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
    
    await connection.commit();
    console.log('기본 데이터 입력 완료');
  } catch (error) {
    await connection.rollback();
    console.error('기본 데이터 입력 실패:', error);
  } finally {
    connection.release();
  }
}

insertBaseData();