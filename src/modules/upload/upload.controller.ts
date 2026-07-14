import { Request, Response, NextFunction } from 'express';
import { saveImage, saveFile, saveVideo, deleteFile } from '../../utils/storage.util';
import { sendSuccess, sendError } from '../../utils/response.util';

/**
 * Generic asset uploads for the admin panel. Images are converted to WebP;
 * PDFs/documents are stored as-is. Both are saved to the host filesystem and
 * served from `/uploads`. The response includes the public URL and the
 * `publicId` needed to delete the asset later.
 *
 * Pass an optional `folder` field (form-data or query) to group assets,
 * e.g. `products`, `banners`, `documents`. Defaults to `misc`.
 */

const resolveFolder = (req: Request, fallback: string): string => {
  const raw = (req.body?.folder ?? req.query?.folder) as string | undefined;
  if (!raw) return fallback;
  // Keep it to a safe, simple sub-path.
  return raw.replace(/[^a-zA-Z0-9/_-]/g, '').replace(/^\/+|\/+$/g, '') || fallback;
};

export const uploadImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      sendError(res, 'No image uploaded', 400);
      return;
    }
    const result = await saveImage(req.file.buffer, resolveFolder(req, 'images'));
    sendSuccess(res, 'Image uploaded', result, 201);
  } catch (err) {
    next(err);
  }
};

export const uploadImages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const files = (req.files as Express.Multer.File[]) ?? [];
    if (files.length === 0) {
      sendError(res, 'No images uploaded', 400);
      return;
    }
    const folder = resolveFolder(req, 'images');
    const results = await Promise.all(files.map((f) => saveImage(f.buffer, folder)));
    sendSuccess(res, 'Images uploaded', results, 201);
  } catch (err) {
    next(err);
  }
};

export const uploadPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      sendError(res, 'No file uploaded', 400);
      return;
    }
    const result = await saveFile(req.file.buffer, req.file.originalname, resolveFolder(req, 'documents'));
    sendSuccess(res, 'File uploaded', result, 201);
  } catch (err) {
    next(err);
  }
};

export const uploadVideoFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      sendError(res, 'No video uploaded', 400);
      return;
    }
    const result = await saveVideo(req.file.buffer, req.file.originalname, resolveFolder(req, 'videos'));
    sendSuccess(res, 'Video uploaded', result, 201);
  } catch (err) {
    next(err);
  }
};

export const removeAsset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { publicId } = req.body as { publicId?: string };
    if (!publicId) {
      sendError(res, 'publicId is required', 400);
      return;
    }
    await deleteFile(publicId);
    sendSuccess(res, 'Asset deleted');
  } catch (err) {
    next(err);
  }
};
