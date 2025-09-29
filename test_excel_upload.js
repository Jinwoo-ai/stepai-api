const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function testExcelCompatibility() {
  console.log('XLSX 라이브러리 버전:', XLSX.version);
  console.log('지원하는 파일 형식:', XLSX.SSF);
  
  // 테스트용 엑셀 파일 생성
  const testData = [
    {
      'id': '00001',
      '서비스명(국문)': 'ChatGPT',
      '서비스명(영문)': 'ChatGPT',
      '한줄설명': 'OpenAI의 대화형 인공지능 챗봇 서비스',
      '대표 URL': 'https://chat.openai.com',
      '로고(URL)': 'https://example.com/chatgpt-logo.png',
      '기업명(국문)': '오픈AI',
      '기업명(영문)': 'OpenAI',
      '임베디드 영상 URL': '',
      '본사': '미국',
      '주요기능': '대화형 AI 모델로 다양한 질문에 답변 제공',
      '타겟 사용자': '일반 사용자, 개발자, 연구자',
      '추천활용사례': '코드 작성, 글쓰기, 번역, 요약 등',
      'Price': '무료, 유료',
      '난이도': '초급',
      '사용': '웹, 모바일 앱',
      'Alive': 'Yes',
      '표시위치': 'STEP_PICK',
      'NEW': 'No',
      '형태': '웹, API',
      'Target': 'GEN, BUS',
      '메인 카테고리': 'AI 글쓰기',
      '서브 카테고리': '대화형에이전트, 개인어시스턴트',
      'Tags': '#AI글쓰기 #대화형에이전트 #개인어시스턴트',
      '유사 서비스': '00002\n00003'
    }
  ];
  
  try {
    // 1. 최신 XLSX 형식으로 생성
    console.log('\n=== 최신 XLSX 형식 테스트 ===');
    const worksheet = XLSX.utils.json_to_sheet(testData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'AI_Services');
    
    // 다양한 형식으로 저장 테스트
    const formats = [
      { ext: 'xlsx', type: 'xlsx', desc: 'Excel 2007+ (.xlsx)' },
      { ext: 'xls', type: 'biff8', desc: 'Excel 97-2003 (.xls)' },
      { ext: 'xlsb', type: 'xlsb', desc: 'Excel Binary (.xlsb)' },
      { ext: 'csv', type: 'csv', desc: 'CSV (.csv)' }
    ];
    
    formats.forEach(format => {
      try {
        const filename = `test_excel_${format.ext}.${format.ext}`;
        const filepath = path.join(__dirname, 'public', filename);
        
        XLSX.writeFile(workbook, filepath, { bookType: format.type });
        console.log(`✅ ${format.desc} 생성 성공: ${filename}`);
        
        // 파일 읽기 테스트
        const readWorkbook = XLSX.readFile(filepath);
        const readWorksheet = readWorkbook.Sheets[readWorkbook.SheetNames[0]];
        const readData = XLSX.utils.sheet_to_json(readWorksheet);
        
        if (readData.length > 0) {
          console.log(`   📖 읽기 성공: ${readData.length}개 행`);
          console.log(`   📝 첫 번째 행 서비스명: ${readData[0]['서비스명(국문)']}`);
        }
        
      } catch (error) {
        console.log(`❌ ${format.desc} 실패:`, error.message);
      }
    });
    
    // 2. 파일 크기 제한 테스트
    console.log('\n=== 파일 크기 테스트 ===');
    const largeData = [];
    for (let i = 0; i < 1000; i++) {
      largeData.push({
        ...testData[0],
        'id': String(i + 1).padStart(5, '0'),
        '서비스명(국문)': `테스트 서비스 ${i + 1}`
      });
    }
    
    const largeWorksheet = XLSX.utils.json_to_sheet(largeData);
    const largeWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(largeWorkbook, largeWorksheet, 'Large_Data');
    
    const largeFilepath = path.join(__dirname, 'public', 'test_large.xlsx');
    XLSX.writeFile(largeWorkbook, largeFilepath);
    
    const stats = fs.statSync(largeFilepath);
    console.log(`📊 대용량 파일 (1000행) 크기: ${(stats.size / 1024).toFixed(2)} KB`);
    
    // 3. 특수 문자 테스트
    console.log('\n=== 특수 문자 테스트 ===');
    const specialData = [{
      'id': '00001',
      '서비스명(국문)': 'ChatGPT™ & AI Assistant 🤖',
      '한줄설명': 'OpenAI의 대화형 AI (인공지능) 서비스 - "혁신적인" 솔루션',
      'Tags': '#AI글쓰기 #대화형에이전트 #특수문자테스트 #한글/영문',
      '유사 서비스': '00002\n00003\n00004'
    }];
    
    const specialWorksheet = XLSX.utils.json_to_sheet(specialData);
    const specialWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(specialWorkbook, specialWorksheet, 'Special_Chars');
    
    const specialFilepath = path.join(__dirname, 'public', 'test_special.xlsx');
    XLSX.writeFile(specialWorkbook, specialFilepath);
    
    const readSpecialWorkbook = XLSX.readFile(specialFilepath);
    const readSpecialData = XLSX.utils.sheet_to_json(readSpecialWorkbook.Sheets[readSpecialWorkbook.SheetNames[0]]);
    console.log('✅ 특수 문자 처리 성공:', readSpecialData[0]['서비스명(국문)']);
    
    // 4. 빈 셀 처리 테스트
    console.log('\n=== 빈 셀 처리 테스트 ===');
    const emptyData = [
      {
        'id': '00001',
        '서비스명(국문)': 'ChatGPT',
        '서비스명(영문)': '', // 빈 값
        '한줄설명': null, // null 값
        '대표 URL': undefined, // undefined 값
        '형태': '웹, API'
      }
    ];
    
    const emptyWorksheet = XLSX.utils.json_to_sheet(emptyData);
    const emptyWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(emptyWorkbook, emptyWorksheet, 'Empty_Cells');
    
    const emptyFilepath = path.join(__dirname, 'public', 'test_empty.xlsx');
    XLSX.writeFile(emptyWorkbook, emptyFilepath);
    
    const readEmptyWorkbook = XLSX.readFile(emptyFilepath);
    const readEmptyData = XLSX.utils.sheet_to_json(readEmptyWorkbook.Sheets[readEmptyWorkbook.SheetNames[0]]);
    console.log('✅ 빈 셀 처리 결과:', {
      '서비스명(영문)': readEmptyData[0]['서비스명(영문)'],
      '한줄설명': readEmptyData[0]['한줄설명'],
      '대표 URL': readEmptyData[0]['대표 URL']
    });
    
    console.log('\n=== 호환성 테스트 완료 ===');
    console.log('✅ XLSX 라이브러리는 다음 형식을 지원합니다:');
    console.log('   - Excel 2007+ (.xlsx) - 권장');
    console.log('   - Excel 97-2003 (.xls)');
    console.log('   - Excel Binary (.xlsb)');
    console.log('   - CSV (.csv)');
    console.log('   - 특수 문자 및 한글 지원');
    console.log('   - 빈 셀 처리 지원');
    console.log('   - 대용량 파일 처리 지원');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  }
}

testExcelCompatibility();