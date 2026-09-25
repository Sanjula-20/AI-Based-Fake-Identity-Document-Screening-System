const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

const UPLOADS_DIR = path.join(__dirname, '../../uploads_private');

// Ensure private uploads directory exists outside public folder
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Allowed extensions & mime types
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'];
const BLOCKED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.js', '.html', '.zip', '.rar', '.sh', '.php', '.py'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Generate secure random filename
    const ext = path.extname(file.originalname).toLowerCase();
    const randomName = `${crypto.randomUUID()}${ext}`;
    cb(null, randomName);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`Security alert: File type ${ext} is strictly prohibited.`));
  }

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`Unsupported file type. Only JPG, JPEG, PNG, and PDF files under 10MB are permitted.`));
  }

  cb(null, true);
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: fileFilter
});

// Magic Byte Verification Function
const validateMagicBytes = (filePath) => {
  try {
    const buffer = Buffer.alloc(8);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 8, 0);
    fs.closeSync(fd);

    const hex = buffer.toString('hex').toUpperCase();

    // Check JPEG: FF D8 FF
    if (hex.startsWith('FFD8FF')) return true;

    // Check PNG: 89 50 4E 47
    if (hex.startsWith('89504E47')) return true;

    // Check PDF: %PDF (25 50 44 46)
    if (hex.startsWith('25504446')) return true;

    return false;
  } catch (error) {
    return false;
  }
};

module.exports = {
  upload,
  UPLOADS_DIR,
  validateMagicBytes
};
