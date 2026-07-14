import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { sendSuccess } from '../../utils/response.util';
import { AppError } from '../../middlewares/error.middleware';
import { asyncHandler } from '../../utils/async-handler';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

const sendSchema = z.object({
  to: z.string().min(11),
  message: z.string().min(1).max(640),
});

// Send SMS via BDBulkSMS (bdbulksms.net)
router.post(
  '/send',
  asyncHandler(async (req, res) => {
    const { to, message } = sendSchema.parse(req.body);

    const settings = await prisma.siteSetting.findUnique({ where: { id: 'singleton' } });
    if (!settings?.smsApiKey || !settings?.smsSenderId) {
      throw new AppError('SMS API key and Sender ID not configured in settings', 400);
    }

    let status = 'sent';
    let responseText = '';

    try {
      const smsRes = await fetch('http://bdbulksms.net/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: settings.smsApiKey,
          type: 'text',
          contacts: to,
          senderid: settings.smsSenderId,
          msg: message,
        }),
      });
      responseText = await smsRes.text();
      // BDBulkSMS returns {"response_code":202,...} on success
      if (!responseText.includes('202')) status = 'failed';
    } catch (err) {
      status = 'failed';
      responseText = err instanceof Error ? err.message : 'Network error';
    }

    const log = await prisma.smsLog.create({
      data: {
        to,
        message,
        status,
        response: responseText,
        sentBy: req.user?.email ?? 'Admin',
      },
    });

    if (status === 'failed') {
      throw new AppError(`SMS failed: ${responseText}`, 502);
    }

    sendSuccess(res, 'SMS sent successfully', log, 201);
  })
);

// List SMS logs with pagination
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [total, logs] = await Promise.all([
      prisma.smsLog.count(),
      prisma.smsLog.findMany({ orderBy: { createdAt: 'desc' }, skip, take: limit }),
    ]);

    sendSuccess(res, 'SMS logs fetched', logs, 200, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  })
);

export default router;
