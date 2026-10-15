import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { env } from '../config/env';

export interface StoredFile {
  url: string;
  publicId: string;
}

const UPLOAD_ROOT = path.resolve(env.UPLOAD_DIR ?? 'uploads');

const ensureDir = (dir: string): void => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const randomName = (): string => crypto.randomBytes(16).toString('hex');

export const saveImage = async (buffer: Buffer, folder: string): Promise<StoredFile> => {
  const dir = path.join(UPLOAD_ROOT, folder);
  ensureDir(dir);
  const filename = `${randomName()}.webp`;
  await sharp(buffer).webp({ quality: 80 }).toFile(path.join(dir, filename));
  const publicId = `${folder}/${filename}`;
  return { url: `${env.APP_URL}/uploads/${publicId}`, publicId };
};

export const saveFile = async (buffer: Buffer, originalName: string, folder: string): Promise<StoredFile> => {
  const dir = path.join(UPLOAD_ROOT, folder);
  ensureDir(dir);
  const filename = `${randomName()}${path.extname(originalName)}`;
  fs.writeFileSync(path.join(dir, filename), buffer);
  const publicId = `${folder}/${filename}`;
  return { url: `${env.APP_URL}/uploads/${publicId}`, publicId };
};

export const saveVideo = async (buffer: Buffer, originalName: string, folder: string): Promise<StoredFile> => {
  const dir = path.join(UPLOAD_ROOT, folder);
  ensureDir(dir);
  const filename = `${randomName()}${path.extname(originalName)}`;
  fs.writeFileSync(path.join(dir, filename), buffer);
  const publicId = `${folder}/${filename}`;
  return { url: `${env.APP_URL}/uploads/${publicId}`, publicId };
};

export const deleteFile = async (publicId: string): Promise<void> => {
  if (!publicId) return;
  const filePath = path.join(UPLOAD_ROOT, publicId);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

export const UPLOAD_ROOT_PATH = UPLOAD_ROOT;
