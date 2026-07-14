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
  roleEn: z.string().optional(),
  roleBn: z.string().optional(),
  image: z.string().optional(),
  imagePublicId: z.string().optional(),
  bio: z.string().optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

// ─── Public ───────────────────────────────────────────
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await prisma.teamMember.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    sendSuccess(res, 'Team members fetched', items);
  })
);

// ─── Admin ────────────────────────────────────────────
router.use(authenticate, authorize('ADMIN'));

router.get(
  '/all',
  asyncHandler(async (_req, res) => {
    const items = await prisma.teamMember.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] });
    sendSuccess(res, 'Team members fetched', items);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = baseSchema.parse(req.body);
    const item = await prisma.teamMember.create({ data });
    sendSuccess(res, 'Team member created', item, 201);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = baseSchema.partial().parse(req.body);
    const item = await prisma.teamMember.update({ where: { id: req.params.id }, data });
    sendSuccess(res, 'Team member updated', item);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.teamMember.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Team member not found', 404);
    if (existing.imagePublicId) await deleteFile(existing.imagePublicId).catch(() => {});
    await prisma.teamMember.delete({ where: { id: req.params.id } });
    sendSuccess(res, 'Team member deleted');
  })
);

export default router;
