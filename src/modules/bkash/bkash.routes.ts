import { Router, Request, Response } from 'express';
import { z } from 'zod';
import axios from 'axios';
import { prisma } from '../../config/database';
import { asyncHandler } from '../../utils/async-handler';
import { sendSuccess } from '../../utils/response.util';
import { AppError } from '../../middlewares/error.middleware';

const router = Router();

async function getBkashConfig() {
  const s = await prisma.siteSetting.findUnique({ where: { id: 'singleton' } });
  if (!s?.bkashAppKey || !s?.bkashAppSecret || !s?.bkashUsername || !s?.bkashPassword) {
    throw new AppError('bKash credentials not configured', 503);
  }
  return {
    baseUrl: s.bkashBaseUrl ?? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
    appKey: s.bkashAppKey,
    appSecret: s.bkashAppSecret,
    username: s.bkashUsername,
    password: s.bkashPassword,
  };
}

async function grantToken(cfg: Awaited<ReturnType<typeof getBkashConfig>>) {
  const { data } = await axios.post(
    `${cfg.baseUrl}/tokenized/checkout/token/grant`,
    { app_key: cfg.appKey, app_secret: cfg.appSecret },
    {
      headers: {
        'Content-Type': 'application/json',
        username: cfg.username,
        password: cfg.password,
      },
    }
  );
  if (!data.id_token) throw new AppError('bKash token grant failed', 502);
  return data.id_token as string;
}

// POST /api/bkash/create-payment
router.post(
  '/create-payment',
  asyncHandler(async (req: Request, res: Response) => {
    const { amount, bookingId, callbackUrl } = z
      .object({
        amount: z.string(),
        bookingId: z.string(),
        callbackUrl: z.string().url(),
      })
      .parse(req.body);

    const cfg = await getBkashConfig();
    const token = await grantToken(cfg);

    const { data } = await axios.post(
      `${cfg.baseUrl}/tokenized/checkout/create`,
      {
        mode: '0011',
        payerReference: bookingId,
        callbackURL: callbackUrl,
        amount,
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: `INV-${bookingId}-${Date.now()}`,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
          'X-APP-Key': cfg.appKey,
        },
      }
    );

    if (data.statusCode !== '0000') {
      throw new AppError(data.statusMessage ?? 'bKash create payment failed', 502);
    }

    sendSuccess(res, 'Payment created', {
      bkashURL: data.bkashURL,
      paymentID: data.paymentID,
    });
  })
);

// POST /api/bkash/execute-payment
router.post(
  '/execute-payment',
  asyncHandler(async (req: Request, res: Response) => {
    const { paymentID } = z.object({ paymentID: z.string() }).parse(req.body);

    const cfg = await getBkashConfig();
    const token = await grantToken(cfg);

    const { data } = await axios.post(
      `${cfg.baseUrl}/tokenized/checkout/execute`,
      { paymentID },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
          'X-APP-Key': cfg.appKey,
        },
      }
    );

    if (data.statusCode !== '0000') {
      throw new AppError(data.statusMessage ?? 'bKash execute payment failed', 502);
    }

    const bookingId = data.payerReference;
    if (bookingId) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: 'paid',
          transactionId: data.trxID,
          amount: parseFloat(data.amount),
        },
      }).catch(() => {});
    }

    sendSuccess(res, 'Payment executed', {
      trxID: data.trxID,
      amount: data.amount,
      payerReference: data.payerReference,
    });
  })
);

export default router;
