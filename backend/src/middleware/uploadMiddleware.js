// MAK Tours & Travels ERP - Avatar Upload & Storage Handler
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../../uploads/avatars');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cloudinary Configuration (if environment variables are supplied)
const hasCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

// Multer Disk Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const cleanExt = ext.toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `avatar-${uniqueSuffix}${cleanExt}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (allowedMime.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image format. Allowed formats: JPG, PNG, WEBP, GIF.'), false);
  }
};

export const avatarUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max
  }
});

/**
 * Uploads a Multer file to Cloudinary if available, or returns local static URL
 * @param {Object} file - Multer file object
 * @param {Object} req - Express request
 * @returns {Promise<string>} Image URL
 */
export async function processUploadedFile(file, req) {
  if (!file) return null;

  if (hasCloudinary) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'mak_erp/avatars',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      });

      // Remove local temp file after successful Cloudinary upload
      try {
        fs.unlinkSync(file.path);
      } catch {}

      return result.secure_url;
    } catch (err) {
      console.warn('Cloudinary upload error, falling back to local storage:', err.message);
    }
  }

  // Fallback to local static file URL
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/avatars/${file.filename}`;
}

/**
 * Converts a raw base64 data URL into a stored file or Cloudinary URL
 * Ensures MongoDB Atlas NEVER stores multi-megabyte base64 strings
 * @param {string} base64Str - Data URL string
 * @param {Object} req - Express request
 * @returns {Promise<string>} Clean URL string
 */
export async function processBase64Avatar(base64Str, req) {
  if (!base64Str || typeof base64Str !== 'string') return '';

  // If it's already an HTTP / HTTPS / static URL or short initials, return as is
  if (!base64Str.startsWith('data:image/')) {
    return base64Str;
  }

  try {
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return '';
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    const ext = mimeType.split('/')[1] || 'jpg';
    const filename = `avatar-${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
    const filePath = path.join(uploadDir, filename);

    if (hasCloudinary) {
      try {
        const uploadPromise = new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'mak_erp/avatars',
              transformation: [
                { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                { quality: 'auto', fetch_format: 'auto' }
              ]
            },
            (err, result) => {
              if (err) return reject(err);
              resolve(result.secure_url);
            }
          );
          stream.end(buffer);
        });
        const cloudUrl = await uploadPromise;
        return cloudUrl;
      } catch (cloudErr) {
        console.warn('Cloudinary stream error, saving base64 to disk:', cloudErr.message);
      }
    }

    // Save buffer to disk
    fs.writeFileSync(filePath, buffer);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return `${baseUrl}/uploads/avatars/${filename}`;
  } catch (err) {
    console.error('Error processing base64 avatar:', err.message);
    return '';
  }
}

export default {
  avatarUpload,
  processUploadedFile,
  processBase64Avatar
};
