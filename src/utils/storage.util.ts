import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';

export interface StoredFile {
  url: string;
  publicId: string;
}

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const uploadBuffer = (
  buffer: Buffer,
  folder: string,
  options: object = {}
): Promise<StoredFile> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `nexivio-care/${folder}`, ...options },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error('Cloudinary upload failed'));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });

export const saveImage = (buffer: Buffer, folder: string): Promise<StoredFile> =>
  uploadBuffer(buffer, folder, {
    resource_type: 'image',
    format: 'webp',
    eager: [{ quality: 80, fetch_format: 'webp' }],
    eager_async: false,
  });

export const saveFile = (
  buffer: Buffer,
  _originalName: string,
  folder: string
): Promise<StoredFile> =>
  uploadBuffer(buffer, folder, { resource_type: 'raw' });

export const saveVideo = (
  buffer: Buffer,
  _originalName: string,
  folder: string
): Promise<StoredFile> =>
  uploadBuffer(buffer, folder, { resource_type: 'video' });

export const deleteFile = async (publicId: string): Promise<void> => {
  if (!publicId) return;
  for (const resource_type of ['image', 'video', 'raw'] as const) {
    const res = await cloudinary.uploader.destroy(publicId, { resource_type });
    if (res.result === 'ok') return;
  }
};

// UPLOAD_ROOT kept for any legacy references
export const UPLOAD_ROOT = '/tmp/uploads';
