import { Queue, Worker, Job } from 'bullmq';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { runAllocationForDonation } from '../modules/allocations/allocation.engine';

const redisConnection = {
  url: env.REDIS_URL,
  maxRetriesPerRequest: null,
};

let queueInstance: any = null;

// Graceful queue wrapper
export const allocationQueue = {
  add: async (name: string, data: any, opts?: any) => {
    try {
      if (!queueInstance) {
        queueInstance = new Queue('allocation-queue', {
          connection: redisConnection,
          defaultJobOptions: {
            removeOnComplete: 100,
            removeOnFail: 50,
          },
        });
      }
      return await queueInstance.add(name, data, opts);
    } catch (err: any) {
      logger.warn(`BullMQ queue offline or error, executing job in-process: ${name}`, { error: err.message });
      // In-process fallback execution
      if (name === 'match-donation' && data?.donationId) {
        setTimeout(async () => {
          try {
            await runAllocationForDonation(data.donationId);
          } catch (e: any) {
            logger.error('Error in in-process fallback allocation', { error: e.message });
          }
        }, 1000);
      }
      return null;
    }
  },
};

export function startAllocationWorker(): Worker | null {
  try {
    const worker = new Worker(
      'allocation-queue',
      async (job: Job) => {
        logger.info(`Processing BullMQ job: ${job.name} (#${job.id})`);
        if (job.name === 'match-donation') {
          await runAllocationForDonation(job.data.donationId);
        }
      },
      { connection: redisConnection, concurrency: 5 }
    );

    worker.on('completed', (job) => {
      logger.info(`BullMQ job completed: ${job.name} (#${job.id})`);
    });

    worker.on('failed', (job, err) => {
      logger.error(`BullMQ job failed: ${job?.name} (#${job?.id})`, { error: err.message });
    });

    return worker;
  } catch (err: any) {
    logger.warn('Could not start BullMQ worker, falling back to in-memory jobs', { error: err.message });
    return null;
  }
}
