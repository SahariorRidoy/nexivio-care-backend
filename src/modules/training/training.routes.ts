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
  titleEn: z.string().min(1),
  titleBn: z.string().min(1),
  category: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionBn: z.string().optional(),
  image: z.string().optional(),
  imagePublicId: z.string().optional(),
  classType: z.string().optional(),
  duration: z.string().optional(),
  weeklyClasses: z.string().optional(),
  totalHours: z.string().optional(),
  fee: z.coerce.number().optional(),
  syllabusEn: z.array(z.string()).optional(),
  syllabusBn: z.array(z.string()).optional(),
  syllabusModules: z.array(z.object({
    titleEn: z.string(),
    titleBn: z.string(),
    items: z.array(z.string()),
  })).optional(),
  certificateInfoEn: z.string().optional(),
  certificateInfoBn: z.string().optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().optional(),
});

// ─── Public ──────────────────────────────────────────
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await prisma.training.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
    sendSuccess(res, 'Training fetched', items);
  })
);

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const item = await prisma.training.findUnique({ where: { slug: req.params.slug } });
    if (!item) throw new AppError('Training not found', 404);
    sendSuccess(res, 'Training fetched', item);
  })
);

// ─── Admin ───────────────────────────────────────────
router.use(authenticate, authorize('ADMIN'));

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = baseSchema.parse(req.body);
    const slug = data.slug || slugify(data.titleEn);
    const item = await prisma.training.create({ data: { ...data, slug } });
    sendSuccess(res, 'Training created', item, 201);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = baseSchema.partial().parse(req.body);
    const item = await prisma.training.update({ where: { id: req.params.id }, data });
    sendSuccess(res, 'Training updated', item);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.training.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Training not found', 404);
    if (existing.imagePublicId) await deleteFile(existing.imagePublicId);
    await prisma.training.delete({ where: { id: req.params.id } });
    sendSuccess(res, 'Training deleted');
  })
);

export default router;
