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

const packageSchema = z.object({
  tier: z.enum(['basic', 'standard', 'premium']),
  nameEn: z.string(),
  nameBn: z.string(),
  descriptionEn: z.string().optional(),
  descriptionBn: z.string().optional(),
  dutyHours: z.number(),
  dailyPrice: z.number(),
  weeklyPrice: z.number(),
  monthlyPrice: z.number(),
  includedFeatures: z.array(z.string()).default([]),
});

const baseSchema = z.object({
  slug: z.string().min(1).optional(),
  nameEn: z.string().min(1),
  nameBn: z.string().min(1),
  category: z.string().optional(),
  shortDescEn: z.string().optional(),
  shortDescBn: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionBn: z.string().optional(),
  image: z.string().optional(),
  imagePublicId: z.string().optional(),
  featuresEn: z.array(z.string()).optional(),
  featuresBn: z.array(z.string()).optional(),
  packages: z.array(packageSchema).optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().optional(),
});

// ─── Public ──────────────────────────────────────────
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await prisma.service.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
    // Migrate legacy `features` → `featuresEn` on the fly
    const normalized = items.map((s) => ({
      ...s,
      featuresEn: s.featuresEn.length > 0 ? s.featuresEn : [],
      featuresBn: s.featuresBn.length > 0 ? s.featuresBn : [],
    }));
    sendSuccess(res, 'Services fetched', normalized);
  })
);

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const item = await prisma.service.findUnique({ where: { slug: req.params.slug } });
    if (!item) throw new AppError('Service not found', 404);
    const normalized = {
      ...item,
      featuresEn: item.featuresEn.length > 0 ? item.featuresEn : [],
      featuresBn: item.featuresBn.length > 0 ? item.featuresBn : [],
    };
    sendSuccess(res, 'Service fetched', normalized);
  })
);

// ─── Admin ───────────────────────────────────────────
router.use(authenticate, authorize('ADMIN'));

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = baseSchema.parse(req.body);
    const slug = data.slug || slugify(data.nameEn);
    const item = await prisma.service.create({ data: { ...data, slug } });
    sendSuccess(res, 'Service created', item, 201);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = baseSchema.partial().parse(req.body);
    const item = await prisma.service.update({ where: { id: req.params.id }, data });
    sendSuccess(res, 'Service updated', item);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.service.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Service not found', 404);
    if (existing.imagePublicId) await deleteFile(existing.imagePublicId);
    await prisma.service.delete({ where: { id: req.params.id } });
    sendSuccess(res, 'Service deleted');
  })
);

export default router;
