import { Router } from 'express';
import { z } from 'zod';
import { NGO } from '../../models/NGO.model';
import { Allocation } from '../../models/Allocation.model';
import { authenticateUser, authorizeRole } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import { successResponse } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';
import { UserRole } from '../../types';

const router = Router();

const updateProfileSchema = z.object({
  body: z.object({
    organizationName: z.string().min(2).max(100).optional(),
    registrationNumber: z.string().optional(),
    description: z.string().max(1000).optional(),
    contactPerson: z.string().optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pincode: z.string().optional(),
      country: z.string().default('India'),
    }).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    acceptedFoodCategories: z.array(z.string()).optional(),
    maximumCapacity: z.number().min(0).optional(),
    availableCapacity: z.number().min(0).optional(),
    transportationAvailability: z.boolean().optional(),
    beneficiaryCount: z.number().min(0).optional(),
  }),
});

// GET /api/ngos/profile
router.get('/profile', authenticateUser, authorizeRole(UserRole.NGO), async (req, res, next) => {
  try {
    const ngo = await NGO.findOne({ userId: req.user!.userId }).populate('userId', 'name email phone profileImage accountStatus');
    if (!ngo) throw new NotFoundError('NGO profile not found');
    return successResponse(res, 'NGO profile retrieved', { ngo });
  } catch (error) {
    next(error);
  }
});

// PUT /api/ngos/profile
router.put('/profile', authenticateUser, authorizeRole(UserRole.NGO), validateRequest(updateProfileSchema), async (req, res, next) => {
  try {
    const {
      organizationName, registrationNumber, description, contactPerson,
      address, latitude, longitude, acceptedFoodCategories,
      maximumCapacity, availableCapacity, transportationAvailability, beneficiaryCount,
    } = req.body;

    const updateData: any = {};
    if (organizationName) updateData.organizationName = organizationName;
    if (registrationNumber !== undefined) updateData.registrationNumber = registrationNumber;
    if (description !== undefined) updateData.description = description;
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson;
    if (address) updateData.address = address;
    if (latitude !== undefined && longitude !== undefined) {
      updateData.location = {
        type: 'Point',
        coordinates: [longitude, latitude],
      };
    }
    if (acceptedFoodCategories) updateData.acceptedFoodCategories = acceptedFoodCategories;
    if (maximumCapacity !== undefined) updateData.maximumCapacity = maximumCapacity;
    if (availableCapacity !== undefined) updateData.availableCapacity = availableCapacity;
    if (transportationAvailability !== undefined) updateData.transportationAvailability = transportationAvailability;
    if (beneficiaryCount !== undefined) updateData.beneficiaryCount = beneficiaryCount;

    const ngo = await NGO.findOneAndUpdate(
      { userId: req.user!.userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!ngo) throw new NotFoundError('NGO profile not found');
    return successResponse(res, 'NGO profile updated', { ngo });
  } catch (error) {
    next(error);
  }
});

// POST /api/ngos/verification
router.post('/verification', authenticateUser, authorizeRole(UserRole.NGO), async (req, res, next) => {
  try {
    const { documentUrl, documentType } = req.body;
    const ngo = await NGO.findOne({ userId: req.user!.userId });
    if (!ngo) throw new NotFoundError('NGO profile not found');

    ngo.verificationDocuments.push({
      url: documentUrl,
      type: documentType || 'NGO Certificate / 12A / 80G',
      uploadedAt: new Date(),
    });
    ngo.verificationStatus = 'UNDER_REVIEW' as any;
    await ngo.save();

    return successResponse(res, 'Verification documents submitted for review', { ngo });
  } catch (error) {
    next(error);
  }
});

// GET /api/ngos/analytics
router.get('/analytics', authenticateUser, authorizeRole(UserRole.NGO), async (req, res, next) => {
  try {
    const ngo = await NGO.findOne({ userId: req.user!.userId });
    if (!ngo) throw new NotFoundError('NGO profile not found');

    const totalAllocations = await Allocation.countDocuments({ ngoId: ngo._id });
    const completedAllocations = await Allocation.countDocuments({ ngoId: ngo._id, status: 'COMPLETED' });
    const pendingAllocations = await Allocation.countDocuments({
      ngoId: ngo._id,
      status: { $in: ['PENDING', 'ACCEPTED', 'PICKED_UP'] },
    });

    const quantityAgg = await Allocation.aggregate([
      { $match: { ngoId: ngo._id, status: 'COMPLETED' } },
      { $group: { _id: null, totalCollected: { $sum: '$allocatedQuantity' } } },
    ]);

    const totalFoodReceived = quantityAgg[0]?.totalCollected || 0;
    const estimatedBeneficiariesServed = (ngo.beneficiaryCount || 50) * completedAllocations;

    return successResponse(res, 'NGO analytics retrieved', {
      analytics: {
        totalAllocations,
        completedAllocations,
        pendingAllocations,
        totalFoodReceived,
        beneficiariesServed: estimatedBeneficiariesServed,
        reliabilityScore: ngo.reliabilityScore || 80,
        capacityUtilization: ngo.maximumCapacity > 0 ? Math.round(((ngo.maximumCapacity - ngo.availableCapacity) / ngo.maximumCapacity) * 100) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
