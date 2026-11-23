import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Donation } from '../../models/Donation.model';
import { Donor } from '../../models/Donor.model';
import { NGO } from '../../models/NGO.model';
import { AllocationOffer } from '../../models/AllocationOffer.model';
import { Allocation } from '../../models/Allocation.model';
import { authenticateUser, authorizeRole } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/response';
import { AppError, NotFoundError, ForbiddenError, ValidationError, ConflictError } from '../../utils/errors';
import { UserRole, DonationStatus, FoodCategory, QuantityUnit, Allergen } from '../../types';
import { logger } from '../../utils/logger';
import { allocationQueue } from '../../queues/allocation.queue';
import { getIO } from '../../config/socket';

const router = Router();

// ============ SCHEMAS ============

const createDonationSchema = z.object({
  body: z.object({
    foodName: z.string().min(2).max(200),
    description: z.string().max(1000).optional(),
    category: z.nativeEnum(FoodCategory),
    images: z.array(z.string().url()).max(5).optional(),
    totalQuantity: z.number().positive(),
    quantityUnit: z.nativeEnum(QuantityUnit),
    numberOfPortions: z.number().int().positive().optional(),
    preparationTime: z.string().datetime().or(z.string()),
    safeConsumptionDeadline: z.string().datetime().or(z.string()),
    pickupDeadline: z.string().datetime().or(z.string()),
    storageRequirements: z.string().max(500).optional(),
    temperatureRequirements: z.string().max(200).optional(),
    allergens: z.array(z.nativeEnum(Allergen)).optional(),
    packagingCondition: z.string().max(200).optional(),
    pickupAddress: z.string().min(5).max(500),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    pickupSlots: z.array(z.object({
      date: z.string(),
      startTime: z.string(),
      endTime: z.string(),
    })).min(1).optional(),
    specialInstructions: z.string().max(500).optional(),
    isEmergency: z.boolean().optional(),
    emergencyRequestId: z.string().optional(),
  }),
});

const updateDonationSchema = z.object({
  body: z.object({
    foodName: z.string().min(2).max(200).optional(),
    description: z.string().max(1000).optional(),
    category: z.nativeEnum(FoodCategory).optional(),
    images: z.array(z.string().url()).max(5).optional(),
    totalQuantity: z.number().positive().optional(),
    quantityUnit: z.nativeEnum(QuantityUnit).optional(),
    numberOfPortions: z.number().int().positive().optional(),
    storageRequirements: z.string().max(500).optional(),
    temperatureRequirements: z.string().max(200).optional(),
    allergens: z.array(z.nativeEnum(Allergen)).optional(),
    packagingCondition: z.string().max(200).optional(),
    pickupAddress: z.string().min(5).max(500).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    pickupSlots: z.array(z.object({
      date: z.string(),
      startTime: z.string(),
      endTime: z.string(),
    })).optional(),
    specialInstructions: z.string().max(500).optional(),
  }),
});

const claimDonationSchema = z.object({
  body: z.object({
    requestedQuantity: z.number().positive(),
  }),
});

// ============ ROUTES ============

// POST /api/donations - Create a new donation
router.post('/',
  authenticateUser,
  authorizeRole(UserRole.DONOR),
  validateRequest(createDonationSchema),
  async (req, res, next) => {
    try {
      const donor = await Donor.findOne({ userId: req.user!.userId });
      if (!donor) {
        throw new NotFoundError('Donor profile not found');
      }

      if (donor.verificationStatus !== 'APPROVED') {
        throw new ForbiddenError('Your donor profile must be verified before creating donations');
      }

      const {
        foodName, description, category, images, totalQuantity, quantityUnit,
        numberOfPortions, preparationTime, safeConsumptionDeadline, pickupDeadline,
        storageRequirements, temperatureRequirements, allergens, packagingCondition,
        pickupAddress, latitude, longitude, pickupSlots, specialInstructions,
        isEmergency, emergencyRequestId,
      } = req.body;

      // Validate deadlines
      const now = new Date();
      const safeDeadline = new Date(safeConsumptionDeadline);
      const pickupDl = new Date(pickupDeadline);
      const prepTime = new Date(preparationTime);

      if (safeDeadline <= now) {
        throw new ValidationError('Safe consumption deadline must be in the future');
      }

      if (pickupDl <= now) {
        throw new ValidationError('Pickup deadline must be in the future');
      }

      if (pickupDl >= safeDeadline) {
        throw new ValidationError('Pickup deadline must be before safe consumption deadline to allow transportation time');
      }

      if (prepTime > now) {
        throw new ValidationError('Preparation time cannot be in the future');
      }

      const donation = await Donation.create({
        donorId: donor._id,
        foodName,
        description,
        category,
        images: images || [],
        totalQuantity,
        availableQuantity: totalQuantity,
        allocatedQuantity: 0,
        quantityUnit,
        numberOfPortions,
        preparationTime: prepTime,
        safeConsumptionDeadline: safeDeadline,
        pickupDeadline: pickupDl,
        storageRequirements,
        temperatureRequirements,
        allergens: allergens || [],
        packagingCondition,
        pickupAddress,
        location: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        pickupSlots: pickupSlots || [],
        specialInstructions,
        status: DonationStatus.AVAILABLE,
        statusHistory: [{
          status: DonationStatus.AVAILABLE,
          timestamp: now,
          note: 'Donation created and published',
        }],
        isEmergency: isEmergency || false,
        emergencyRequestId,
      });

      // Update donor stats
      await Donor.updateOne(
        { _id: donor._id },
        { $inc: { acceptedDonationCount: 1 } }
      );

      // Trigger allocation engine via BullMQ
      try {
        await allocationQueue.add('match-donation', {
          donationId: donation._id.toString(),
        }, {
          delay: 2000, // Small delay to allow DB replication
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        });
      } catch (queueError) {
        logger.warn('Failed to queue allocation job, will retry', { error: queueError });
      }

      // Emit real-time event
      try {
        const io = getIO();
        io.to('admin').emit('donation:created', {
          donationId: donation._id,
          foodName: donation.foodName,
          category: donation.category,
          quantity: donation.totalQuantity,
          unit: donation.quantityUnit,
        });
      } catch {}

      return successResponse(res, 'Donation created successfully', { donation }, 201);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/donations - List donations with filters
router.get('/', authenticateUser, async (req, res, next) => {
  try {
    const {
      page = '1',
      limit = '20',
      status,
      category,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      minQuantity,
      maxQuantity,
      donorId,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));

    const filter: any = {};

    // Role-based filtering
    if (req.user!.role === UserRole.DONOR) {
      const donor = await Donor.findOne({ userId: req.user!.userId });
      if (donor) filter.donorId = donor._id;
    }

    if (status) {
      const statuses = (status as string).split(',');
      filter.status = { $in: statuses };
    }

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { foodName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (minQuantity) {
      filter.availableQuantity = { ...filter.availableQuantity, $gte: parseFloat(minQuantity as string) };
    }

    if (maxQuantity) {
      filter.availableQuantity = { ...filter.availableQuantity, $lte: parseFloat(maxQuantity as string) };
    }

    if (donorId && req.user!.role === UserRole.ADMIN) {
      filter.donorId = donorId;
    }

    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const [donations, total] = await Promise.all([
      Donation.find(filter)
        .populate('donorId', 'businessName donorType address location')
        .sort(sort)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Donation.countDocuments(filter),
    ]);

    return paginatedResponse(res, 'Donations retrieved', donations, {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/donations/nearby - Get nearby donations for NGOs
router.get('/nearby', authenticateUser, authorizeRole(UserRole.NGO, UserRole.BENEFICIARY), async (req, res, next) => {
  try {
    const {
      latitude,
      longitude,
      maxDistance = '10000', // 10km default
      category,
      page = '1',
      limit = '20',
    } = req.query;

    let lat: number, lng: number;

    if (latitude && longitude) {
      lat = parseFloat(latitude as string);
      lng = parseFloat(longitude as string);
    } else {
      // Get user's location from profile
      let profile: any;
      if (req.user!.role === UserRole.NGO) {
        profile = await NGO.findOne({ userId: req.user!.userId });
      } else {
        profile = await Beneficiary.findOne({ userId: req.user!.userId });
      }

      if (!profile?.location?.coordinates) {
        throw new ValidationError('Location is required. Please set your location in your profile.');
      }

      lng = profile.location.coordinates[0];
      lat = profile.location.coordinates[1];
    }

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));

    const filter: any = {
      status: { $in: [DonationStatus.AVAILABLE, DonationStatus.PARTIALLY_ALLOCATED] },
      safeConsumptionDeadline: { $gt: new Date() },
      pickupDeadline: { $gt: new Date() },
      availableQuantity: { $gt: 0 },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: parseInt(maxDistance as string),
        },
      },
    };

    if (category) {
      filter.category = category;
    }

    const [donations, total] = await Promise.all([
      Donation.find(filter)
        .populate('donorId', 'businessName donorType address location reliabilityScore')
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Donation.countDocuments({
        ...filter,
        location: undefined, // Can't use $near in countDocuments
        'location.coordinates': { $exists: true },
      }).catch(() => 0),
    ]);

    // Calculate distance for each donation
    const donationsWithDistance = donations.map((d: any) => {
      const donationLng = d.location?.coordinates?.[0];
      const donationLat = d.location?.coordinates?.[1];
      let distance = null;

      if (donationLat && donationLng) {
        // Haversine formula for straight-line distance
        const R = 6371e3; // Earth's radius in meters
        const phi1 = (lat * Math.PI) / 180;
        const phi2 = (donationLat * Math.PI) / 180;
        const deltaPhi = ((donationLat - lat) * Math.PI) / 180;
        const deltaLambda = ((donationLng - lng) * Math.PI) / 180;

        const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
          Math.cos(phi1) * Math.cos(phi2) *
          Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distance = R * c;
      }

      return { ...d, distance };
    });

    return paginatedResponse(res, 'Nearby donations retrieved', donationsWithDistance, {
      page: pageNum,
      limit: limitNum,
      total: donations.length,
      pages: 1,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/donations/:id - Get donation details
router.get('/:id', authenticateUser, async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donorId', 'businessName donorType address location contactPhone reliabilityScore userId')
      .lean();

    if (!donation) {
      throw new NotFoundError('Donation not found');
    }

    // Get allocations for this donation
    const allocations = await Allocation.find({ donationId: donation._id })
      .populate('ngoId', 'organizationName address location')
      .lean();

    // Get active offers
    const offers = await AllocationOffer.find({
      donationId: donation._id,
      status: 'PENDING',
    })
      .populate('ngoId', 'organizationName')
      .lean();

    return successResponse(res, 'Donation details retrieved', {
      donation,
      allocations,
      activeOffers: offers,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/donations/:id - Update donation
router.put('/:id',
  authenticateUser,
  authorizeRole(UserRole.DONOR),
  validateRequest(updateDonationSchema),
  async (req, res, next) => {
    try {
      const donor = await Donor.findOne({ userId: req.user!.userId });
      if (!donor) throw new NotFoundError('Donor profile not found');

      const donation = await Donation.findById(req.params.id);
      if (!donation) throw new NotFoundError('Donation not found');

      // Ownership check
      if (donation.donorId.toString() !== donor._id.toString()) {
        throw new ForbiddenError('You can only edit your own donations');
      }

      // Can only edit DRAFT or AVAILABLE donations with no allocations
      if (![DonationStatus.DRAFT, DonationStatus.AVAILABLE].includes(donation.status as DonationStatus)) {
        throw new ConflictError('Cannot edit a donation that has already been claimed or allocated');
      }

      if (donation.allocatedQuantity > 0) {
        throw new ConflictError('Cannot edit a donation that has active allocations');
      }

      const updates = { ...req.body };
      if (updates.latitude !== undefined && updates.longitude !== undefined) {
        updates.location = {
          type: 'Point',
          coordinates: [updates.longitude, updates.latitude],
        };
        delete updates.latitude;
        delete updates.longitude;
      }

      if (updates.totalQuantity) {
        updates.availableQuantity = updates.totalQuantity;
      }

      const updatedDonation = await Donation.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true, runValidators: true }
      );

      return successResponse(res, 'Donation updated successfully', { donation: updatedDonation });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/donations/:id - Cancel donation
router.delete('/:id',
  authenticateUser,
  authorizeRole(UserRole.DONOR, UserRole.ADMIN),
  async (req, res, next) => {
    try {
      let donorFilter: any = {};
      if (req.user!.role === UserRole.DONOR) {
        const donor = await Donor.findOne({ userId: req.user!.userId });
        if (!donor) throw new NotFoundError('Donor profile not found');
        donorFilter.donorId = donor._id;
      }

      const donation = await Donation.findOne({ _id: req.params.id, ...donorFilter });
      if (!donation) throw new NotFoundError('Donation not found');

      // Cannot cancel completed or already expired donations
      if ([DonationStatus.COMPLETED, DonationStatus.EXPIRED, DonationStatus.DELIVERED].includes(donation.status as DonationStatus)) {
        throw new ConflictError(`Cannot cancel a ${donation.status} donation`);
      }

      // Cancel all pending offers
      await AllocationOffer.updateMany(
        { donationId: donation._id, status: 'PENDING' },
        { status: 'CANCELLED' }
      );

      // Cancel pending allocations
      await Allocation.updateMany(
        { donationId: donation._id, status: { $in: ['PENDING', 'ACCEPTED'] } },
        {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: 'Donation cancelled by donor',
        }
      );

      donation.status = DonationStatus.CANCELLED;
      donation.statusHistory.push({
        status: DonationStatus.CANCELLED,
        timestamp: new Date(),
        note: `Cancelled by ${req.user!.role.toLowerCase()}`,
      });
      await donation.save();

      // Update donor stats
      if (req.user!.role === UserRole.DONOR) {
        await Donor.updateOne(
          { userId: req.user!.userId },
          { $inc: { cancellationCount: 1 } }
        );
      }

      return successResponse(res, 'Donation cancelled successfully');
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/donations/:id/claim - NGO claims a donation
router.post('/:id/claim',
  authenticateUser,
  authorizeRole(UserRole.NGO),
  validateRequest(claimDonationSchema),
  async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { requestedQuantity } = req.body;

      const ngo = await NGO.findOne({ userId: req.user!.userId }).session(session);
      if (!ngo) {
        throw new NotFoundError('NGO profile not found');
      }

      if (ngo.verificationStatus !== 'APPROVED') {
        throw new ForbiddenError('Your NGO must be verified before claiming donations');
      }

      // Lock the donation document for atomic update
      const donation = await Donation.findById(req.params.id).session(session);
      if (!donation) {
        throw new NotFoundError('Donation not found');
      }

      // Eligibility checks
      if (![DonationStatus.AVAILABLE, DonationStatus.PARTIALLY_ALLOCATED].includes(donation.status as DonationStatus)) {
        throw new ConflictError('This donation is no longer available for claiming');
      }

      if (donation.availableQuantity <= 0) {
        throw new ConflictError('No quantity available for this donation');
      }

      if (requestedQuantity > donation.availableQuantity) {
        throw new ValidationError(`Only ${donation.availableQuantity} ${donation.quantityUnit} available`);
      }

      // Check deadlines
      const now = new Date();
      if (donation.safeConsumptionDeadline <= now) {
        throw new ConflictError('This donation has passed its safe consumption deadline');
      }

      if (donation.pickupDeadline <= now) {
        throw new ConflictError('This donation has passed its pickup deadline');
      }

      // Check food category compatibility
      if (ngo.acceptedFoodCategories.length > 0 && !ngo.acceptedFoodCategories.includes(donation.category)) {
        throw new ValidationError('Your NGO does not accept this food category');
      }

      // Check capacity
      if (ngo.availableCapacity < requestedQuantity && ngo.maximumCapacity > 0) {
        throw new ValidationError('Requested quantity exceeds your available capacity');
      }

      // Check for existing active allocation for this NGO and donation
      const existingAllocation = await Allocation.findOne({
        donationId: donation._id,
        ngoId: ngo._id,
        status: { $in: ['PENDING', 'ACCEPTED', 'PICKED_UP'] },
      }).session(session);

      if (existingAllocation) {
        throw new ConflictError('You already have an active claim on this donation');
      }

      // Create allocation atomically
      const allocation = new Allocation({
        donationId: donation._id,
        ngoId: ngo._id,
        allocatedQuantity: requestedQuantity,
        allocationScore: 0, // Manual claim
        status: 'ACCEPTED',
        acceptedAt: now,
        pickupDeadline: donation.pickupDeadline,
      });
      await allocation.save({ session });

      // Update donation quantities atomically
      donation.allocatedQuantity += requestedQuantity;
      donation.availableQuantity -= requestedQuantity;

      if (donation.availableQuantity <= 0) {
        donation.status = DonationStatus.FULLY_ALLOCATED;
      } else {
        donation.status = DonationStatus.PARTIALLY_ALLOCATED;
      }

      donation.statusHistory.push({
        status: donation.status,
        timestamp: now,
        note: `${requestedQuantity} ${donation.quantityUnit} claimed by ${ngo.organizationName}`,
      });

      await donation.save({ session });

      // Update NGO capacity
      if (ngo.maximumCapacity > 0) {
        ngo.availableCapacity = Math.max(0, ngo.availableCapacity - requestedQuantity);
        await ngo.save({ session });
      }

      await session.commitTransaction();

      // Emit real-time events (outside transaction)
      try {
        const io = getIO();
        const donor = await Donor.findById(donation.donorId).populate('userId', '_id');
        if (donor) {
          io.to(`user:${(donor.userId as any)._id}`).emit('donation:claimed', {
            donationId: donation._id,
            ngoName: ngo.organizationName,
            quantity: requestedQuantity,
            unit: donation.quantityUnit,
          });
        }
      } catch {}

      return successResponse(res, 'Donation claimed successfully', {
        allocation,
        remainingQuantity: donation.availableQuantity,
      }, 201);
    } catch (error) {
      await session.abortTransaction();
      next(error);
    } finally {
      session.endSession();
    }
  }
);

// POST /api/donations/:id/cancel - Cancel a specific donation
router.post('/:id/cancel',
  authenticateUser,
  authorizeRole(UserRole.DONOR, UserRole.ADMIN),
  async (req, res, next) => {
    try {
      // Reuse the DELETE logic
      return router.handle(
        Object.assign(req, { method: 'DELETE' }),
        res,
        next
      );
    } catch (error) {
      next(error);
    }
  }
);

export default router;
