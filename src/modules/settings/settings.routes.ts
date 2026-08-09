import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { sendSuccess } from '../../utils/response.util';
import { asyncHandler } from '../../utils/async-handler';
import { deleteFile } from '../../utils/storage.util';

const router = Router();

const ns = z.string().nullish().transform((v) => v ?? undefined);

const updateSchema = z.object({
  phone: ns,
  phone2: ns,
  whatsapp: ns,
  email: ns,
  address: ns,
  businessHours: ns,
  mapEmbedUrl: ns,
  facebookUrl: ns,
  youtubeUrl: ns,
  linkedinUrl: ns,
  instagramUrl: ns,
  messengerUrl: ns,
  logoUrl: ns,
  logoPublicId: ns,
  qrImageUrl: ns,
  qrPublicId: ns,
  missionEn: ns,
  missionBn: ns,
  visionEn: ns,
  visionBn: ns,
  bkashBaseUrl: ns,
  bkashAppKey: ns,
  bkashAppSecret: ns,
  bkashUsername: ns,
  bkashPassword: ns,
  smsApiKey: ns,
  smsSenderId: ns,
});

// ─── Public ───────────────────────────────────────────
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    let settings = await prisma.siteSetting.findUnique({ where: { id: 'singleton' } });
    if (!settings) {
      settings = await prisma.siteSetting.create({ data: { id: 'singleton' } });
    }
    sendSuccess(res, 'Settings fetched', settings);
  })
);

// ─── Admin ────────────────────────────────────────────
router.use(authenticate, authorize('ADMIN'));

router.patch(
  '/',
  asyncHandler(async (req, res) => {
    const data = updateSchema.parse(req.body);

    const existing = await prisma.siteSetting.findUnique({ where: { id: 'singleton' } });
    if (existing) {
      if (data.logoUrl && data.logoPublicId && existing.logoPublicId && existing.logoPublicId !== data.logoPublicId) {
        await deleteFile(existing.logoPublicId).catch(() => {});
      }
      if (data.qrImageUrl && data.qrPublicId && existing.qrPublicId && existing.qrPublicId !== data.qrPublicId) {
        await deleteFile(existing.qrPublicId).catch(() => {});
      }
    }

    const settings = await prisma.siteSetting.upsert({
      where: { id: 'singleton' },
      update: data,
      create: { id: 'singleton', ...data },
    });
    sendSuccess(res, 'Settings updated', settings);
  })
);

export default router;
