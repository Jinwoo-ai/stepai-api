const mysql = require('mysql2/promise');

async function compareSchemas() {
  const stepaiConnection = await mysql.createConnection({
    host: 'resource.local.topialive.co.kr',
    port: 13001,
    user: 'admin',
    password: 'spib5aslzaspIdude3r8',
    database: 'STEPAI'
  });

  const testConnection = await mysql.createConnection({
    host: 'resource.local.topialive.co.kr',
    port: 13001,
    user: 'admin',
    password: 'spib5aslzaspIdude3r8',
    database: 'STEPAI_TEST'
  });

  try {
    console.log('=== 데이터베이스 스키마 비교 ===\n');

    // 1. 테이블 목록 비교
    const [stepaiTables] = await stepaiConnection.execute('SHOW TABLES');
    const [testTables] = await testConnection.execute('SHOW TABLES');

    const stepaiTableNames = stepaiTables.map(row => Object.values(row)[0]).sort();
    const testTableNames = testTables.map(row => Object.values(row)[0]).sort();

    console.log('1. 테이블 개수 비교:');
    console.log(`STEPAI: ${stepaiTableNames.length}개 테이블`);
    console.log(`STEPAI_TEST: ${testTableNames.length}개 테이블\n`);

    // STEPAI에만 있는 테이블
    const onlyInStepai = stepaiTableNames.filter(table => !testTableNames.includes(table));
    if (onlyInStepai.length > 0) {
      console.log('❌ STEPAI에만 있는 테이블:');
      onlyInStepai.forEach(table => console.log(`  - ${table}`));
      console.log();
    }

    // STEPAI_TEST에만 있는 테이블
    const onlyInTest = testTableNames.filter(table => !stepaiTableNames.includes(table));
    if (onlyInTest.length > 0) {
      console.log('⚠️  STEPAI_TEST에만 있는 테이블:');
      onlyInTest.forEach(table => console.log(`  - ${table}`));
      console.log();
    }

    // 공통 테이블
    const commonTables = stepaiTableNames.filter(table => testTableNames.includes(table));
    console.log(`✅ 공통 테이블: ${commonTables.length}개\n`);

    // 2. 각 공통 테이블의 컬럼 구조 비교
    console.log('2. 테이블 구조 비교:\n');
    
    for (const tableName of commonTables) {
      const [stepaiColumns] = await stepaiConnection.execute(`DESCRIBE ${tableName}`);
      const [testColumns] = await testConnection.execute(`DESCRIBE ${tableName}`);

      const stepaiColMap = new Map();
      const testColMap = new Map();

      stepaiColumns.forEach(col => {
        stepaiColMap.set(col.Field, {
          type: col.Type,
          null: col.Null,
          key: col.Key,
          default: col.Default,
          extra: col.Extra
        });
      });

      testColumns.forEach(col => {
        testColMap.set(col.Field, {
          type: col.Type,
          null: col.Null,
          key: col.Key,
          default: col.Default,
          extra: col.Extra
        });
      });

      const stepaiCols = Array.from(stepaiColMap.keys());
      const testCols = Array.from(testColMap.keys());

      // 컬럼 차이 확인
      const onlyInStepaiCols = stepaiCols.filter(col => !testCols.includes(col));
      const onlyInTestCols = testCols.filter(col => !stepaiCols.includes(col));
      const commonCols = stepaiCols.filter(col => testCols.includes(col));

      let hasDifference = false;

      if (onlyInStepaiCols.length > 0 || onlyInTestCols.length > 0) {
        console.log(`📋 ${tableName}:`);
        hasDifference = true;

        if (onlyInStepaiCols.length > 0) {
          console.log(`  ❌ STEPAI에만 있는 컬럼:`);
          onlyInStepaiCols.forEach(col => {
            const colInfo = stepaiColMap.get(col);
            console.log(`    - ${col}: ${colInfo.type} ${colInfo.null === 'NO' ? 'NOT NULL' : 'NULL'}`);
          });
        }

        if (onlyInTestCols.length > 0) {
          console.log(`  ⚠️  STEPAI_TEST에만 있는 컬럼:`);
          onlyInTestCols.forEach(col => {
            const colInfo = testColMap.get(col);
            console.log(`    - ${col}: ${colInfo.type} ${colInfo.null === 'NO' ? 'NOT NULL' : 'NULL'}`);
          });
        }
      }

      // 공통 컬럼의 타입 차이 확인
      for (const col of commonCols) {
        const stepaiCol = stepaiColMap.get(col);
        const testCol = testColMap.get(col);

        if (stepaiCol.type !== testCol.type || 
            stepaiCol.null !== testCol.null || 
            stepaiCol.key !== testCol.key) {
          if (!hasDifference) {
            console.log(`📋 ${tableName}:`);
            hasDifference = true;
          }
          console.log(`  🔄 컬럼 타입 차이 - ${col}:`);
          console.log(`    STEPAI: ${stepaiCol.type} ${stepaiCol.null === 'NO' ? 'NOT NULL' : 'NULL'} ${stepaiCol.key}`);
          console.log(`    TEST: ${testCol.type} ${testCol.null === 'NO' ? 'NOT NULL' : 'NULL'} ${testCol.key}`);
        }
      }

      if (hasDifference) {
        console.log();
      }
    }

    // 3. 인덱스 비교 (주요 테이블만)
    console.log('3. 주요 테이블 인덱스 비교:\n');
    const importantTables = ['ai_services', 'categories', 'tags', 'ai_service_categories', 'ai_service_tags'];
    
    for (const tableName of importantTables) {
      if (commonTables.includes(tableName)) {
        try {
          const [stepaiIndexes] = await stepaiConnection.execute(`SHOW INDEX FROM ${tableName}`);
          const [testIndexes] = await testConnection.execute(`SHOW INDEX FROM ${tableName}`);

          const stepaiIndexNames = [...new Set(stepaiIndexes.map(idx => idx.Key_name))].sort();
          const testIndexNames = [...new Set(testIndexes.map(idx => idx.Key_name))].sort();

          const onlyInStepaiIdx = stepaiIndexNames.filter(idx => !testIndexNames.includes(idx));
          const onlyInTestIdx = testIndexNames.filter(idx => !stepaiIndexNames.includes(idx));

          if (onlyInStepaiIdx.length > 0 || onlyInTestIdx.length > 0) {
            console.log(`📋 ${tableName} 인덱스:`);
            if (onlyInStepaiIdx.length > 0) {
              console.log(`  ❌ STEPAI에만 있는 인덱스: ${onlyInStepaiIdx.join(', ')}`);
            }
            if (onlyInTestIdx.length > 0) {
              console.log(`  ⚠️  STEPAI_TEST에만 있는 인덱스: ${onlyInTestIdx.join(', ')}`);
            }
            console.log();
          }
        } catch (error) {
          console.log(`⚠️  ${tableName} 인덱스 비교 실패: ${error.message}`);
        }
      }
    }

    console.log('=== 비교 완료 ===');

  } catch (error) {
    console.error('스키마 비교 중 오류:', error);
  } finally {
    await stepaiConnection.end();
    await testConnection.end();
  }
}

compareSchemas();