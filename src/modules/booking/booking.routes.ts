import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { sendSuccess } from '../../utils/response.util';
import { AppError } from '../../middlewares/error.middleware';
import { asyncHandler } from '../../utils/async-handler';

const router = Router();

const createSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().optional(),
  serviceType: z.string().min(1),
  packageName: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  paymentMethod: z.string().optional(),
  amount: z.number().optional(),
  paymentStatus: z.string().optional(),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'] as const;

// ─── Public ──────────────────────────────────────────
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const item = await prisma.booking.create({ data });
    sendSuccess(res, 'Booking submitted', item, 201);
  })
);

// ─── Admin ───────────────────────────────────────────
router.use(authenticate, authorize('ADMIN'));

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' } });
    sendSuccess(res, 'Bookings fetched', items);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const { status } = z.object({ status: z.enum(STATUSES) }).parse(req.body);
    const item = await prisma.booking.update({ where: { id: req.params.id }, data: { status } });
    sendSuccess(res, 'Booking updated', item);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Booking not found', 404);
    await prisma.booking.delete({ where: { id: req.params.id } });
    sendSuccess(res, 'Booking deleted');
  })
);

export default router;
