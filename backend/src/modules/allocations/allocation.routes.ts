import { Router } from 'express';
import { z } from 'zod';
import { AllocationOffer } from '../../models/AllocationOffer.model';
import { Allocation } from '../../models/Allocation.model';
import { Donation } from '../../models/Donation.model';
import { NGO } from '../../models/NGO.model';
import { authenticateUser, authorizeRole } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import { successResponse, paginatedResponse } from '../../utils/response';
import { NotFoundError, ForbiddenError, ConflictError } from '../../utils/errors';
import { UserRole } from '../../types';
import { handleOfferAcceptance, handleOfferRejection } from './allocation.engine';

const router = Router();

// GET /api/allocations - List allocations
router.get('/', authenticateUser, async (req, res, next) => {
  try {
    const { page = '1', limit = '20', status } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, parseInt(limit as string));

    const filter: any = {};

    if (req.user!.role === UserRole.NGO) {
      const ngo = await NGO.findOne({ userId: req.user!.userId });
      if (ngo) filter.ngoId = ngo._id;
    }

    if (status) {
      filter.status = { $in: (status as string).split(',') };
    }

    const [allocations, total] = await Promise.all([
      Allocation.find(filter)
        .populate({
          path: 'donationId',
          select: 'foodName category totalQuantity quantityUnit pickupAddress location images safeConsumptionDeadline pickupDeadline status',
          populate: { path: 'donorId', select: 'businessName address contactPhone' },
        })
        .populate('ngoId', 'organizationName address location contactPerson')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Allocation.countDocuments(filter),
    ]);

    return paginatedResponse(res, 'Allocations retrieved', allocations, {
      page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/allocations/offers - Get offers for NGO
router.get('/offers', authenticateUser, authorizeRole(UserRole.NGO), async (req, res, next) => {
  try {
    const ngo = await NGO.findOne({ userId: req.user!.userId });
    if (!ngo) throw new NotFoundError('NGO profile not found');

    const offers = await AllocationOffer.find({
      ngoId: ngo._id,
      status: { $in: ['PENDING'] },
      expiresAt: { $gt: new Date() },
    })
      .populate({
        path: 'donationId',
        select: 'foodName description category images totalQuantity availableQuantity quantityUnit pickupAddress location safeConsumptionDeadline pickupDeadline allergens storageRequirements',
        populate: { path: 'donorId', select: 'businessName donorType reliabilityScore' },
      })
      .sort({ expiresAt: 1 })
      .lean();

    return successResponse(res, 'Offers retrieved', { offers });
  } catch (error) {
    next(error);
  }
});

// GET /api/allocations/history - Allocation history
router.get('/history', authenticateUser, async (req, res, next) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, parseInt(limit as string));

    const filter: any = {};

    if (req.user!.role === UserRole.NGO) {
      const ngo = await NGO.findOne({ userId: req.user!.userId });
      if (ngo) filter.ngoId = ngo._id;
    }

    filter.status = { $in: ['COMPLETED', 'CANCELLED', 'FAILED'] };

    const [allocations, total] = await Promise.all([
      Allocation.find(filter)
        .populate('donationId', 'foodName category totalQuantity quantityUnit')
        .populate('ngoId', 'organizationName')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Allocation.countDocuments(filter),
    ]);

    return paginatedResponse(res, 'Allocation history retrieved', allocations, {
      page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/allocations/:id
router.get('/:id', authenticateUser, async (req, res, next) => {
  try {
    const allocation = await Allocation.findById(req.params.id)
      .populate({
        path: 'donationId',
        populate: { path: 'donorId', select: 'businessName address contactPhone location' },
      })
      .populate('ngoId', 'organizationName address location contactPerson')
      .lean();

    if (!allocation) throw new NotFoundError('Allocation not found');

    return successResponse(res, 'Allocation details retrieved', { allocation });
  } catch (error) {
    next(error);
  }
});

// POST /api/allocations/:id/accept - Accept allocation offer
router.post('/:id/accept', authenticateUser, authorizeRole(UserRole.NGO), async (req, res, next) => {
  try {
    const offer = await AllocationOffer.findById(req.params.id);
    if (!offer) throw new NotFoundError('Offer not found');

    // Verify ownership
    const ngo = await NGO.findOne({ userId: req.user!.userId });
    if (!ngo || offer.ngoId.toString() !== ngo._id.toString()) {
      throw new ForbiddenError('You can only accept offers sent to your organization');
    }

    const result = await handleOfferAcceptance(req.params.id);

    return successResponse(res, 'Offer accepted successfully', {
      allocation: result.allocation,
      remainingQuantity: result.donation.availableQuantity,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/allocations/:id/reject - Reject allocation offer
router.post('/:id/reject', authenticateUser, authorizeRole(UserRole.NGO), async (req, res, next) => {
  try {
    const { reason } = req.body || {};

    const offer = await AllocationOffer.findById(req.params.id);
    if (!offer) throw new NotFoundError('Offer not found');

    const ngo = await NGO.findOne({ userId: req.user!.userId });
    if (!ngo || offer.ngoId.toString() !== ngo._id.toString()) {
      throw new ForbiddenError('You can only reject offers sent to your organization');
    }

    await handleOfferRejection(req.params.id, reason);

    return successResponse(res, 'Offer rejected. The donation will be offered to the next eligible NGO.');
  } catch (error) {
    next(error);
  }
});

export default router;
