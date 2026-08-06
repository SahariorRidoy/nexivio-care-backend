import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { sendSuccess } from '../../utils/response.util';
import { AppError } from '../../middlewares/error.middleware';
import { asyncHandler } from '../../utils/async-handler';

const router = Router();

const createSchema = z.object({
  passengerName: z.string().min(1),
  passengerPhone: z.string().min(1),
  passengerEmail: z.string().email().optional().or(z.literal('')),
  pickupAddress: z.string().min(1),
  dropAddress: z.string().min(1),
  vehicleType: z.string().min(1),
  serviceCategory: z.string().optional(),
  vehicleRegistrationId: z.string().optional(),
  tripType: z.enum(['one-way', 'round-trip']).optional(),
  scheduledDate: z.string().min(1),
  scheduledTime: z.string().min(1),
  passengerCount: z.number().int().positive().optional(),
  luggageCount: z.number().int().min(0).optional(),
  specialRequirements: z.string().optional(),
  estimatedFare: z.number().optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

const STATUSES = ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'] as const;

// ─── Public ───────────────────────────────────────────────────────────────────
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const item = await prisma.transportBooking.create({ data });
    sendSuccess(res, 'Transport booking submitted', item, 201);
  })
);

// ─── Admin ────────────────────────────────────────────────────────────────────
router.use(authenticate, authorize('ADMIN'));

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await prisma.transportBooking.findMany({
      orderBy: { createdAt: 'desc' },
      include: { vehicleRegistration: { select: { ownerName: true, ownerPhone: true, vehicleBrand: true, vehicleModel: true } } },
    });
    sendSuccess(res, 'Transport bookings fetched', items);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const { status } = z.object({ status: z.enum(STATUSES) }).parse(req.body);
    const item = await prisma.transportBooking.update({ where: { id: req.params.id }, data: { status } });
    sendSuccess(res, 'Transport booking updated', item);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.transportBooking.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Transport booking not found', 404);
    await prisma.transportBooking.delete({ where: { id: req.params.id } });
    sendSuccess(res, 'Transport booking deleted');
  })
);

export default router;
