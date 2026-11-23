import { Router } from 'express';
import { z } from 'zod';
import { Donor } from '../../models/Donor.model';
import { Donation } from '../../models/Donation.model';
import { authenticateUser, authorizeRole } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import { successResponse } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';
import { UserRole, DonationStatus } from '../../types';

const router = Router();

const updateProfileSchema = z.object({
  body: z.object({
    businessName: z.string().min(2).max(100).optional(),
    description: z.string().max(1000).optional(),
    contactPhone: z.string().max(20).optional(),
    website: z.string().url().optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pincode: z.string().optional(),
      country: z.string().default('India'),
    }).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  }),
});

// GET /api/donors/profile
router.get('/profile', authenticateUser, authorizeRole(UserRole.DONOR), async (req, res, next) => {
  try {
    const donor = await Donor.findOne({ userId: req.user!.userId }).populate('userId', 'name email phone profileImage accountStatus');
    if (!donor) throw new NotFoundError('Donor profile not found');
    return successResponse(res, 'Donor profile retrieved', { donor });
  } catch (error) {
    next(error);
  }
});

// PUT /api/donors/profile
router.put('/profile', authenticateUser, authorizeRole(UserRole.DONOR), validateRequest(updateProfileSchema), async (req, res, next) => {
  try {
    const { businessName, description, contactPhone, website, address, latitude, longitude } = req.body;
    const updateData: any = {};
    if (businessName) updateData.businessName = businessName;
    if (description !== undefined) updateData.description = description;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
    if (website !== undefined) updateData.website = website;
    if (address) updateData.address = address;
    if (latitude !== undefined && longitude !== undefined) {
      updateData.location = {
        type: 'Point',
        coordinates: [longitude, latitude],
      };
    }

    const donor = await Donor.findOneAndUpdate(
      { userId: req.user!.userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!donor) throw new NotFoundError('Donor profile not found');
    return successResponse(res, 'Donor profile updated', { donor });
  } catch (error) {
    next(error);
  }
});

// POST /api/donors/verification
router.post('/verification', authenticateUser, authorizeRole(UserRole.DONOR), async (req, res, next) => {
  try {
    const { documentUrl, documentType } = req.body;
    const donor = await Donor.findOne({ userId: req.user!.userId });
    if (!donor) throw new NotFoundError('Donor profile not found');

    donor.verificationDocuments.push({
      url: documentUrl,
      type: documentType || 'Business License',
      uploadedAt: new Date(),
    });
    donor.verificationStatus = 'UNDER_REVIEW' as any;
    await donor.save();

    return successResponse(res, 'Verification documents submitted for review', { donor });
  } catch (error) {
    next(error);
  }
});

// GET /api/donors/donations
router.get('/donations', authenticateUser, authorizeRole(UserRole.DONOR), async (req, res, next) => {
  try {
    const donor = await Donor.findOne({ userId: req.user!.userId });
    if (!donor) throw new NotFoundError('Donor profile not found');

    const donations = await Donation.find({ donorId: donor._id }).sort({ createdAt: -1 });
    return successResponse(res, 'Donor donations retrieved', { donations });
  } catch (error) {
    next(error);
  }
});

// GET /api/donors/analytics
router.get('/analytics', authenticateUser, authorizeRole(UserRole.DONOR), async (req, res, next) => {
  try {
    const donor = await Donor.findOne({ userId: req.user!.userId });
    if (!donor) throw new NotFoundError('Donor profile not found');

    const totalDonations = await Donation.countDocuments({ donorId: donor._id });
    const completedDonations = await Donation.countDocuments({ donorId: donor._id, status: DonationStatus.COMPLETED });
    const activeDonations = await Donation.countDocuments({
      donorId: donor._id,
      status: { $in: [DonationStatus.AVAILABLE, DonationStatus.OFFERED, DonationStatus.PARTIALLY_ALLOCATED, DonationStatus.FULLY_ALLOCATED] },
    });
    const cancelledDonations = await Donation.countDocuments({ donorId: donor._id, status: DonationStatus.CANCELLED });
    const expiredDonations = await Donation.countDocuments({ donorId: donor._id, status: DonationStatus.EXPIRED });

    const totalQuantityAgg = await Donation.aggregate([
      { $match: { donorId: donor._id } },
      { $group: { _id: null, total: { $sum: '$totalQuantity' }, redistributed: { $sum: '$allocatedQuantity' } } },
    ]);

    const totalFoodDonated = totalQuantityAgg[0]?.total || 0;
    const totalRedistributed = totalQuantityAgg[0]?.redistributed || 0;
    const successRate = totalDonations > 0 ? Math.round((completedDonations / totalDonations) * 100) : 0;

    return successResponse(res, 'Donor analytics retrieved', {
      analytics: {
        totalDonations,
        completedDonations,
        activeDonations,
        cancelledDonations,
        expiredDonations,
        totalFoodDonated,
        totalRedistributed,
        successRate,
        reliabilityScore: donor.reliabilityScore || 85,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
