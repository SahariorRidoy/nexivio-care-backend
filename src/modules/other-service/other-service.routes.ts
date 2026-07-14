import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { sendSuccess } from '../../utils/response.util';
import { AppError } from '../../middlewares/error.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { deleteFile } from '../../utils/storage.util';

const router = Router();

const slugify = (s: string): string =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const baseSchema = z.object({
  slug: z.string().min(1).optional(),
  nameEn: z.string().min(1),
  nameBn: z.string().min(1),
  shortDescEn: z.string().optional(),
  shortDescBn: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionBn: z.string().optional(),
  image: z.string().optional(),
  imagePublicId: z.string().optional(),
  icon: z.string().optional(),
  featuresEn: z.array(z.string()).optional(),
  featuresBn: z.array(z.string()).optional(),
  packages: z.any().optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().optional(),
});

// ─── Public ──────────────────────────────────────────
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await prisma.otherService.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
    sendSuccess(res, 'Other services fetched', items);
  })
);

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const item = await prisma.otherService.findUnique({ where: { slug: req.params.slug } });
    if (!item) throw new AppError('Other service not found', 404);
    sendSuccess(res, 'Other service fetched', item);
  })
);

// ─── Admin ───────────────────────────────────────────
router.use(authenticate, authorize('ADMIN'));

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = baseSchema.parse(req.body);
    const slug = data.slug || slugify(data.nameEn);
    const item = await prisma.otherService.create({ data: { ...data, slug } });
    sendSuccess(res, 'Other service created', item, 201);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = baseSchema.partial().parse(req.body);
    const item = await prisma.otherService.update({ where: { id: req.params.id }, data });
    sendSuccess(res, 'Other service updated', item);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.otherService.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Other service not found', 404);
    if (existing.imagePublicId) await deleteFile(existing.imagePublicId);
    await prisma.otherService.delete({ where: { id: req.params.id } });
    sendSuccess(res, 'Other service deleted');
  })
);

export default router;
