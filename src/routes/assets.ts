import express from 'express';
import { createUploadMiddleware, deleteFile, getFileUrl } from '../configs/upload';
import fs from 'fs';
import path from 'path';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Assets
 *   description: 파일 업로드 및 관리 API
 */

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
router.post('/upload/:type', (req, res, next) => {
  const type = req.params['type'];
  return createUploadMiddleware(type)(req, res, next);
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '업로드할 파일이 없습니다.'
      });
    }

    const type = req.params['type'];
    const filename = req.file.filename;
    const fileUrl = getFileUrl(filename, type);

    return res.json({
      success: true,
      data: {
        filename: filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: fileUrl
      },
      message: '파일이 성공적으로 업로드되었습니다.'
    });
  } catch (error) {
    console.error('파일 업로드 오류:', error);
    return res.status(500).json({
      success: false,
      error: '파일 업로드 중 오류가 발생했습니다.'
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
 *       404:
 *         description: 파일을 찾을 수 없음
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
router.delete('/delete/:type/:filename', async (req, res) => {
  try {
    const { type, filename } = req.params;
    const filePath = path.join('public/assets', type, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: '파일을 찾을 수 없습니다.'
      });
    }

    const deleted = deleteFile(filePath);
    
    if (deleted) {
      return res.json({
        success: true,
        message: '파일이 성공적으로 삭제되었습니다.'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: '파일 삭제 중 오류가 발생했습니다.'
      });
    }
  } catch (error) {
    console.error('파일 삭제 오류:', error);
    return res.status(500).json({
      success: false,
      error: '파일 삭제 중 오류가 발생했습니다.'
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
router.get('/list/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const dirPath = path.join('public/assets', type);

    if (!fs.existsSync(dirPath)) {
      return res.json({
        success: true,
        data: {
          files: [],
          total: 0
        },
        message: '디렉토리가 존재하지 않습니다.'
      });
    }

    const files = fs.readdirSync(dirPath)
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
      })
      .map(file => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          url: getFileUrl(file, type),
          size: stats.size,
          created_at: stats.birthtime
        };
      });

    return res.json({
      success: true,
      data: {
        files: files,
        total: files.length
      },
      message: '파일 목록 조회 성공'
    });
  } catch (error) {
    console.error('파일 목록 조회 오류:', error);
    return res.status(500).json({
      success: false,
      error: '파일 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

export default router; 