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
  contentEn: z.string().optional(),
  contentBn: z.string().optional(),
  type: z.string().optional(),
  documentUrl: z.string().optional(),
  documentPublicId: z.string().optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().optional(),
});

// ─── Public ──────────────────────────────────────────
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await prisma.notice.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
    sendSuccess(res, 'Notices fetched', items);
  })
);

// ─── Admin ───────────────────────────────────────────
router.use(authenticate, authorize('ADMIN'));

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = baseSchema.parse(req.body);
    const item = await prisma.notice.create({ data });
    sendSuccess(res, 'Notice created', item, 201);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = baseSchema.partial().parse(req.body);
    const item = await prisma.notice.update({ where: { id: req.params.id }, data });
    sendSuccess(res, 'Notice updated', item);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.notice.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Notice not found', 404);
    if (existing.documentPublicId) await deleteFile(existing.documentPublicId);
    await prisma.notice.delete({ where: { id: req.params.id } });
    sendSuccess(res, 'Notice deleted');
  })
);

export default router;
