import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { sendSuccess } from '../../utils/response.util';
import { AppError } from '../../middlewares/error.middleware';
import { asyncHandler } from '../../utils/async-handler';

const router = Router();

const createSchema = z.object({
  ownerName: z.string().min(1),
  ownerPhone: z.string().min(1),
  ownerEmail: z.string().email().optional().or(z.literal('')),
  ownerAddress: z.string().optional(),
  vehicleType: z.string().min(1),
  vehicleBrand: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleYear: z.string().optional(),
  registrationNo: z.string().optional(),
  seatingCapacity: z.number().int().positive().optional(),
  acAvailable: z.boolean().optional(),
  driverIncluded: z.boolean().optional(),
  serviceAreas: z.array(z.string()).optional(),
  dailyRate: z.number().positive().optional(),
  perKmRate: z.number().positive().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  imagePublicId: z.string().optional(),
});

// ─── Public: submit registration ─────────────────────────────────────────────
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const item = await prisma.vehicleRegistration.create({ data });
    sendSuccess(res, 'Vehicle registration submitted', item, 201);
  })
);

// ─── Public: list approved vehicles ──────────────────────────────────────────
router.get(
  '/available',
  asyncHandler(async (req, res) => {
    const { type } = req.query;
    const where: Record<string, unknown> = { status: 'approved', isActive: true };
    if (type) where.vehicleType = type;
    const items = await prisma.vehicleRegistration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, ownerName: true, ownerPhone: true, vehicleType: true,
        vehicleBrand: true, vehicleModel: true, seatingCapacity: true,
        acAvailable: true, driverIncluded: true, serviceAreas: true,
        dailyRate: true, perKmRate: true, description: true, imageUrl: true,
      },
    });
    sendSuccess(res, 'Available vehicles fetched', items);
  })
);

// ─── Admin ────────────────────────────────────────────────────────────────────
router.use(authenticate, authorize('ADMIN'));

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await prisma.vehicleRegistration.findMany({ orderBy: { createdAt: 'desc' } });
    sendSuccess(res, 'Vehicle registrations fetched', items);
  })
);

router.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const { status } = z.object({
      status: z.enum(['pending', 'approved', 'rejected']),
    }).parse(req.body);
    const isActive = status === 'approved';
    const item = await prisma.vehicleRegistration.update({
      where: { id: req.params.id },
      data: { status, isActive },
    });
    sendSuccess(res, 'Status updated', item);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const item = await prisma.vehicleRegistration.update({
      where: { id: req.params.id },
      data: req.body,
    });
    sendSuccess(res, 'Vehicle registration updated', item);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.vehicleRegistration.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Vehicle registration not found', 404);
    await prisma.vehicleRegistration.delete({ where: { id: req.params.id } });
    sendSuccess(res, 'Vehicle registration deleted');
  })
);

export default router;
