import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { Pickup } from '../../models/Pickup.model';
import { Allocation } from '../../models/Allocation.model';
import { Donation } from '../../models/Donation.model';
import { Donor } from '../../models/Donor.model';
import { NGO } from '../../models/NGO.model';
import { Volunteer } from '../../models/Volunteer.model';
import { Notification } from '../../models/Notification.model';
import { authenticateUser, authorizeRole } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import { successResponse, paginatedResponse } from '../../utils/response';
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from '../../utils/errors';
import { UserRole, DonationStatus } from '../../types';
import { logger } from '../../utils/logger';
import { getIO } from '../../config/socket';

const router = Router();

const MAX_OTP_ATTEMPTS = 5;
const OTP_EXPIRY_MINUTES = 30;

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashOTP(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

// GET /api/pickups - List pickups
router.get('/', authenticateUser, async (req, res, next) => {
  try {
    const { page = '1', limit = '20', status } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, parseInt(limit as string));

    const filter: any = {};

    if (req.user!.role === UserRole.DONOR) {
      const donor = await Donor.findOne({ userId: req.user!.userId });
      if (donor) filter.donorId = donor._id;
    } else if (req.user!.role === UserRole.NGO) {
      const ngo = await NGO.findOne({ userId: req.user!.userId });
      if (ngo) filter.ngoId = ngo._id;
    } else if (req.user!.role === UserRole.VOLUNTEER) {
      const volunteer = await Volunteer.findOne({ userId: req.user!.userId });
      if (volunteer) filter.volunteerId = volunteer._id;
    }

    if (status) {
      filter.pickupStatus = { $in: (status as string).split(',') };
    }

    const [pickups, total] = await Promise.all([
      Pickup.find(filter)
        .populate({
          path: 'donationId',
          select: 'foodName category images totalQuantity quantityUnit pickupAddress',
        })
        .populate('donorId', 'businessName address contactPhone')
        .populate('ngoId', 'organizationName address contactPerson')
        .populate({
          path: 'volunteerId',
          populate: { path: 'userId', select: 'name phone' },
        })
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Pickup.countDocuments(filter),
    ]);

    // Strip OTP hashes from response
    const sanitizedPickups = pickups.map((p: any) => {
      const { pickupOTP, ...rest } = p;
      return rest;
    });

    return paginatedResponse(res, 'Pickups retrieved', sanitizedPickups, {
      page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/pickups/assign - Assign volunteer to a pickup
router.post('/assign', authenticateUser, authorizeRole(UserRole.NGO, UserRole.ADMIN), async (req, res, next) => {
  try {
    const { allocationId, volunteerId } = req.body;
    if (!allocationId) throw new ValidationError('Allocation ID is required');

    const allocation = await Allocation.findById(allocationId);
    if (!allocation) throw new NotFoundError('Allocation not found');

    // Ownership check for NGO
    if (req.user!.role === UserRole.NGO) {
      const ngo = await NGO.findOne({ userId: req.user!.userId });
      if (!ngo || allocation.ngoId.toString() !== ngo._id.toString()) {
        throw new ForbiddenError('Not authorized for this allocation');
      }
    }

    const donation = await Donation.findById(allocation.donationId)
      .populate('donorId', 'businessName address location contactPhone userId');
    if (!donation) throw new NotFoundError('Donation not found');

    const ngo = await NGO.findOne({ _id: allocation.ngoId });
    if (!ngo) throw new NotFoundError('NGO not found');

    // Check for existing pickup
    let pickup = await Pickup.findOne({ allocationId: allocation._id });

    // Generate OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    if (!pickup) {
      pickup = await Pickup.create({
        allocationId: allocation._id,
        donationId: donation._id,
        donorId: donation.donorId,
        ngoId: ngo._id,
        volunteerId: volunteerId || undefined,
        pickupLocation: donation.location,
        deliveryLocation: ngo.location,
        scheduledTime: new Date(),
        pickupDeadline: donation.pickupDeadline,
        pickupOTP: otpHash,
        pickupOTPExpiry: otpExpiry,
        pickupOTPAttempts: 0,
        pickupStatus: volunteerId ? 'ASSIGNED' : 'PENDING',
      });
    } else {
      if (volunteerId) {
        pickup.volunteerId = volunteerId;
        pickup.pickupStatus = 'ASSIGNED';
      }
      pickup.pickupOTP = otpHash;
      pickup.pickupOTPExpiry = otpExpiry;
      pickup.pickupOTPAttempts = 0;
      await pickup.save();
    }

    // Update allocation status
    allocation.status = 'ACCEPTED';
    await allocation.save();

    // Notify donor with OTP (in production, send via SMS/email)
    const donorUserId = (donation.donorId as any)?.userId;
    if (donorUserId) {
      await Notification.create({
        userId: donorUserId,
        title: 'Pickup Scheduled',
        message: `A pickup has been scheduled for "${donation.foodName}". Your verification OTP is: ${otp}. Share this with the volunteer upon collection.`,
        type: 'PICKUP_SCHEDULED',
        relatedEntityType: 'Pickup',
        relatedEntityId: pickup._id,
        channel: 'IN_APP',
      });

      try {
        const io = getIO();
        io.to(`user:${donorUserId}`).emit('pickup:scheduled', {
          pickupId: pickup._id,
          donationId: donation._id,
          otp: otp, // Only in development - in production send via SMS
        });
      } catch {}
    }

    // Notify volunteer if assigned
    if (volunteerId) {
      const volunteer = await Volunteer.findById(volunteerId).populate('userId', '_id');
      if (volunteer?.userId) {
        await Notification.create({
          userId: (volunteer.userId as any)._id,
          title: 'New Pickup Assignment',
          message: `You have been assigned a pickup for "${donation.foodName}" from ${(donation.donorId as any)?.businessName || 'a donor'}.`,
          type: 'VOLUNTEER_ASSIGNED',
          relatedEntityType: 'Pickup',
          relatedEntityId: pickup._id,
          channel: 'IN_APP',
        });
      }
    }

    logger.info('Pickup created/updated', {
      pickupId: pickup._id,
      allocationId: allocation._id,
      volunteerId,
    });

    return successResponse(res, 'Pickup assigned successfully', {
      pickup: { ...pickup.toObject(), pickupOTP: undefined },
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    }, 201);
  } catch (error) {
    next(error);
  }
});

// POST /api/pickups/:id/accept - Volunteer accepts pickup
router.post('/:id/accept', authenticateUser, authorizeRole(UserRole.VOLUNTEER), async (req, res, next) => {
  try {
    const volunteer = await Volunteer.findOne({ userId: req.user!.userId });
    if (!volunteer) throw new NotFoundError('Volunteer profile not found');

    const pickup = await Pickup.findById(req.params.id);
    if (!pickup) throw new NotFoundError('Pickup not found');

    if (pickup.volunteerId && pickup.volunteerId.toString() !== volunteer._id.toString()) {
      throw new ForbiddenError('This pickup is assigned to another volunteer');
    }

    pickup.volunteerId = volunteer._id;
    pickup.pickupStatus = 'ACCEPTED';
    await pickup.save();

    return successResponse(res, 'Pickup accepted');
  } catch (error) {
    next(error);
  }
});

// POST /api/pickups/:id/en-route - Volunteer is en route
router.post('/:id/en-route', authenticateUser, authorizeRole(UserRole.VOLUNTEER), async (req, res, next) => {
  try {
    const pickup = await Pickup.findById(req.params.id);
    if (!pickup) throw new NotFoundError('Pickup not found');

    const volunteer = await Volunteer.findOne({ userId: req.user!.userId });
    if (!volunteer || pickup.volunteerId?.toString() !== volunteer._id.toString()) {
      throw new ForbiddenError('Not authorized for this pickup');
    }

    pickup.pickupStatus = 'EN_ROUTE';
    await pickup.save();

    return successResponse(res, 'Status updated to en route');
  } catch (error) {
    next(error);
  }
});

// POST /api/pickups/:id/verify-otp - Verify OTP for pickup
router.post('/:id/verify-otp', authenticateUser, authorizeRole(UserRole.VOLUNTEER, UserRole.NGO), async (req, res, next) => {
  try {
    const { otp } = req.body;
    if (!otp) throw new ValidationError('OTP is required');

    const pickup = await Pickup.findById(req.params.id);
    if (!pickup) throw new NotFoundError('Pickup not found');

    // Check OTP attempts
    if (pickup.pickupOTPAttempts >= MAX_OTP_ATTEMPTS) {
      throw new ConflictError('Maximum OTP verification attempts exceeded. Please contact admin.');
    }

    // Check OTP expiry
    if (pickup.pickupOTPExpiry && pickup.pickupOTPExpiry < new Date()) {
      throw new ConflictError('OTP has expired. Please request a new one.');
    }

    // Verify OTP
    const otpHash = hashOTP(otp);
    if (otpHash !== pickup.pickupOTP) {
      pickup.pickupOTPAttempts += 1;
      await pickup.save();
      throw new ValidationError(`Invalid OTP. ${MAX_OTP_ATTEMPTS - pickup.pickupOTPAttempts} attempts remaining.`);
    }

    // OTP verified - mark as picked up
    pickup.pickupStatus = 'PICKED_UP';
    pickup.collectedAt = new Date();
    await pickup.save();

    // Update allocation
    await Allocation.updateOne(
      { _id: pickup.allocationId },
      { status: 'PICKED_UP' }
    );

    // Update donation status
    const donation = await Donation.findById(pickup.donationId);
    if (donation) {
      // Check if all allocations for this donation are picked up
      const pendingAllocations = await Allocation.countDocuments({
        donationId: donation._id,
        status: { $in: ['PENDING', 'ACCEPTED'] },
      });

      if (pendingAllocations === 0) {
        donation.status = DonationStatus.PICKED_UP;
        donation.statusHistory.push({
          status: DonationStatus.PICKED_UP,
          timestamp: new Date(),
          note: 'All allocations picked up',
        });
        await donation.save();
      }
    }

    // Notify relevant parties
    try {
      const io = getIO();
      if (pickup.donorId) {
        const donor = await Donor.findById(pickup.donorId).populate('userId', '_id');
        if (donor?.userId) {
          io.to(`user:${(donor.userId as any)._id}`).emit('pickup:collected', {
            pickupId: pickup._id,
          });
        }
      }
    } catch {}

    return successResponse(res, 'OTP verified. Food collected successfully.');
  } catch (error) {
    next(error);
  }
});

// POST /api/pickups/:id/collected - Mark as collected (with photo proof)
router.post('/:id/collected', authenticateUser, authorizeRole(UserRole.VOLUNTEER, UserRole.NGO), async (req, res, next) => {
  try {
    const { proofImages } = req.body;

    const pickup = await Pickup.findById(req.params.id);
    if (!pickup) throw new NotFoundError('Pickup not found');

    if (pickup.pickupStatus !== 'PICKED_UP') {
      throw new ConflictError('OTP must be verified before marking as collected');
    }

    pickup.pickupStatus = 'IN_TRANSIT';
    if (proofImages) {
      pickup.pickupProofImages = proofImages;
    }
    await pickup.save();

    return successResponse(res, 'Pickup marked as in transit');
  } catch (error) {
    next(error);
  }
});

// POST /api/pickups/:id/delivered - Mark delivery as completed
router.post('/:id/delivered', authenticateUser, authorizeRole(UserRole.NGO, UserRole.VOLUNTEER), async (req, res, next) => {
  try {
    const { proofImages } = req.body;

    const pickup = await Pickup.findById(req.params.id);
    if (!pickup) throw new NotFoundError('Pickup not found');

    if (!['PICKED_UP', 'IN_TRANSIT'].includes(pickup.pickupStatus)) {
      throw new ConflictError('Food must be collected before marking as delivered');
    }

    // Verify NGO authorization
    if (req.user!.role === UserRole.NGO) {
      const ngo = await NGO.findOne({ userId: req.user!.userId });
      if (!ngo || pickup.ngoId.toString() !== ngo._id.toString()) {
        throw new ForbiddenError('Not authorized to confirm this delivery');
      }
    }

    pickup.pickupStatus = 'DELIVERED';
    pickup.deliveredAt = new Date();
    if (proofImages) {
      pickup.deliveryProofImages = proofImages;
    }
    await pickup.save();

    // Update allocation
    await Allocation.updateOne(
      { _id: pickup.allocationId },
      { status: 'COMPLETED', completedAt: new Date() }
    );

    // Update donation
    const donation = await Donation.findById(pickup.donationId);
    if (donation) {
      const allAllocations = await Allocation.find({ donationId: donation._id });
      const allCompleted = allAllocations.every(a => ['COMPLETED', 'CANCELLED', 'FAILED'].includes(a.status));

      if (allCompleted && allAllocations.some(a => a.status === 'COMPLETED')) {
        donation.status = DonationStatus.COMPLETED;
        donation.statusHistory.push({
          status: DonationStatus.COMPLETED,
          timestamp: new Date(),
          note: 'All allocations delivered and confirmed',
        });
        await donation.save();

        // Update donor stats
        await Donor.updateOne(
          { _id: donation.donorId },
          {
            $inc: {
              successfulDonationCount: 1,
              totalFoodDonated: donation.totalQuantity,
            },
          }
        );
      }
    }

    // Update NGO stats
    const ngo = await NGO.findById(pickup.ngoId);
    if (ngo) {
      await NGO.updateOne(
        { _id: ngo._id },
        { $inc: { successfulPickups: 1 } }
      );
    }

    // Update volunteer stats
    if (pickup.volunteerId) {
      await Volunteer.updateOne(
        { _id: pickup.volunteerId },
        {
          $inc: {
            totalDeliveries: 1,
            totalFoodTransported: (donation?.totalQuantity || 0),
          },
        }
      );
    }

    // Emit completion event
    try {
      const io = getIO();
      io.to('admin').emit('pickup:delivered', {
        pickupId: pickup._id,
        donationId: donation?._id,
      });
    } catch {}

    return successResponse(res, 'Delivery confirmed. Donation completed!');
  } catch (error) {
    next(error);
  }
});

// POST /api/pickups/:id/fail - Mark pickup as failed
router.post('/:id/fail', authenticateUser, authorizeRole(UserRole.VOLUNTEER, UserRole.ADMIN), async (req, res, next) => {
  try {
    const { reason } = req.body;

    const pickup = await Pickup.findById(req.params.id);
    if (!pickup) throw new NotFoundError('Pickup not found');

    pickup.pickupStatus = 'FAILED';
    pickup.failureReason = reason || 'Pickup failed';
    await pickup.save();

    // Update allocation
    await Allocation.updateOne(
      { _id: pickup.allocationId },
      {
        status: 'FAILED',
        cancelledAt: new Date(),
        cancellationReason: reason || 'Pickup failed',
      }
    );

    // Restore donation quantity for re-allocation
    const donation = await Donation.findById(pickup.donationId);
    if (donation) {
      const allocation = await Allocation.findById(pickup.allocationId);
      if (allocation) {
        donation.availableQuantity += allocation.allocatedQuantity;
        donation.allocatedQuantity -= allocation.allocatedQuantity;
        if (donation.availableQuantity > 0 && donation.safeConsumptionDeadline > new Date()) {
          donation.status = donation.allocatedQuantity > 0 ? DonationStatus.PARTIALLY_ALLOCATED : DonationStatus.AVAILABLE;
        }
        donation.statusHistory.push({
          status: donation.status,
          timestamp: new Date(),
          note: `Pickup failed: ${reason || 'Unknown reason'}. Quantity restored.`,
        });
        await donation.save();
      }
    }

    // Update NGO stats
    await NGO.updateOne(
      { _id: pickup.ngoId },
      { $inc: { cancelledPickups: 1 } }
    );

    // Notify admin
    await Notification.create({
      userId: null,
      title: 'Pickup Failed',
      message: `Pickup for donation "${donation?.foodName}" has failed. Reason: ${reason || 'Unknown'}`,
      type: 'PICKUP_FAILED',
      relatedEntityType: 'Pickup',
      relatedEntityId: pickup._id,
      channel: 'IN_APP',
    });

    return successResponse(res, 'Pickup marked as failed');
  } catch (error) {
    next(error);
  }
});

export default router;
