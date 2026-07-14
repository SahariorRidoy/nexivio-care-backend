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
  titleEn: z.string().min(1),
  titleBn: z.string().min(1),
  subtitleEn: z.string().optional(),
  subtitleBn: z.string().optional(),
  image: z.string().min(1),
  imagePublicId: z.string().optional(),
  ctaLink: z.string().optional(),
  type: z.enum(['offer', 'campaign', 'training', 'service']).optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().optional(),
});

// ─── Public ──────────────────────────────────────────
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await prisma.banner.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
    sendSuccess(res, 'Banners fetched', items);
  })
);

// ─── Admin ───────────────────────────────────────────
router.use(authenticate, authorize('ADMIN'));

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = baseSchema.parse(req.body);
    const item = await prisma.banner.create({ data });
    sendSuccess(res, 'Banner created', item, 201);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = baseSchema.partial().parse(req.body);
    const item = await prisma.banner.update({ where: { id: req.params.id }, data });
    sendSuccess(res, 'Banner updated', item);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.banner.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Banner not found', 404);
    if (existing.imagePublicId) await deleteFile(existing.imagePublicId);
    await prisma.banner.delete({ where: { id: req.params.id } });
    sendSuccess(res, 'Banner deleted');
  })
);

export default router;
