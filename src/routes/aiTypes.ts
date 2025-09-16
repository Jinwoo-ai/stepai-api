import express from 'express';
import { RowDataPacket } from 'mysql2';
import { getDatabaseConnection } from '../configs/database';

const router = express.Router();

// AI 타입 목록 조회
router.get('/', async (_req, res) => {
  try {
    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT id, type_name, type_description FROM ai_types ORDER BY type_name'
      );
      
      res.json({
        success: true,
        data: rows
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching AI types:', error);
    res.status(500).json({
      success: false,
      error: 'AI 타입 조회 중 오류가 발생했습니다.'
    });
  }
});

// 가격 모델 목록 조회
router.get('/pricing-models', async (_req, res) => {
  try {
    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT id, model_name, model_description FROM pricing_models ORDER BY model_name'
      );
      
      res.json({
        success: true,
        data: rows
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching pricing models:', error);
    res.status(500).json({
      success: false,
      error: '가격 모델 조회 중 오류가 발생했습니다.'
    });
  }
});

// 타겟 타입 목록 조회
router.get('/target-types', async (_req, res) => {
  try {
    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT id, type_code, type_name, type_description FROM target_types ORDER BY type_code'
      );
      
      res.json({
        success: true,
        data: rows
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching target types:', error);
    res.status(500).json({
      success: false,
      error: '타겟 타입 조회 중 오류가 발생했습니다.'
    });
  }
});

export default router;