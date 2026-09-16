const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/env');
const { httpError } = require('../utils/errors');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user?.id || 'anonymous';
    const workspaceId = req.params?.workspaceId || req.body?.workspaceId || 'default';
    const uploadPath = path.join(config.uploadsDir, userId, workspaceId);

    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md', '.csv', '.png', '.jpg', '.jpeg', '.webp'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      httpError(
        400,
        `Unsupported file type "${ext}". Supported formats: PDF, DOCX, TXT, MD, CSV, PNG, JPG, JPEG, WEBP`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

function detectFileType(filename, mimeType) {
  const ext = path.extname(filename).toLowerCase().replace('.', '');
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  if (ext === 'txt') return 'txt';
  if (ext === 'md') return 'md';
  if (ext === 'csv') return 'csv';
  if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) return 'image';
  return 'txt';
}

module.exports = {
  upload,
  detectFileType,
};
