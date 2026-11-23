import { Donation } from '../models/Donation.model';
import { AllocationOffer } from '../models/AllocationOffer.model';
import { Pickup } from '../models/Pickup.model';
import { Notification } from '../models/Notification.model';
import { DonationStatus } from '../types';
import { logger } from '../utils/logger';
import { handleOfferTimeout } from '../modules/allocations/allocation.engine';
import { getIO } from '../config/socket';

/**
 * Idempotent background job for monitoring expirations and deadlines.
 */
export async function runExpiryMonitor(): Promise<void> {
  const now = new Date();

  try {
    // 1. Mark donations past safeConsumptionDeadline as EXPIRED
    const expiredDonations = await Donation.find({
      status: {
        $in: [
          DonationStatus.AVAILABLE,
          DonationStatus.OFFERED,
          DonationStatus.PARTIALLY_ALLOCATED,
          DonationStatus.PENDING_VERIFICATION,
        ],
      },
      safeConsumptionDeadline: { $lte: now },
    });

    for (const donation of expiredDonations) {
      donation.status = DonationStatus.EXPIRED;
      donation.statusHistory.push({
        status: DonationStatus.EXPIRED,
        timestamp: now,
        note: 'Automatic expiration triggered by safe consumption deadline reached',
      });
      await donation.save();

      // Invalidate outstanding offers
      await AllocationOffer.updateMany(
        { donationId: donation._id, status: 'PENDING' },
        { status: 'EXPIRED' }
      );

      // Create notification for donor
      await Notification.create({
        userId: (donation.donorId as any)?.userId || donation.donorId,
        title: 'Donation Expired',
        message: `Your donation "${donation.foodName}" has passed its safe consumption deadline and has been marked as expired to protect community safety.`,
        type: 'DONATION_EXPIRED',
        relatedEntityType: 'Donation',
        relatedEntityId: donation._id,
      });

      try {
        const io = getIO();
        io.to('admin').emit('donation:expired', { donationId: donation._id, foodName: donation.foodName });
      } catch {}
    }

    if (expiredDonations.length > 0) {
      logger.info(`Expired ${expiredDonations.length} overdue donations.`);
    }

    // 2. Timeout expired allocation offers and cascade to next NGO
    const expiredOffers = await AllocationOffer.find({
      status: 'PENDING',
      expiresAt: { $lte: now },
    });

    for (const offer of expiredOffers) {
      try {
        await handleOfferTimeout(offer._id.toString());
      } catch (err: any) {
        logger.error(`Failed to timeout offer ${offer._id}:`, { error: err.message });
      }
    }

    // 3. Check for overdue pickups approaching deadline
    const urgentPickups = await Pickup.find({
      pickupStatus: { $in: ['PENDING', 'ASSIGNED', 'ACCEPTED'] },
      pickupDeadline: {
        $gt: now,
        $lte: new Date(now.getTime() + 60 * 60 * 1000), // Within next 60 minutes
      },
    }).populate('donationId', 'foodName');

    for (const pickup of urgentPickups) {
      // Check if we already alerted recently (idempotency guard)
      const existingAlert = await Notification.findOne({
        relatedEntityId: pickup._id,
        type: 'DEADLINE_WARNING',
        createdAt: { $gte: new Date(now.getTime() - 30 * 60 * 1000) },
      });

      if (!existingAlert) {
        await Notification.create({
          userId: pickup.volunteerId || (pickup.ngoId as any),
          title: 'Upcoming Pickup Deadline',
          message: `Pickup for ${(pickup.donationId as any)?.foodName || 'donation'} is scheduled within the hour. Please prepare for collection.`,
          type: 'DEADLINE_WARNING',
          relatedEntityType: 'Pickup',
          relatedEntityId: pickup._id,
        });
      }
    }
  } catch (error: any) {
    logger.error('Error during runExpiryMonitor background job:', { error: error.message });
  }
}

/**
 * Start recurring background interval for development & standalone instances
 */
export function startExpiryMonitorCron(intervalMs: number = 60000): NodeJS.Timeout {
  logger.info('Starting background expiry monitor service (interval: 60s)...');
  // Run once immediately
  runExpiryMonitor().catch(() => {});
  return setInterval(() => {
    runExpiryMonitor().catch(() => {});
  }, intervalMs);
}
