const mysql = require('mysql2/promise');

// 데이터베이스 연결 설정
const dbConfig = {
  host: 'resource.local.topialive.co.kr',
  port: 13001,
  user: 'admin',
  password: 'spib5aslzaspIdude3r8',
  database: 'STEPAI',
  charset: 'utf8mb4'
};

async function testBookmark() {
  let connection;
  
  try {
    console.log('데이터베이스에 연결 중...');
    connection = await mysql.createConnection(dbConfig);
    
    // user_favorite_services 테이블 확인
    console.log('\n=== user_favorite_services 테이블 구조 ===');
    const [tableStructure] = await connection.execute(`
      DESCRIBE user_favorite_services
    `);
    
    console.table(tableStructure);
    
    // 현재 북마크 데이터 확인
    console.log('\n=== 현재 북마크 데이터 ===');
    const [currentBookmarks] = await connection.execute(`
      SELECT * FROM user_favorite_services LIMIT 10
    `);
    
    console.table(currentBookmarks);
    
    // 테스트용 북마크 추가 (user_id: 1, ai_service_id: 517)
    console.log('\n=== 테스트 북마크 추가 ===');
    try {
      const [insertResult] = await connection.execute(`
        INSERT IGNORE INTO user_favorite_services (user_id, ai_service_id, created_at) 
        VALUES (1, 517, NOW())
      `);
      console.log(`추가된 북마크 수: ${insertResult.affectedRows}`);
    } catch (error) {
      console.log('북마크 추가 중 오류 (이미 존재할 수 있음):', error.message);
    }
    
    // 추가 후 확인
    console.log('\n=== user_id = 1의 북마크 목록 ===');
    const [userBookmarks] = await connection.execute(`
      SELECT 
        ufs.*,
        s.ai_name
      FROM user_favorite_services ufs
      INNER JOIN ai_services s ON ufs.ai_service_id = s.id
      WHERE ufs.user_id = 1
      ORDER BY ufs.created_at DESC
    `);
    
    console.table(userBookmarks);
    
    console.log('\n✅ 북마크 테스트가 완료되었습니다.');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('데이터베이스 연결이 종료되었습니다.');
    }
  }
}

// 스크립트 실행
testBookmark();