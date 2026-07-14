import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { sendSuccess } from '../../utils/response.util';
import { AppError } from '../../middlewares/error.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { deleteFile } from '../../utils/storage.util';

const router = Router();

const baseSchema = z.object({
  type: z.string().optional(),
  titleEn: z.string().optional(),
  titleBn: z.string().optional(),
  url: z.string().min(1),
  urlPublicId: z.string().optional(),
  thumbnail: z.string().optional(),
  order: z.number().int().optional(),
});

// ─── Public ──────────────────────────────────────────
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await prisma.galleryItem.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
    sendSuccess(res, 'Gallery fetched', items);
  })
);

// ─── Admin ───────────────────────────────────────────
router.use(authenticate, authorize('ADMIN'));

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = baseSchema.parse(req.body);
    const item = await prisma.galleryItem.create({ data });
    sendSuccess(res, 'Gallery item created', item, 201);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = baseSchema.partial().parse(req.body);
    const item = await prisma.galleryItem.update({ where: { id: req.params.id }, data });
    sendSuccess(res, 'Gallery item updated', item);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.galleryItem.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Gallery item not found', 404);
    if (existing.urlPublicId) await deleteFile(existing.urlPublicId);
    await prisma.galleryItem.delete({ where: { id: req.params.id } });
    sendSuccess(res, 'Gallery item deleted');
  })
);

export default router;
