import mysql from 'mysql2/promise';
import { dbConfig } from '../configs/database';

async function addPasswordColumn() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    await connection.execute(`
      ALTER TABLE users 
      ADD COLUMN password VARCHAR(255) NULL AFTER email
    `);
    console.log('Password column added successfully');
  } catch (error) {
    console.error('Error adding password column:', error);
  } finally {
    await connection.end();
  }
}

addPasswordColumn();