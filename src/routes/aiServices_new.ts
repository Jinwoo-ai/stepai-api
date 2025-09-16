import express from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getDatabaseConnection } from '../configs/database';
import multer from 'multer';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// 파일 업로드 설정
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') {
      cb(null, true);
    } else {
      cb(new Error('엑셀 파일만 업로드 가능합니다.'));
    }
  }
});

// 테스트 라우트
router.get('/test', (_req, res) => {
  console.log('TEST ROUTE HIT');
  res.json({ message: 'test works' });
});

// 엑셀 샘플 파일 다운로드
router.get('/download-sample', (_req, res) => {
  console.log('DOWNLOAD SAMPLE ROUTE HIT');
  try {
    const filePath = path.resolve('/Users/jinwoo/StepAI/stepai_api/public/ai_services_template.xlsx');
    console.log('File path:', filePath);
    console.log('File exists:', fs.existsSync(filePath));
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: '샘플 파일을 찾을 수 없습니다.'
      });
    }
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="ai_services_template.xlsx"');
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error downloading sample file:', error);
    res.status(500).json({
      success: false,
      error: '샘플 파일 다운로드 중 오류가 발생했습니다.'
    });
  }
});

// AI 서비스 목록 조회
router.get('/', async (req, res) => {
  res.json({ success: true, data: [] });
});

export default router;