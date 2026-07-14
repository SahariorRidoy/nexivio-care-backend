import multer from 'multer';
import path from 'path';
import { env } from '../config/env';
import { AppError } from './error.middleware';

const makeFilter =
  (allowedExt: RegExp, allowedMime: RegExp, message: string) =>
  (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ): void => {
    const validExt = allowedExt.test(path.extname(file.originalname).toLowerCase());
    const validMime = allowedMime.test(file.mimetype);
    if (validExt && validMime) {
      cb(null, true);
    } else {
      cb(new AppError(message, 400));
    }
  };

/** Image uploads — buffered in memory, then uploaded to Cloudinary. */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_IMAGE_SIZE_MB * 1024 * 1024 },
  fileFilter: makeFilter(
    /jpeg|jpg|png|gif|webp/,
    /image\/(jpeg|jpg|png|gif|webp)/,
    'Only image files are allowed (jpeg, jpg, png, gif, webp)'
  ),
});

/** PDF / document uploads — buffered in memory, then uploaded to Cloudinary as raw. */
export const uploadDocument = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: makeFilter(
    /pdf/,
    /application\/pdf/,
    'Only PDF files are allowed'
  ),
});

/** Video uploads — buffered in memory, then uploaded to Cloudinary as video. */
export const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: makeFilter(
    /mp4|webm|ogg|mov|avi|mkv/,
    /video\/(mp4|webm|ogg|quicktime|x-msvideo|x-matroska)/,
    'Only video files are allowed (mp4, webm, ogg, mov, avi, mkv)'
  ),
});
