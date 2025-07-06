import mysql from 'mysql2/promise';

// 환경별 데이터베이스 설정
const dbConfigs = {
  development: {
    host: process.env['DB_HOST'] || 'localhost',
    port: parseInt(process.env['DB_PORT'] || '3306'),
    user: process.env['DB_USER'] || 'root',
    password: process.env['DB_PASSWORD'] || '',
    database: process.env['DB_NAME'] || 'stepai_dev',
    charset: 'utf8mb4',
    timezone: '+09:00',
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
  },
  staging: {
    host: process.env['DB_HOST'] || 'localhost',
    port: parseInt(process.env['DB_PORT'] || '3306'),
    user: process.env['DB_USER'] || 'root',
    password: process.env['DB_PASSWORD'] || '',
    database: process.env['DB_NAME'] || 'stepai_staging',
    charset: 'utf8mb4',
    timezone: '+09:00',
    connectionLimit: 20,
    acquireTimeout: 60000,
    timeout: 60000,
  },
  production: {
    host: process.env['DB_HOST'] || 'localhost',
    port: parseInt(process.env['DB_PORT'] || '3306'),
    user: process.env['DB_USER'] || 'root',
    password: process.env['DB_PASSWORD'] || '',
    database: process.env['DB_NAME'] || 'stepai_prod',
    charset: 'utf8mb4',
    timezone: '+09:00',
    connectionLimit: 50,
    acquireTimeout: 60000,
    timeout: 60000,
  }
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
  const config = dbConfigs[currentEnv];
  
  console.log(`Database connecting to ${currentEnv} environment`);
  
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

export default getDatabaseConnection; 