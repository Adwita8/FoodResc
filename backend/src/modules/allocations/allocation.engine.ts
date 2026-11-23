/**
 * FoodRescue - Rule-Based Intelligent Allocation Engine
 * 
 * This is the core business logic for matching donations with NGOs.
 * Uses a deterministic, weighted scoring algorithm - NO AI/ML.
 * 
 * SCORING FORMULA:
 * Final Score = 0.30 × Capacity + 0.25 × Urgency + 0.20 × Transportation + 0.15 × Distance + 0.10 × Reliability
 * All components normalized 0-100.
 */

import mongoose from 'mongoose';
import { Donation } from '../../models/Donation.model';
import { NGO } from '../../models/NGO.model';
import { AllocationOffer } from '../../models/AllocationOffer.model';
import { Allocation } from '../../models/Allocation.model';
import { Notification } from '../../models/Notification.model';
import { DonationStatus, FoodCategory } from '../../types';
import { logger } from '../../utils/logger';
import { getIO } from '../../config/socket';

// Weights for the scoring formula
const WEIGHTS = {
  CAPACITY: 0.30,
  URGENCY: 0.25,
  TRANSPORTATION: 0.20,
  DISTANCE: 0.15,
  RELIABILITY: 0.10,
};

// Configuration
const CONFIG = {
  MAX_SEARCH_RADIUS_METERS: 50000, // 50km
  OFFER_EXPIRY_MINUTES: 30,
  MIN_SAFETY_BUFFER_MINUTES: 60, // Minimum time between pickup and safe consumption deadline
  MAX_ELIGIBLE_NGOS: 20, // Max NGOs to score per donation
  AVERAGE_SPEED_KMH: 30, // Assumed average transport speed for time estimation
};

interface EligibleNGO {
  ngo: any;
  distance: number; // meters
  estimatedTravelMinutes: number;
  capacityScore: number;
  urgencyScore: number;
  transportationScore: number;
  distanceScore: number;
  reliabilityScore: number;
  finalScore: number;
}

/**
 * Calculate straight-line distance using the Haversine formula.
 * Returns distance in meters.
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Estimate travel time in minutes based on distance.
 * Uses straight-line distance with a 1.4x road factor.
 */
function estimateTravelMinutes(distanceMeters: number): number {
  const roadFactor = 1.4; // Roads are typically ~1.4x straight-line distance
  const roadDistanceKm = (distanceMeters * roadFactor) / 1000;
  return (roadDistanceKm / CONFIG.AVERAGE_SPEED_KMH) * 60;
}

/**
 * STEP 1: Eligibility Filtering
 * Returns NGOs that meet all hard requirements for this donation.
 */
async function findEligibleNGOs(donation: any): Promise<any[]> {
  const now = new Date();
  const donationLng = donation.location.coordinates[0];
  const donationLat = donation.location.coordinates[1];

  // Find nearby verified NGOs with geospatial query
  const nearbyNGOs = await NGO.find({
    verificationStatus: 'APPROVED',
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [donationLng, donationLat],
        },
        $maxDistance: CONFIG.MAX_SEARCH_RADIUS_METERS,
      },
    },
  })
    .populate('userId', 'accountStatus')
    .limit(CONFIG.MAX_ELIGIBLE_NGOS * 2) // Get extra to filter
    .lean();

  const eligibleNGOs: any[] = [];

  for (const ngo of nearbyNGOs) {
    // 1. Account must be active
    if ((ngo.userId as any)?.accountStatus !== 'ACTIVE') continue;

    // 2. Must accept the food category (or accept all if empty array)
    if (ngo.acceptedFoodCategories.length > 0 &&
      !ngo.acceptedFoodCategories.includes(donation.category)) {
      continue;
    }

    // 3. Must have sufficient remaining capacity
    if (ngo.maximumCapacity > 0 && ngo.availableCapacity < 1) {
      continue;
    }

    // 4. Check storage requirements compatibility
    if (donation.storageRequirements) {
      const requiresColdStorage = donation.storageRequirements.toLowerCase().includes('refrigerat') ||
        donation.storageRequirements.toLowerCase().includes('cold') ||
        donation.storageRequirements.toLowerCase().includes('frozen');
      if (requiresColdStorage && ngo.storageFacilities.length > 0) {
        const hasColdStorage = ngo.storageFacilities.some((f: string) =>
          f.toLowerCase().includes('refrigerat') ||
          f.toLowerCase().includes('cold') ||
          f.toLowerCase().includes('freezer')
        );
        if (!hasColdStorage) continue;
      }
    }

    // 5. Calculate distance and travel time
    const ngoLng = ngo.location?.coordinates?.[0];
    const ngoLat = ngo.location?.coordinates?.[1];
    if (!ngoLng || !ngoLat) continue;

    const distance = haversineDistance(donationLat, donationLng, ngoLat, ngoLng);
    const travelMinutes = estimateTravelMinutes(distance);

    // 6. Must be able to collect before pickup deadline
    const minutesToPickupDeadline = (new Date(donation.pickupDeadline).getTime() - now.getTime()) / 60000;
    if (travelMinutes > minutesToPickupDeadline) continue;

    // 7. Food must reach destination before safe consumption deadline
    const minutesToSafeDeadline = (new Date(donation.safeConsumptionDeadline).getTime() - now.getTime()) / 60000;
    if (travelMinutes + CONFIG.MIN_SAFETY_BUFFER_MINUTES > minutesToSafeDeadline) continue;

    // 8. Check operating hours (simplified - check if NGO operates today)
    if (ngo.operatingHours && ngo.operatingHours.length > 0) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = dayNames[now.getDay()];
      const todaySchedule = ngo.operatingHours.find((h: any) =>
        h.day?.toLowerCase() === today.toLowerCase()
      );

      if (todaySchedule) {
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

        if (todaySchedule.close && currentTimeStr > todaySchedule.close) continue;
      }
    }

    // 9. Check no duplicate active offers
    const existingOffer = await AllocationOffer.findOne({
      donationId: donation._id,
      ngoId: ngo._id,
      status: { $in: ['PENDING', 'ACCEPTED'] },
    });
    if (existingOffer) continue;

    // 10. Check no active allocation
    const existingAllocation = await Allocation.findOne({
      donationId: donation._id,
      ngoId: ngo._id,
      status: { $in: ['PENDING', 'ACCEPTED', 'PICKED_UP'] },
    });
    if (existingAllocation) continue;

    eligibleNGOs.push({
      ...ngo,
      _distance: distance,
      _travelMinutes: travelMinutes,
    });

    if (eligibleNGOs.length >= CONFIG.MAX_ELIGIBLE_NGOS) break;
  }

  return eligibleNGOs;
}

/**
 * STEP 2: Priority Scoring
 * Calculates a score 0-100 for each eligible NGO.
 */
function scoreNGO(ngo: any, donation: any): EligibleNGO {
  const now = new Date();

  // --- CAPACITY SUITABILITY (0-100) ---
  // Higher score when NGO can accept more of the available quantity
  let capacityScore: number;
  if (ngo.maximumCapacity <= 0) {
    // NGO hasn't set capacity - assume they can handle it
    capacityScore = 70;
  } else {
    const canAcceptRatio = Math.min(ngo.availableCapacity / donation.availableQuantity, 1);
    capacityScore = canAcceptRatio * 100;
  }

  // --- URGENCY SUITABILITY (0-100) ---
  // Higher score for NGOs that can collect food quickly relative to safe consumption deadline
  const minutesToSafeDeadline = (new Date(donation.safeConsumptionDeadline).getTime() - now.getTime()) / 60000;
  const travelMinutes = ngo._travelMinutes;

  if (minutesToSafeDeadline <= 0) {
    // Should never reach here due to eligibility filter
    return createScoredNGO(ngo, 0, 0, 0, 0, 0);
  }

  // Ratio of time needed vs time available (lower is better)
  const timeRatio = travelMinutes / minutesToSafeDeadline;
  let urgencyScore: number;
  if (timeRatio <= 0.2) {
    urgencyScore = 100; // Plenty of time
  } else if (timeRatio <= 0.4) {
    urgencyScore = 85;
  } else if (timeRatio <= 0.6) {
    urgencyScore = 65;
  } else if (timeRatio <= 0.8) {
    urgencyScore = 40;
  } else {
    urgencyScore = 20; // Tight timing
  }

  // --- TRANSPORTATION SUITABILITY (0-100) ---
  let transportationScore: number;
  if (ngo.transportationAvailability) {
    transportationScore = 100; // NGO has own transport
  } else if (ngo._distance < 2000) {
    transportationScore = 70; // Close enough for walking/cycling
  } else if (ngo._distance < 5000) {
    transportationScore = 40; // May need volunteer
  } else {
    transportationScore = 20; // Needs dedicated transport
  }

  // --- DISTANCE SUITABILITY (0-100) ---
  // Inverse relationship - closer is better
  const distanceKm = ngo._distance / 1000;
  let distanceScore: number;
  if (distanceKm <= 1) {
    distanceScore = 100;
  } else if (distanceKm <= 3) {
    distanceScore = 90;
  } else if (distanceKm <= 5) {
    distanceScore = 75;
  } else if (distanceKm <= 10) {
    distanceScore = 60;
  } else if (distanceKm <= 20) {
    distanceScore = 40;
  } else if (distanceKm <= 35) {
    distanceScore = 20;
  } else {
    distanceScore = 10;
  }

  // --- NGO RELIABILITY (0-100) ---
  // Based on historical performance
  const totalPickups = (ngo.successfulPickups || 0) + (ngo.cancelledPickups || 0) + (ngo.missedDeadlines || 0);
  let reliabilityScore: number;
  if (totalPickups === 0) {
    reliabilityScore = 50; // New NGO - neutral score
  } else {
    const successRate = (ngo.successfulPickups || 0) / totalPickups;
    const missedRate = (ngo.missedDeadlines || 0) / totalPickups;
    reliabilityScore = Math.max(0, Math.min(100,
      successRate * 80 + // Up to 80 points for success rate
      (1 - missedRate) * 20 // Up to 20 points for not missing deadlines
    ));
  }

  // Also factor in the stored reliability score
  if (ngo.reliabilityScore !== undefined && ngo.reliabilityScore !== null) {
    reliabilityScore = (reliabilityScore + ngo.reliabilityScore) / 2;
  }

  return createScoredNGO(ngo, capacityScore, urgencyScore, transportationScore, distanceScore, reliabilityScore);
}

function createScoredNGO(
  ngo: any,
  capacityScore: number,
  urgencyScore: number,
  transportationScore: number,
  distanceScore: number,
  reliabilityScore: number
): EligibleNGO {
  const finalScore =
    WEIGHTS.CAPACITY * capacityScore +
    WEIGHTS.URGENCY * urgencyScore +
    WEIGHTS.TRANSPORTATION * transportationScore +
    WEIGHTS.DISTANCE * distanceScore +
    WEIGHTS.RELIABILITY * reliabilityScore;

  return {
    ngo,
    distance: ngo._distance,
    estimatedTravelMinutes: ngo._travelMinutes,
    capacityScore: Math.round(capacityScore * 100) / 100,
    urgencyScore: Math.round(urgencyScore * 100) / 100,
    transportationScore: Math.round(transportationScore * 100) / 100,
    distanceScore: Math.round(distanceScore * 100) / 100,
    reliabilityScore: Math.round(reliabilityScore * 100) / 100,
    finalScore: Math.round(finalScore * 100) / 100,
  };
}

/**
 * Rank NGOs by final score with tiebreakers.
 */
function rankNGOs(scoredNGOs: EligibleNGO[]): EligibleNGO[] {
  return scoredNGOs.sort((a, b) => {
    // Primary: Higher score wins
    if (a.finalScore !== b.finalScore) return b.finalScore - a.finalScore;
    // Tiebreaker 1: Shorter estimated pickup time
    if (a.estimatedTravelMinutes !== b.estimatedTravelMinutes) return a.estimatedTravelMinutes - b.estimatedTravelMinutes;
    // Tiebreaker 2: Higher available capacity
    const aCapacity = a.ngo.availableCapacity || 0;
    const bCapacity = b.ngo.availableCapacity || 0;
    if (aCapacity !== bCapacity) return bCapacity - aCapacity;
    // Tiebreaker 3: Higher reliability
    return b.reliabilityScore - a.reliabilityScore;
  });
}

/**
 * STEP 3: Create offer for the top-ranked NGO.
 */
async function createOffer(donation: any, rankedNGO: EligibleNGO, rank: number): Promise<any> {
  const expiresAt = new Date(Date.now() + CONFIG.OFFER_EXPIRY_MINUTES * 60 * 1000);

  const offer = await AllocationOffer.create({
    donationId: donation._id,
    ngoId: rankedNGO.ngo._id,
    offeredQuantity: donation.availableQuantity,
    score: rankedNGO.finalScore,
    rank,
    status: 'PENDING',
    expiresAt,
  });

  // Create notification for the NGO
  await Notification.create({
    userId: rankedNGO.ngo.userId._id || rankedNGO.ngo.userId,
    title: 'New Donation Offer',
    message: `You have a new food donation offer: ${donation.foodName} (${donation.availableQuantity} ${donation.quantityUnit}). Respond before the offer expires.`,
    type: 'ALLOCATION_OFFER',
    relatedEntityType: 'AllocationOffer',
    relatedEntityId: offer._id,
    channel: 'IN_APP',
  });

  // Emit real-time notification
  try {
    const io = getIO();
    const userId = rankedNGO.ngo.userId._id || rankedNGO.ngo.userId;
    io.to(`user:${userId}`).emit('offer:received', {
      offerId: offer._id,
      donationId: donation._id,
      foodName: donation.foodName,
      quantity: donation.availableQuantity,
      unit: donation.quantityUnit,
      category: donation.category,
      expiresAt,
      score: rankedNGO.finalScore,
    });
  } catch (err) {
    logger.warn('Failed to emit offer notification', { error: err });
  }

  // Update donation status
  if (donation.status === DonationStatus.AVAILABLE) {
    donation.status = DonationStatus.OFFERED;
    donation.statusHistory.push({
      status: DonationStatus.OFFERED,
      timestamp: new Date(),
      note: `Offered to ${rankedNGO.ngo.organizationName} (score: ${rankedNGO.finalScore})`,
    });
    await donation.save();
  }

  logger.info('Allocation offer created', {
    donationId: donation._id,
    ngoId: rankedNGO.ngo._id,
    ngoName: rankedNGO.ngo.organizationName,
    score: rankedNGO.finalScore,
    rank,
    expiresAt,
  });

  return offer;
}

/**
 * Main allocation function - orchestrates the entire matching process.
 * Called by BullMQ job processor.
 */
export async function runAllocationForDonation(donationId: string): Promise<void> {
  logger.info('Starting allocation engine for donation', { donationId });

  const donation = await Donation.findById(donationId);
  if (!donation) {
    logger.warn('Donation not found for allocation', { donationId });
    return;
  }

  // Verify donation is still allocatable
  if (![DonationStatus.AVAILABLE, DonationStatus.PARTIALLY_ALLOCATED, DonationStatus.OFFERED].includes(donation.status as DonationStatus)) {
    logger.info('Donation not in allocatable state', { donationId, status: donation.status });
    return;
  }

  if (donation.availableQuantity <= 0) {
    logger.info('No available quantity for allocation', { donationId });
    return;
  }

  // Check deadlines
  const now = new Date();
  if (donation.safeConsumptionDeadline <= now || donation.pickupDeadline <= now) {
    logger.info('Donation past deadline, skipping allocation', { donationId });
    return;
  }

  // Check if there's already a pending offer
  const existingPendingOffer = await AllocationOffer.findOne({
    donationId: donation._id,
    status: 'PENDING',
    expiresAt: { $gt: now },
  });

  if (existingPendingOffer) {
    logger.info('Active pending offer exists, skipping allocation', { donationId, offerId: existingPendingOffer._id });
    return;
  }

  // STEP 1: Find eligible NGOs
  const eligibleNGOs = await findEligibleNGOs(donation);

  if (eligibleNGOs.length === 0) {
    logger.info('No eligible NGOs found for donation', { donationId });
    
    // Notify admin about unmatched donation
    await Notification.create({
      userId: null, // Will be delivered to admin role
      title: 'Unmatched Donation',
      message: `No eligible NGOs found for donation: ${donation.foodName}. Manual intervention may be required.`,
      type: 'SYSTEM_ALERT',
      relatedEntityType: 'Donation',
      relatedEntityId: donation._id,
      channel: 'IN_APP',
    });

    return;
  }

  // STEP 2: Score all eligible NGOs
  const scoredNGOs = eligibleNGOs.map(ngo => scoreNGO(ngo, donation));

  // STEP 3: Rank by score
  const rankedNGOs = rankNGOs(scoredNGOs);

  logger.info('NGOs ranked for allocation', {
    donationId,
    rankings: rankedNGOs.map((r, i) => ({
      rank: i + 1,
      ngoId: r.ngo._id,
      name: r.ngo.organizationName,
      score: r.finalScore,
      distance: Math.round(r.distance),
    })),
  });

  // STEP 4: Create offer for the highest-ranked NGO
  await createOffer(donation, rankedNGOs[0], 1);
}

/**
 * Handle offer acceptance - called when NGO accepts an allocation offer.
 */
export async function handleOfferAcceptance(offerId: string): Promise<{ allocation: any; donation: any }> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const offer = await AllocationOffer.findById(offerId).session(session);
    if (!offer) throw new Error('Offer not found');

    if (offer.status !== 'PENDING') {
      throw new Error(`Offer is no longer pending (status: ${offer.status})`);
    }

    if (offer.expiresAt < new Date()) {
      offer.status = 'EXPIRED';
      await offer.save({ session });
      throw new Error('Offer has expired');
    }

    // Lock donation for atomic update
    const donation = await Donation.findById(offer.donationId).session(session);
    if (!donation) throw new Error('Donation not found');

    if (donation.availableQuantity <= 0) {
      offer.status = 'CANCELLED';
      await offer.save({ session });
      throw new Error('No quantity available');
    }

    // Determine actual quantity to allocate
    const allocatedQuantity = Math.min(offer.offeredQuantity, donation.availableQuantity);

    // Update offer
    offer.status = 'ACCEPTED';
    offer.respondedAt = new Date();
    await offer.save({ session });

    // Create allocation
    const allocation = new Allocation({
      donationId: donation._id,
      ngoId: offer.ngoId,
      allocatedQuantity,
      allocationScore: offer.score,
      status: 'ACCEPTED',
      acceptedAt: new Date(),
      pickupDeadline: donation.pickupDeadline,
    });
    await allocation.save({ session });

    // Update donation quantities atomically
    donation.allocatedQuantity += allocatedQuantity;
    donation.availableQuantity -= allocatedQuantity;

    if (donation.availableQuantity <= 0) {
      donation.status = DonationStatus.FULLY_ALLOCATED;
    } else {
      donation.status = DonationStatus.PARTIALLY_ALLOCATED;
    }

    donation.statusHistory.push({
      status: donation.status,
      timestamp: new Date(),
      note: `${allocatedQuantity} ${donation.quantityUnit} allocated via offer acceptance`,
    });

    await donation.save({ session });

    // Update NGO capacity
    const ngo = await NGO.findById(offer.ngoId).session(session);
    if (ngo && ngo.maximumCapacity > 0) {
      ngo.availableCapacity = Math.max(0, ngo.availableCapacity - allocatedQuantity);
      await ngo.save({ session });
    }

    await session.commitTransaction();

    // Notify donor (outside transaction)
    try {
      const donor = await Donation.findById(donation._id).populate({
        path: 'donorId',
        populate: { path: 'userId', select: '_id' },
      });
      if (donor?.donorId) {
        const donorUserId = (donor.donorId as any).userId?._id;
        if (donorUserId) {
          await Notification.create({
            userId: donorUserId,
            title: 'Donation Claimed',
            message: `Your donation "${donation.foodName}" has been claimed by ${ngo?.organizationName || 'an NGO'}.`,
            type: 'DONATION_CLAIMED',
            relatedEntityType: 'Donation',
            relatedEntityId: donation._id,
            channel: 'IN_APP',
          });

          try {
            const io = getIO();
            io.to(`user:${donorUserId}`).emit('donation:claimed', {
              donationId: donation._id,
              ngoName: ngo?.organizationName,
              quantity: allocatedQuantity,
            });
          } catch {}
        }
      }
    } catch (notifError) {
      logger.warn('Failed to send claim notification', { error: notifError });
    }

    // If there's remaining quantity, trigger re-allocation
    if (donation.availableQuantity > 0) {
      try {
        const { allocationQueue } = await import('../../queues/allocation.queue');
        await allocationQueue.add('match-donation', {
          donationId: donation._id.toString(),
        }, {
          delay: 5000,
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        });
      } catch {}
    }

    return { allocation, donation };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Handle offer rejection - cascade to next NGO.
 */
export async function handleOfferRejection(offerId: string, reason?: string): Promise<void> {
  const offer = await AllocationOffer.findById(offerId);
  if (!offer) throw new Error('Offer not found');

  if (offer.status !== 'PENDING') return;

  offer.status = 'REJECTED';
  offer.respondedAt = new Date();
  offer.rejectionReason = reason || 'Rejected by NGO';
  await offer.save();

  logger.info('Offer rejected, cascading to next NGO', {
    offerId,
    donationId: offer.donationId,
    ngoId: offer.ngoId,
    reason,
  });

  // Trigger re-allocation for next NGO
  const donation = await Donation.findById(offer.donationId);
  if (donation && donation.availableQuantity > 0 &&
    ![DonationStatus.EXPIRED, DonationStatus.CANCELLED, DonationStatus.COMPLETED].includes(donation.status as DonationStatus)) {

    // Reset to AVAILABLE if was OFFERED and no other pending offers exist
    const otherPendingOffers = await AllocationOffer.countDocuments({
      donationId: donation._id,
      status: 'PENDING',
      _id: { $ne: offer._id },
    });

    if (otherPendingOffers === 0 && donation.status === DonationStatus.OFFERED) {
      donation.status = donation.allocatedQuantity > 0 ? DonationStatus.PARTIALLY_ALLOCATED : DonationStatus.AVAILABLE;
      donation.statusHistory.push({
        status: donation.status,
        timestamp: new Date(),
        note: 'Offer rejected, returning to available',
      });
      await donation.save();
    }

    try {
      const { allocationQueue } = await import('../../queues/allocation.queue');
      await allocationQueue.add('match-donation', {
        donationId: donation._id.toString(),
      }, {
        delay: 2000,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      });
    } catch {}
  }
}

/**
 * Handle offer timeout - expire and cascade.
 */
export async function handleOfferTimeout(offerId: string): Promise<void> {
  const offer = await AllocationOffer.findById(offerId);
  if (!offer || offer.status !== 'PENDING') return;

  if (offer.expiresAt > new Date()) return; // Not yet expired

  offer.status = 'EXPIRED';
  await offer.save();

  logger.info('Offer expired, cascading to next NGO', {
    offerId,
    donationId: offer.donationId,
  });

  // Record this as a missed opportunity for the NGO
  await NGO.updateOne(
    { _id: offer.ngoId },
    { $inc: { missedDeadlines: 1 } }
  );

  // Cascade to next NGO
  await handleOfferRejection(offerId, 'Offer expired - no response');
}

export { CONFIG as ALLOCATION_CONFIG };
