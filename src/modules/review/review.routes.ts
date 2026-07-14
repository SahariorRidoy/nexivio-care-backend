import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { sendSuccess } from '../../utils/response.util';
import { AppError } from '../../middlewares/error.middleware';
import { asyncHandler } from '../../utils/async-handler';

const router = Router();

const createSchema = z.object({
  customerName: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  commentEn: z.string().nullable().optional(),
  commentBn: z.string().nullable().optional(),
  serviceUsed: z.string().nullable().optional(),
});

const updateSchema = z.object({
  customerName: z.string().min(1).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  commentEn: z.string().nullable().optional(),
  commentBn: z.string().nullable().optional(),
  serviceUsed: z.string().nullable().optional(),
  isApproved: z.boolean().optional(),
});

// ─── Public ──────────────────────────────────────────
router.get(
  '/approved',
  asyncHandler(async (_req, res) => {
    const items = await prisma.review.findMany({
      where: { isApproved: true },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, 'Reviews fetched', items);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const item = await prisma.review.create({ data });
    sendSuccess(res, 'Review submitted — pending approval', item, 201);
  })
);

// ─── Admin ───────────────────────────────────────────
router.use(authenticate, authorize('ADMIN'));

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await prisma.review.findMany({ orderBy: { createdAt: 'desc' } });
    sendSuccess(res, 'Reviews fetched', items);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = updateSchema.parse(req.body);
    const item = await prisma.review.update({ where: { id: req.params.id }, data });
    sendSuccess(res, 'Review updated', item);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Review not found', 404);
    await prisma.review.delete({ where: { id: req.params.id } });
    sendSuccess(res, 'Review deleted');
  })
);

export default router;
