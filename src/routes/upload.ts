import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ApiResponse, FileUploadResponse } from '../types/database';

const router = Router();

// 업로드 디렉토리 설정
const uploadDir = path.join(__dirname, '../../uploads/attachments');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 파일명: timestamp_originalname
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const filename = `${timestamp}_${name}${ext}`;
    cb(null, filename);
  }
});

// 파일 필터 (허용되는 파일 타입)
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('허용되지 않는 파일 형식입니다.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB 제한
  }
});

// 단일 파일 업로드
router.post('/single', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      const response: ApiResponse = {
        success: false,
        error: '파일이 업로드되지 않았습니다.'
      };
      return res.status(400).json(response);
    }

    const fileUrl = `/uploads/attachments/${req.file.filename}`;
    
    const response: FileUploadResponse = {
      success: true,
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: fileUrl,
        type: req.file.mimetype
      }
    };

    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '파일 업로드 중 오류가 발생했습니다.'
    };
    
    res.status(500).json(response);
  }
});

// 다중 파일 업로드
router.post('/multiple', upload.array('files', 5), (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: '파일이 업로드되지 않았습니다.'
      };
      return res.status(400).json(response);
    }

    const uploadedFiles = files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      url: `/uploads/attachments/${file.filename}`,
      type: file.mimetype
    }));

    const response: ApiResponse = {
      success: true,
      data: uploadedFiles,
      message: `${files.length}개의 파일이 성공적으로 업로드되었습니다.`
    };

    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '파일 업로드 중 오류가 발생했습니다.'
    };
    
    res.status(500).json(response);
  }
});

// 파일 삭제
router.delete('/:filename', (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      const response: ApiResponse = {
        success: false,
        error: '파일을 찾을 수 없습니다.'
      };
      return res.status(404).json(response);
    }

    fs.unlinkSync(filePath);

    const response: ApiResponse = {
      success: true,
      message: '파일이 성공적으로 삭제되었습니다.'
    };

    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '파일 삭제 중 오류가 발생했습니다.'
    };
    
    res.status(500).json(response);
  }
});

export default router;