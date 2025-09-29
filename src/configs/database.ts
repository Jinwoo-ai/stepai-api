import dotenv from 'dotenv';
import path from 'path';

// .env 파일 경로 명시적으로 지정
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mysql from 'mysql2/promise';

// 데이터베이스 설정 (환경변수 기반)
const getDbConfig = () => {
  console.log('Environment variables:');
  console.log('DB_HOST:', process.env['DB_HOST']);
  console.log('DB_PORT:', process.env['DB_PORT']);
  console.log('DB_USER:', process.env['DB_USER']);
  console.log('DB_NAME:', process.env['DB_NAME']);
  
  return {
    host: process.env['DB_HOST'] || 'localhost',
    port: parseInt(process.env['DB_PORT'] || '3306'),
    user: process.env['DB_USER'] || 'root',
    password: process.env['DB_PASSWORD'] || '',
    database: process.env['DB_NAME'] || 'stepai_dev',
    charset: 'utf8mb4',
    timezone: '+09:00',
    connectionLimit: 10,
    queueLimit: 0
  };
};

// 현재 환경 가져오기
const getCurrentEnv = (): 'development' | 'staging' | 'production' => {
  const env = process.env['NODE_ENV'] || 'development';
  if (env === 'production') return 'production';
  if (env === 'staging') return 'staging';
  return 'development';
};

// 데이터베이스 연결 풀 생성
const createConnectionPool = () => {
  const currentEnv = getCurrentEnv();
  const config = getDbConfig();
  
  console.log(`Database connecting to ${currentEnv} environment`);
  console.log(`Database config: ${config.host}:${config.port}/${config.database}`);
  
  return mysql.createPool(config);
};

// 전역 연결 풀
let connectionPool: mysql.Pool | null = null;

// 데이터베이스 연결 가져오기
export const getDatabaseConnection = (): mysql.Pool => {
  if (!connectionPool) {
    connectionPool = createConnectionPool();
  }
  return connectionPool;
};

// 데이터베이스 연결 종료
export const closeDatabaseConnection = async (): Promise<void> => {
  if (connectionPool) {
    await connectionPool.end();
    connectionPool = null;
    console.log('Database connection closed');
  }
};

// 연결 테스트
export const testConnection = async (): Promise<boolean> => {
  try {
    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('Database connection test successful');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
};

// pool export 추가
export const pool = getDatabaseConnection();

// dbConfig export 추가
export const dbConfig = getDbConfig();

export default getDatabaseConnection; 