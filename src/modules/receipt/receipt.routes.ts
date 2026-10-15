import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { sendSuccess } from '../../utils/response.util';
import { AppError } from '../../middlewares/error.middleware';
import { asyncHandler } from '../../utils/async-handler';

const router = Router();
router.use(authenticate, authorize('ADMIN'));

const schema = z.object({
  date: z.string().min(1),
  receivedFrom: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().optional(),
  serviceType: z.string().min(1),
  paymentMethod: z.string().min(1),
  amount: z.number().positive(),
  paidAmount: z.number().min(0).optional(),
  paymentStatus: z.enum(['unpaid', 'partial', 'paid']).optional(),
  transactionRef: z.string().optional(),
  notes: z.string().optional(),
});

async function generateReceiptNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `MR-${year}-`;
  const last = await prisma.standaloneReceipt.findFirst({
    where: { receiptNumber: { startsWith: prefix } },
    orderBy: { receiptNumber: 'desc' },
    select: { receiptNumber: true },
  });
  const lastNum = last?.receiptNumber ? parseInt(last.receiptNumber.split('-').pop() ?? '0', 10) : 0;
  return `${prefix}${String(lastNum + 1).padStart(5, '0')}`;
}

router.get('/', asyncHandler(async (_req, res) => {
  const items = await prisma.standaloneReceipt.findMany({ orderBy: { createdAt: 'desc' } });
  sendSuccess(res, 'Receipts fetched', items);
}));

router.post('/', asyncHandler(async (req, res) => {
  const data = schema.parse(req.body);
  const receiptNumber = await generateReceiptNumber();
  const paidAmount = data.paidAmount ?? data.amount;
  const paymentStatus = data.paymentStatus ?? (paidAmount >= data.amount ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid');
  const item = await prisma.standaloneReceipt.create({ data: { ...data, receiptNumber, paidAmount, paymentStatus } });
  sendSuccess(res, 'Receipt created', item, 201);
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const existing = await prisma.standaloneReceipt.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError('Receipt not found', 404);
  const data = schema.partial().parse(req.body);
  const item = await prisma.standaloneReceipt.update({ where: { id: req.params.id }, data });
  sendSuccess(res, 'Receipt updated', item);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const existing = await prisma.standaloneReceipt.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError('Receipt not found', 404);
  await prisma.standaloneReceipt.delete({ where: { id: req.params.id } });
  sendSuccess(res, 'Receipt deleted');
}));

export default router;
