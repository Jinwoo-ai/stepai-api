import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Assets
 *   description: 파일 업로드 관리 API
 */

// 업로드 디렉토리 생성
const createUploadDir = (type: string) => {
  const uploadPath = path.join(__dirname, '../../public/assets', type);
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  return uploadPath;
};

// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.params['type'];
    if (type) {
      const uploadPath = createUploadDir(type);
      cb(null, uploadPath);
    } else {
      cb(new Error('업로드 타입이 지정되지 않았습니다.'), '');
    }
  },
  filename: (req, file, cb) => {
    // 원본 파일명 유지하되 중복 방지
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB 제한
  },
  fileFilter: (req, file, cb) => {
    // 허용된 파일 타입 체크
    const allowedTypes = /jpeg|jpg|png|gif|ico|svg|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다. (jpeg, jpg, png, gif, ico, svg, webp만 허용)'));
    }
  }
});

/**
 * @swagger
 * /api/assets/upload/{type}:
 *   post:
 *     summary: 파일 업로드
 *     tags: [Assets]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [categories, companies, ai-services]
 *         description: 업로드 타입
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 업로드할 파일
 *     responses:
 *       200:
 *         description: 파일 업로드 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.post('/upload/:type', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '업로드할 파일이 없습니다.'
      });
    }

    const type = req.params['type'];
    const fileName = req.file.filename;
    const originalName = req.file.originalname;
    const fileSize = req.file.size;
    const fileUrl = `/assets/${type}/${fileName}`;

    console.log(`📁 파일 업로드 성공: ${type}/${fileName}`);

    res.json({
      success: true,
      data: {
        filename: fileName,
        originalName: originalName,
        size: fileSize,
        url: fileUrl,
        type: type
      },
      message: '파일이 성공적으로 업로드되었습니다.'
    });
  } catch (error) {
    console.error('파일 업로드 오류:', error);
    res.status(500).json({
      success: false,
      error: '파일 업로드 중 오류가 발생했습니다.'
    });
  }
});

/**
 * @swagger
 * /api/assets/list/{type}:
 *   get:
 *     summary: 파일 목록 조회
 *     tags: [Assets]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [categories, companies, ai-services]
 *         description: 파일 타입
 *     responses:
 *       200:
 *         description: 파일 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/list/:type', (req, res) => {
  try {
    const type = req.params['type'];
    const uploadPath = path.join(__dirname, '../../public/assets', type);

    if (!fs.existsSync(uploadPath)) {
      return res.json({
        success: true,
        data: [],
        message: '업로드된 파일이 없습니다.'
      });
    }

    const files = fs.readdirSync(uploadPath)
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return /\.(jpeg|jpg|png|gif|ico|svg|webp)$/.test(ext);
      })
      .map(file => {
        const filePath = path.join(uploadPath, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          url: `/assets/${type}/${file}`,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      });

    res.json({
      success: true,
      data: files,
      message: `${type} 파일 목록 조회 성공`
    });
  } catch (error) {
    console.error('파일 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '파일 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * @swagger
 * /api/assets/delete/{type}/{filename}:
 *   delete:
 *     summary: 파일 삭제
 *     tags: [Assets]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [categories, companies, ai-services]
 *         description: 파일 타입
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: 삭제할 파일명
 *     responses:
 *       200:
 *         description: 파일 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.delete('/delete/:type/:filename', (req, res) => {
  try {
    const type = req.params['type'];
    const filename = req.params['filename'];
    const filePath = path.join(__dirname, '../../public/assets', type, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(400).json({
        success: false,
        error: '파일을 찾을 수 없습니다.'
      });
    }

    fs.unlinkSync(filePath);
    console.log(`🗑️ 파일 삭제 성공: ${type}/${filename}`);

    res.json({
      success: true,
      message: '파일이 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    console.error('파일 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '파일 삭제 중 오류가 발생했습니다.'
    });
  }
});

// 에러 핸들러 (multer 에러 처리)
router.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: '파일 크기가 너무 큽니다. (최대 10MB)'
      });
    }
  }
  
  if (error.message) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  next(error);
});

export default router; 