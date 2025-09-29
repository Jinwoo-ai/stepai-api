const mysql = require('mysql2/promise');
const fs = require('fs');

async function updateSchemaDocs() {
  const connection = await mysql.createConnection({
    host: 'resource.local.topialive.co.kr',
    port: 13001,
    user: 'admin',
    password: 'spib5aslzaspIdude3r8',
    database: 'STEPAI'
  });

  try {
    console.log('STEPAI 데이터베이스 스키마 문서 업데이트 시작...\n');

    // 모든 테이블 목록 가져오기
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]).sort();

    let schemaDoc = `# StepAI Database Schema Guide

## 📋 개요
StepAI 서비스의 데이터베이스 스키마 구조를 설명합니다.
총 ${tableNames.length}개의 테이블로 구성되어 있습니다.

## 🗂️ 테이블 목록

`;

    // 각 테이블의 구조 정보 수집
    for (const tableName of tableNames) {
      console.log(`처리 중: ${tableName}`);
      
      const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
      const [indexes] = await connection.execute(`SHOW INDEX FROM ${tableName}`);
      
      schemaDoc += `### ${tableName}\n\n`;
      schemaDoc += `| 컬럼명 | 타입 | NULL | 키 | 기본값 | 추가정보 |\n`;
      schemaDoc += `|--------|------|------|-----|--------|----------|\n`;
      
      columns.forEach(col => {
        schemaDoc += `| ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key || ''} | ${col.Default || ''} | ${col.Extra || ''} |\n`;
      });
      
      // 인덱스 정보
      const indexNames = [...new Set(indexes.map(idx => idx.Key_name))].filter(name => name !== 'PRIMARY');
      if (indexNames.length > 0) {
        schemaDoc += `\n**인덱스**: ${indexNames.join(', ')}\n`;
      }
      
      schemaDoc += `\n`;
    }

    // DATABASE_SCHEMA_GUIDE.md 업데이트
    fs.writeFileSync('/Users/jinwoo/StepAI/stepai_api/DATABASE_SCHEMA_GUIDE.md', schemaDoc);
    console.log('✅ DATABASE_SCHEMA_GUIDE.md 업데이트 완료');

    // create_tables.sql 업데이트
    console.log('\ncreate_tables.sql 업데이트 중...');
    let createTablesSQL = `-- StepAI API Database Schema - AI 서비스 소개 및 이용방법 추천 서비스
-- MySQL 8.0 이상 버전용
-- 실제 STEPAI 데이터베이스 기준으로 생성됨

`;

    for (const tableName of tableNames) {
      if (tableName === 'ai_services_backup') continue; // 백업 테이블 제외
      
      const [createTable] = await connection.execute(`SHOW CREATE TABLE ${tableName}`);
      createTablesSQL += createTable[0]['Create Table'] + ';\n\n';
    }

    fs.writeFileSync('/Users/jinwoo/StepAI/stepai_api/db/create_tables.sql', createTablesSQL);
    console.log('✅ create_tables.sql 업데이트 완료');

    console.log('\n=== 스키마 문서 업데이트 완료 ===');

  } catch (error) {
    console.error('스키마 문서 업데이트 중 오류:', error);
  } finally {
    await connection.end();
  }
}

updateSchemaDocs();