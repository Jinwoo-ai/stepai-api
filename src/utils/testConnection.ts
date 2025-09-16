import { testConnection } from '../configs/database';

async function test() {
  console.log('Testing database connection...');
  const result = await testConnection();
  console.log('Connection test result:', result);
  process.exit(result ? 0 : 1);
}

test();