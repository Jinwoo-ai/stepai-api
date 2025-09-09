import express from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getDatabaseConnection } from '../configs/database';

const router = express.Router();

// 사이트 설정 조회
router.get('/', async (_req, res) => {
  try {
    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      const [settings] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM site_settings ORDER BY id DESC LIMIT 1'
      );

      if (settings.length === 0) {
        return res.status(404).json({
          success: false,
          error: '사이트 설정을 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        data: settings[0]
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching site settings:', error);
    res.status(500).json({
      success: false,
      error: '사이트 설정 조회 중 오류가 발생했습니다.'
    });
  }
});

// 사이트 설정 수정
router.put('/', async (req, res) => {
  try {
    const { 
      site_title, 
      company_name, 
      ceo_name, 
      business_number, 
      phone_number, 
      address, 
      privacy_officer 
    } = req.body;

    const pool = getDatabaseConnection();
    const connection = await pool.getConnection();
    
    try {
      // 기존 설정 확인
      const [existingSettings] = await connection.execute<RowDataPacket[]>(
        'SELECT id FROM site_settings ORDER BY id DESC LIMIT 1'
      );

      const updateFields: string[] = [];
      const updateParams: any[] = [];

      const fieldsToUpdate = [
        'site_title', 'company_name', 'ceo_name', 'business_number', 
        'phone_number', 'address', 'privacy_officer'
      ];

      fieldsToUpdate.forEach(field => {
        if (req.body[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          updateParams.push(req.body[field]);
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          error: '수정할 데이터가 없습니다.'
        });
      }

      if (existingSettings.length > 0) {
        // 기존 설정 업데이트
        await connection.execute(
          `UPDATE site_settings SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
          [...updateParams, existingSettings[0].id]
        );
      } else {
        // 새 설정 생성
        const insertFields = fieldsToUpdate.filter(field => req.body[field] !== undefined);
        const insertValues = insertFields.map(() => '?').join(', ');
        const insertParams = insertFields.map(field => req.body[field]);

        await connection.execute(
          `INSERT INTO site_settings (${insertFields.join(', ')}) VALUES (${insertValues})`,
          insertParams
        );
      }

      res.json({
        success: true,
        message: '사이트 설정이 저장되었습니다.'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating site settings:', error);
    res.status(500).json({
      success: false,
      error: '사이트 설정 저장 중 오류가 발생했습니다.'
    });
  }
});

export default router;