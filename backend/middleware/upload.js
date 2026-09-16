import multer from 'multer';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 3 * 1024 * 1024; // kept modest since images are stored as base64 text in SQLite

export const uploadPhoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) return cb(new Error('Only JPG, PNG, WEBP, or GIF images are allowed'));
    cb(null, true);
  },
});

export function toDataUri(file) {
  return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
}
