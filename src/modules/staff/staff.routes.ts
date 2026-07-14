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
  nameEn: z.string().min(1),
  nameBn: z.string().min(1),
  designationEn: z.string().optional(),
  designationBn: z.string().optional(),
  image: z.string().optional(),
  imagePublicId: z.string().optional(),
  pointsEn: z.array(z.string()).optional(),
  pointsBn: z.array(z.string()).optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

// ─── Public ───────────────────────────────────────────
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await prisma.staff.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    sendSuccess(res, 'Staff fetched', items);
  })
);

// ─── Admin ────────────────────────────────────────────
router.use(authenticate, authorize('ADMIN'));

router.get(
  '/all',
  asyncHandler(async (_req, res) => {
    const items = await prisma.staff.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] });
    sendSuccess(res, 'Staff fetched', items);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = baseSchema.parse(req.body);
    const item = await prisma.staff.create({ data });
    sendSuccess(res, 'Staff created', item, 201);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = baseSchema.partial().parse(req.body);
    const item = await prisma.staff.update({ where: { id: req.params.id }, data });
    sendSuccess(res, 'Staff updated', item);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.staff.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Staff not found', 404);
    if (existing.imagePublicId) await deleteFile(existing.imagePublicId).catch(() => {});
    await prisma.staff.delete({ where: { id: req.params.id } });
    sendSuccess(res, 'Staff deleted');
  })
);

export default router;
