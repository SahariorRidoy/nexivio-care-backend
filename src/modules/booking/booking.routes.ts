import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { sendSuccess } from '../../utils/response.util';
import { AppError } from '../../middlewares/error.middleware';
import { asyncHandler } from '../../utils/async-handler';

const router = Router();

const bookingSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().optional(),
  patientName: z.string().optional(),
  patientGender: z.string().optional(),
  relationship: z.string().optional(),
  serviceType: z.string().min(1),
  packageName: z.string().optional(),
  pricingPeriod: z.enum(['daily', 'weekly', 'monthly']).optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  paymentMethod: z.string().optional(),
  amount: z.number().optional(),
  paymentStatus: z.string().optional(),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
});

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'] as const;

async function generateReceiptNumber(): Promise<string> {
  const count = await prisma.booking.count();
  const year = new Date().getFullYear();
  return `RCP-${year}-${String(count + 1).padStart(5, '0')}`;
}

// ─── Public: customer booking ────────────────────────
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = bookingSchema.parse(req.body);
    const receiptNumber = await generateReceiptNumber();
    const item = await prisma.booking.create({ data: { ...data, receiptNumber } });
    sendSuccess(res, 'Booking submitted', item, 201);
  })
);

// ─── Admin routes ─────────────────────────────────────
router.use(authenticate, authorize('ADMIN'));

// IMPORTANT: /admin/create must be before /:id to avoid route conflict
router.post(
  '/admin/create',
  asyncHandler(async (req, res) => {
    const data = bookingSchema.parse(req.body);
    const receiptNumber = await generateReceiptNumber();
    const item = await prisma.booking.create({ data: { ...data, receiptNumber } });
    sendSuccess(res, 'Booking created', item, 201);
  })
);

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      include: { history: { orderBy: { createdAt: 'desc' } } },
    });
    sendSuccess(res, 'Bookings fetched', items);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const item = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { history: { orderBy: { createdAt: 'desc' } } },
    });
    if (!item) throw new AppError('Booking not found', 404);
    sendSuccess(res, 'Booking fetched', item);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Booking not found', 404);

    const updateSchema = z.object({
      status: z.enum(STATUSES).optional(),
      paymentStatus: z.string().optional(),
      amount: z.number().optional(),
      date: z.string().optional(),
      time: z.string().optional(),
      paymentMethod: z.string().optional(),
      transactionId: z.string().optional(),
      notes: z.string().optional(),
      packageName: z.string().optional(),
      changedBy: z.string().optional(),
      note: z.string().optional(),
    });

    const { changedBy, note, ...fields } = updateSchema.parse(req.body);

    const trackedFields = ['status', 'paymentStatus', 'amount', 'date', 'time', 'paymentMethod', 'transactionId'] as const;
    const historyEntries: { bookingId: string; field: string; oldValue: string | null; newValue: string | null; changedBy?: string; note?: string }[] = [];

    for (const field of trackedFields) {
      const newVal = fields[field];
      if (newVal !== undefined) {
        const oldVal = existing[field];
        const oldStr = oldVal !== null && oldVal !== undefined ? String(oldVal) : null;
        const newStr = String(newVal);
        if (oldStr !== newStr) {
          historyEntries.push({ bookingId: req.params.id, field, oldValue: oldStr, newValue: newStr, changedBy, note });
        }
      }
    }

    // Run history inserts and booking update separately to avoid $transaction type issues
    if (historyEntries.length > 0) {
      await prisma.bookingHistory.createMany({ data: historyEntries });
    }

    const item = await prisma.booking.update({
      where: { id: req.params.id },
      data: fields,
      include: { history: { orderBy: { createdAt: 'desc' } } },
    });

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
