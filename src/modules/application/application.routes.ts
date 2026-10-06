import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { sendSuccess } from '../../utils/response.util';
import { AppError } from '../../middlewares/error.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { saveFile, saveImage, deleteFile } from '../../utils/storage.util';
import { env } from '../../config/env';

const uploadFields = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Math.max(env.MAX_FILE_SIZE_MB, env.MAX_IMAGE_SIZE_MB) * 1024 * 1024 },
}).fields([
  { name: 'cv', maxCount: 1 },
  { name: 'nid', maxCount: 1 },
]);

const router = Router();

const createSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  experience: z.string().optional(),
  education: z.string().optional(),
  cvUrl: z.string().optional(),
});

const STATUSES = ['pending', 'reviewed', 'shortlisted', 'hired', 'rejected'] as const;

// ─── Public ──────────────────────────────────────────
// Accepts multipart form-data with optional `cv` (PDF) and `nid` (image) files.
router.post(
  '/',
  uploadFields,
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;

    let cvUrl = data.cvUrl;
    let cvPublicId: string | undefined;
    let nidUrl: string | undefined;
    let nidPublicId: string | undefined;

    const cvFile = files?.['cv']?.[0];
    if (cvFile) {
      const stored = await saveFile(cvFile.buffer, cvFile.originalname, 'applications');
      cvUrl = stored.url;
      cvPublicId = stored.publicId;
    }

    const nidFile = files?.['nid']?.[0];
    if (nidFile) {
      const stored = await saveImage(nidFile.buffer, 'applications/nid');
      nidUrl = stored.url;
      nidPublicId = stored.publicId;
    }

    const item = await prisma.jobApplication.create({
      data: { ...data, cvUrl, cvPublicId, nidUrl, nidPublicId },
    });
    sendSuccess(res, 'Application submitted', item, 201);
  })
);

// ─── Admin ───────────────────────────────────────────
router.use(authenticate, authorize('ADMIN'));

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await prisma.jobApplication.findMany({ orderBy: { createdAt: 'desc' } });
    sendSuccess(res, 'Applications fetched', items);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const { status } = z.object({ status: z.enum(STATUSES) }).parse(req.body);
    const item = await prisma.jobApplication.update({
      where: { id: req.params.id },
      data: { status },
    });
    sendSuccess(res, 'Application updated', item);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.jobApplication.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Application not found', 404);
    if (existing.cvPublicId) await deleteFile(existing.cvPublicId);
    if (existing.nidPublicId) await deleteFile(existing.nidPublicId);
    await prisma.jobApplication.delete({ where: { id: req.params.id } });
    sendSuccess(res, 'Application deleted');
  })
);

export default router;
