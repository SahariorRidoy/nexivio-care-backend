import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { sendSuccess } from '../../utils/response.util';
import { AppError } from '../../middlewares/error.middleware';
import { asyncHandler } from '../../utils/async-handler';

const router = Router();
router.use(authenticate, authorize('ADMIN'));

const itemSchema = z.object({
  service: z.string().min(1),
  package: z.string().optional(),
  rate: z.number().min(0),
  days: z.number().min(0),
  amount: z.number().min(0),
});

const schema = z.object({
  invoiceDate: z.string().min(1),
  clientName: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().optional(),
  address: z.string().min(1),
  items: z.array(itemSchema).min(1),
  subtotal: z.number().min(0),
  discount: z.number().min(0).optional(),
  total: z.number().min(0),
  paidAmount: z.number().min(0).optional(),
  paymentStatus: z.enum(['unpaid', 'partial', 'paid']).optional(),
  paymentMethod: z.string().optional(),
  transactionRef: z.string().optional(),
  notes: z.string().optional(),
});

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const last = await prisma.standaloneInvoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: 'desc' },
    select: { invoiceNumber: true },
  });
  const lastNum = last?.invoiceNumber ? parseInt(last.invoiceNumber.split('-').pop() ?? '0', 10) : 0;
  return `${prefix}${String(lastNum + 1).padStart(5, '0')}`;
}

router.get('/', asyncHandler(async (_req, res) => {
  const items = await prisma.standaloneInvoice.findMany({ orderBy: { createdAt: 'desc' } });
  sendSuccess(res, 'Invoices fetched', items);
}));

router.post('/', asyncHandler(async (req, res) => {
  const data = schema.parse(req.body);
  const invoiceNumber = await generateInvoiceNumber();
  const paidAmount = data.paidAmount ?? 0;
  const paymentStatus = data.paymentStatus ?? (paidAmount >= data.total ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid');
  const item = await prisma.standaloneInvoice.create({
    data: { ...data, invoiceNumber, paidAmount, paymentStatus, discount: data.discount ?? 0 },
  });
  sendSuccess(res, 'Invoice created', item, 201);
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const existing = await prisma.standaloneInvoice.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError('Invoice not found', 404);
  const data = schema.partial().parse(req.body);
  const item = await prisma.standaloneInvoice.update({ where: { id: req.params.id }, data });
  sendSuccess(res, 'Invoice updated', item);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const existing = await prisma.standaloneInvoice.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError('Invoice not found', 404);
  await prisma.standaloneInvoice.delete({ where: { id: req.params.id } });
  sendSuccess(res, 'Invoice deleted');
}));

export default router;
