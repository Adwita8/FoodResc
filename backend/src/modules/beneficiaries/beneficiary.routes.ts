import { Router } from 'express';
import { Beneficiary } from '../../models/Beneficiary.model';
import { FoodRequest } from '../../models/FoodRequest.model';
import { Donation } from '../../models/Donation.model';
import { authenticateUser, authorizeRole } from '../../middleware/auth';
import { successResponse } from '../../utils/response';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { UserRole, DonationStatus } from '../../types';

const router = Router();

// GET /api/beneficiaries/profile
router.get('/profile', authenticateUser, authorizeRole(UserRole.BENEFICIARY), async (req, res, next) => {
  try {
    const beneficiary = await Beneficiary.findOne({ userId: req.user!.userId }).populate('userId', 'name email phone');
    if (!beneficiary) throw new NotFoundError('Beneficiary profile not found');
    return successResponse(res, 'Beneficiary profile retrieved', { beneficiary });
  } catch (error) {
    next(error);
  }
});

// GET /api/beneficiaries/requests
router.get('/requests', authenticateUser, authorizeRole(UserRole.BENEFICIARY), async (req, res, next) => {
  try {
    const beneficiary = await Beneficiary.findOne({ userId: req.user!.userId });
    if (!beneficiary) throw new NotFoundError('Beneficiary profile not found');

    const requests = await FoodRequest.find({ beneficiaryId: beneficiary._id })
      .populate('donationId', 'foodName pickupAddress category')
      .sort({ createdAt: -1 });

    return successResponse(res, 'Food requests retrieved', { requests });
  } catch (error) {
    next(error);
  }
});

// POST /api/beneficiaries/request
router.post('/request', authenticateUser, authorizeRole(UserRole.BENEFICIARY), async (req, res, next) => {
  try {
    const { donationId, requestedQuantity, requestedCategory } = req.body;
    const beneficiary = await Beneficiary.findOne({ userId: req.user!.userId });
    if (!beneficiary) throw new NotFoundError('Beneficiary profile not found');

    if (requestedQuantity > 5) {
      throw new ValidationError('Portion limit exceeded. Maximum 5 portions allowed per individual request.');
    }

    const foodRequest = await FoodRequest.create({
      beneficiaryId: beneficiary._id,
      donationId,
      requestedCategory: requestedCategory || 'COOKED_MEALS',
      requestedQuantity: requestedQuantity || 2,
      status: 'APPROVED',
      pickupInstructions: 'Please present your request ID at the distribution counter.',
    });

    return successResponse(res, 'Food portion requested successfully', { foodRequest }, 201);
  } catch (error) {
    next(error);
  }
});

export default router;
