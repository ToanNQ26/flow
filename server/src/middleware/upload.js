const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Đảm bảo thư mục uploads tồn tại
const uploadDir = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Tạo tên file unique: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50);
    cb(null, `${uniqueSuffix}-${baseName}${ext}`);
  },
});

// Bộ lọc file: chỉ cho phép PDF và hình ảnh
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Loại file "${file.mimetype}" không được hỗ trợ. Chỉ chấp nhận: PDF, JPEG, PNG, WebP.`
      ),
      false
    );
  }
};

// Middleware upload (tối đa 5 file, mỗi file tối đa 10MB)
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5,
  },
});

module.exports = upload;
