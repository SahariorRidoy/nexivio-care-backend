import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { uploadDocument } from '../../middlewares/upload.middleware';
import { sendSuccess } from '../../utils/response.util';
import { AppError } from '../../middlewares/error.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { saveFile, deleteFile } from '../../utils/storage.util';

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
// Accepts multipart form-data with an optional `cv` PDF, plus text fields.
router.post(
  '/',
  uploadDocument.single('cv'),
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    let cvUrl = data.cvUrl;
    let cvPublicId: string | undefined;

    if (req.file) {
      const stored = await saveFile(req.file.buffer, req.file.originalname, 'applications');
      cvUrl = stored.url;
      cvPublicId = stored.publicId;
    }

    const item = await prisma.jobApplication.create({
      data: { ...data, cvUrl, cvPublicId },
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
    await prisma.jobApplication.delete({ where: { id: req.params.id } });
    sendSuccess(res, 'Application deleted');
  })
);

export default router;
