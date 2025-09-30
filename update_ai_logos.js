const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function updateAiLogos() {
  const connection = await mysql.createConnection({
    host: 'resource.local.topialive.co.kr',
    port: 13001,
    user: 'admin',
    password: 'spib5aslzaspIdude3r8',
    database: 'STEPAI'
  });

  try {
    console.log('AI 서비스 로고 업데이트 시작...');
    
    const iconsDir = '/Users/jinwoo/StepAI/stepai_api/public/uploads/icons/';
    const baseUrl = 'https://stepai-admin-production.up.railway.app/uploads/icons/';
    
    // 아이콘 디렉토리 확인
    if (!fs.existsSync(iconsDir)) {
      console.error('아이콘 디렉토리가 존재하지 않습니다:', iconsDir);
      return;
    }
    
    // 디렉토리의 모든 파일 읽기
    const files = fs.readdirSync(iconsDir);
    console.log(`총 ${files.length}개 파일 발견`);
    
    let updateCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (const filename of files) {
      try {
        // 파일명이 숫자로 시작하는지 확인 (예: 00003_DeepSeek.png)
        const match = filename.match(/^(\d+)_/);
        
        if (match) {
          const serviceId = parseInt(match[1], 10); // 앞의 0 제거하여 숫자로 변환
          const logoUrl = baseUrl + filename;
          
          console.log(`처리 중: ${filename} -> 서비스 ID ${serviceId}`);
          
          // AI 서비스가 존재하는지 확인
          const [existingService] = await connection.execute(
            'SELECT id, ai_name, ai_logo FROM ai_services WHERE id = ? AND deleted_at IS NULL',
            [serviceId]
          );
          
          if (existingService.length > 0) {
            const service = existingService[0];
            
            // 로고 URL 업데이트
            await connection.execute(
              'UPDATE ai_services SET ai_logo = ?, updated_at = NOW() WHERE id = ?',
              [logoUrl, serviceId]
            );
            
            console.log(`✅ 업데이트 완료: ${service.ai_name} (ID: ${serviceId})`);
            console.log(`   기존: ${service.ai_logo || '없음'}`);
            console.log(`   신규: ${logoUrl}`);
            updateCount++;
          } else {
            console.log(`⚠️  서비스 없음: ID ${serviceId} (${filename})`);
            skipCount++;
          }
        } else {
          console.log(`⏭️  패턴 불일치: ${filename}`);
          skipCount++;
        }
      } catch (error) {
        console.error(`❌ 오류 발생 (${filename}):`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n=== 업데이트 완료 ===');
    console.log(`✅ 업데이트: ${updateCount}건`);
    console.log(`⏭️  건너뜀: ${skipCount}건`);
    console.log(`❌ 오류: ${errorCount}건`);
    
    // 업데이트된 서비스들 확인
    if (updateCount > 0) {
      console.log('\n=== 업데이트된 서비스 목록 ===');
      const [updatedServices] = await connection.execute(
        'SELECT id, ai_name, ai_logo FROM ai_services WHERE ai_logo LIKE ? ORDER BY id',
        [baseUrl + '%']
      );
      
      updatedServices.forEach(service => {
        console.log(`ID ${service.id}: ${service.ai_name}`);
        console.log(`  로고: ${service.ai_logo}`);
      });
    }
    
  } catch (error) {
    console.error('전체 프로세스 오류:', error);
  } finally {
    await connection.end();
  }
}

updateAiLogos();