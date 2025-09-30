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

async function findUserId() {
  let connection;
  
  try {
    console.log('데이터베이스에 연결 중...');
    connection = await mysql.createConnection(dbConfig);
    
    // taijinu@naver.com 사용자 찾기
    console.log('\n=== taijinu@naver.com 사용자 조회 ===');
    const [users] = await connection.execute(`
      SELECT id, name, email, user_type, user_status, created_at
      FROM users 
      WHERE email = 'taijinu@naver.com'
    `);
    
    if (users.length > 0) {
      console.table(users);
      
      const userId = users[0].id;
      
      // 해당 사용자의 관심 서비스 개수 확인
      const [favoriteCount] = await connection.execute(`
        SELECT COUNT(*) as count
        FROM user_favorite_services 
        WHERE user_id = ?
      `, [userId]);
      
      console.log(`\n관심 서비스 개수: ${favoriteCount[0].count}`);
      
      // 관심 서비스 목록 (최대 5개)
      if (favoriteCount[0].count > 0) {
        const [favorites] = await connection.execute(`
          SELECT 
            ufs.ai_service_id,
            ais.ai_name,
            ufs.created_at
          FROM user_favorite_services ufs
          JOIN ai_services ais ON ufs.ai_service_id = ais.id
          WHERE ufs.user_id = ?
          ORDER BY ufs.created_at DESC
          LIMIT 5
        `, [userId]);
        
        console.log('\n=== 관심 서비스 목록 (최대 5개) ===');
        console.table(favorites);
      }
      
    } else {
      console.log('taijinu@naver.com 사용자를 찾을 수 없습니다.');
      
      // 비슷한 이메일 찾기
      const [similarUsers] = await connection.execute(`
        SELECT id, name, email, user_type, user_status, created_at
        FROM users 
        WHERE email LIKE '%taijinu%' OR email LIKE '%naver%'
        LIMIT 10
      `);
      
      if (similarUsers.length > 0) {
        console.log('\n=== 비슷한 이메일 사용자들 ===');
        console.table(similarUsers);
      }
    }
    
    console.log('\n✅ 사용자 조회가 완료되었습니다.');
    
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
findUserId();