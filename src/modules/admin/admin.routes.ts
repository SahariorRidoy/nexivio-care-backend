import { Router } from 'express';
import { prisma } from '../../config/database';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { sendSuccess } from '../../utils/response.util';
import { asyncHandler } from '../../utils/async-handler';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const [
      totalBookings,
      pendingBookings,
      totalApplications,
      pendingApplications,
      totalReviews,
      pendingReviews,
      totalContacts,
      activeServices,
      activeTraining,
      activeBanners,
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'pending' } }),
      prisma.jobApplication.count(),
      prisma.jobApplication.count({ where: { status: 'pending' } }),
      prisma.review.count(),
      prisma.review.count({ where: { isApproved: false } }),
      prisma.contact.count(),
      prisma.service.count({ where: { isActive: true } }),
      prisma.training.count({ where: { isActive: true } }),
      prisma.banner.count({ where: { isActive: true } }),
    ]);

    sendSuccess(res, 'Stats fetched', {
      totalBookings,
      pendingBookings,
      totalApplications,
      pendingApplications,
      totalReviews,
      pendingReviews,
      totalContacts,
      activeServices,
      activeTraining,
      activeBanners,
    });
  })
);

export default router;
