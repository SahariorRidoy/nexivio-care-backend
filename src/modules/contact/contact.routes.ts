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
  email: z.string().email().optional().or(z.literal('')),
  subject: z.string().min(1),
  message: z.string().min(1),
});

// ─── Public ──────────────────────────────────────────
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const item = await prisma.contact.create({ data });
    sendSuccess(res, 'Message sent', item, 201);
  })
);

// ─── Admin ───────────────────────────────────────────
router.use(authenticate, authorize('ADMIN'));

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await prisma.contact.findMany({ orderBy: { createdAt: 'desc' } });
    sendSuccess(res, 'Contacts fetched', items);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const { isRead } = z.object({ isRead: z.boolean() }).parse(req.body);
    const item = await prisma.contact.update({ where: { id: req.params.id }, data: { isRead } });
    sendSuccess(res, 'Contact updated', item);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.contact.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Contact not found', 404);
    await prisma.contact.delete({ where: { id: req.params.id } });
    sendSuccess(res, 'Contact deleted');
  })
);

export default router;
