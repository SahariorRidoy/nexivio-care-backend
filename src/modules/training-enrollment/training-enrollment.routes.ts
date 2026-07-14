import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { sendSuccess } from '../../utils/response.util';
import { AppError } from '../../middlewares/error.middleware';
import { asyncHandler } from '../../utils/async-handler';

const router = Router();

const createSchema = z.object({
  trainingId: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  education: z.string().optional(),
  message: z.string().optional(),
});

const STATUSES = ['pending', 'confirmed', 'cancelled'] as const;

// ─── Public ──────────────────────────────────────────
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const training = await prisma.training.findUnique({ where: { id: data.trainingId } });
    if (!training) throw new AppError('Training not found', 404);
    const item = await prisma.trainingEnrollment.create({ data });
    sendSuccess(res, 'Enrollment submitted', item, 201);
  })
);

// ─── Admin ───────────────────────────────────────────
router.use(authenticate, authorize('ADMIN'));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const trainingId = req.query.trainingId as string | undefined;
    const items = await prisma.trainingEnrollment.findMany({
      where: trainingId ? { trainingId } : undefined,
      include: { training: { select: { titleEn: true, titleBn: true } } },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, 'Enrollments fetched', items);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const { status } = z.object({ status: z.enum(STATUSES) }).parse(req.body);
    const item = await prisma.trainingEnrollment.update({
      where: { id: req.params.id },
      data: { status },
    });
    sendSuccess(res, 'Enrollment updated', item);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.trainingEnrollment.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Enrollment not found', 404);
    await prisma.trainingEnrollment.delete({ where: { id: req.params.id } });
    sendSuccess(res, 'Enrollment deleted');
  })
);

export default router;
