import { getDatabaseConnection } from '../configs/database';

async function clearAIServices() {
  const pool = getDatabaseConnection();
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    console.log('AI 서비스 관련 데이터 삭제 시작...');
    
    // 관계 테이블들 먼저 삭제
    await connection.execute('DELETE FROM ai_service_similar_services');
    await connection.execute('DELETE FROM ai_service_tags');
    await connection.execute('DELETE FROM ai_service_categories');
    await connection.execute('DELETE FROM ai_service_types');
    await connection.execute('DELETE FROM ai_service_pricing_models');
    await connection.execute('DELETE FROM ai_service_target_types');
    await connection.execute('DELETE FROM ai_service_contents');
    await connection.execute('DELETE FROM ai_service_sns');
    await connection.execute('DELETE FROM ai_service_views');
    
    // AI 서비스 메인 테이블 삭제
    await connection.execute('DELETE FROM ai_services');
    
    // AUTO_INCREMENT 초기화
    await connection.execute('ALTER TABLE ai_services AUTO_INCREMENT = 1');
    
    await connection.commit();
    console.log('AI 서비스 데이터 삭제 완료');
  } catch (error) {
    await connection.rollback();
    console.error('AI 서비스 데이터 삭제 실패:', error);
    throw error;
  } finally {
    connection.release();
  }
}

clearAIServices().catch(console.error);