import multer from 'multer';
import path from 'path';
import fs from 'fs';

// 업로드 디렉토리 생성
const createUploadDirs = () => {
  const dirs = [
    'public/assets/categories',
    'public/assets/companies',
    'public/assets/ai-services'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// 파일 필터링
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // 허용된 파일 타입
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('지원하지 않는 파일 형식입니다. JPEG, PNG, GIF, WebP만 허용됩니다.'));
  }
};

// 저장소 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.params['type'] || 'general';
    const uploadPath = `public/assets/${type}`;
    
    // 디렉토리가 없으면 생성
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // 파일명 중복 방지를 위해 타임스탬프 추가
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '');
    const filename = `${timestamp}_${originalName}`;
    cb(null, filename);
  }
});

// Multer 설정
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 제한
    files: 1 // 한 번에 하나의 파일만
  }
});

// 업로드 미들웨어 생성 함수
export const createUploadMiddleware = (type: string) => {
  return (req: any, res: any, next: any) => {
    req.params.type = type;
    return upload.single('file')(req, res, next);
  };
};

// 파일 삭제 함수
export const deleteFile = (filePath: string): boolean => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('파일 삭제 오류:', error);
    return false;
  }
};

// 파일 URL 생성 함수
export const getFileUrl = (filename: string, type: string): string => {
  return `/assets/${type}/${filename}`;
};

// 초기화
createUploadDirs(); 