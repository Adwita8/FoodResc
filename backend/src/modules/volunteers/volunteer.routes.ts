import { Router } from 'express';
import { Volunteer } from '../../models/Volunteer.model';
import { Pickup } from '../../models/Pickup.model';
import { authenticateUser, authorizeRole } from '../../middleware/auth';
import { successResponse, paginatedResponse } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';
import { UserRole } from '../../types';

const router = Router();

// GET /api/volunteers/profile
router.get('/profile', authenticateUser, authorizeRole(UserRole.VOLUNTEER), async (req, res, next) => {
  try {
    const volunteer = await Volunteer.findOne({ userId: req.user!.userId }).populate('userId', 'name email phone profileImage accountStatus');
    if (!volunteer) throw new NotFoundError('Volunteer profile not found');
    return successResponse(res, 'Volunteer profile retrieved', { volunteer });
  } catch (error) {
    next(error);
  }
});

// PUT /api/volunteers/profile
router.put('/profile', authenticateUser, authorizeRole(UserRole.VOLUNTEER), async (req, res, next) => {
  try {
    const { vehicleType, vehicleCapacity, availability, address, latitude, longitude } = req.body;
    const updateData: any = {};
    if (vehicleType) updateData.vehicleType = vehicleType;
    if (vehicleCapacity !== undefined) updateData.vehicleCapacity = vehicleCapacity;
    if (availability !== undefined) updateData.availability = availability;
    if (address) updateData.address = address;
    if (latitude !== undefined && longitude !== undefined) {
      updateData.location = {
        type: 'Point',
        coordinates: [longitude, latitude],
      };
    }

    const volunteer = await Volunteer.findOneAndUpdate(
      { userId: req.user!.userId },
      { $set: updateData },
      { new: true }
    );
    return successResponse(res, 'Volunteer profile updated', { volunteer });
  } catch (error) {
    next(error);
  }
});

// GET /api/volunteers/tasks
router.get('/tasks', authenticateUser, authorizeRole(UserRole.VOLUNTEER), async (req, res, next) => {
  try {
    const volunteer = await Volunteer.findOne({ userId: req.user!.userId });
    if (!volunteer) throw new NotFoundError('Volunteer profile not found');

    const tasks = await Pickup.find({
      $or: [
        { volunteerId: volunteer._id },
        { volunteerId: null, pickupStatus: 'PENDING' },
      ],
    })
      .populate('donationId', 'foodName category images totalQuantity quantityUnit pickupAddress')
      .populate('donorId', 'businessName address contactPhone')
      .populate('ngoId', 'organizationName address contactPerson')
      .sort({ scheduledTime: 1 })
      .lean();

    return successResponse(res, 'Volunteer tasks retrieved', { tasks });
  } catch (error) {
    next(error);
  }
});

export default router;
