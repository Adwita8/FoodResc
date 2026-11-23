import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { setupSocket } from './config/socket';
import { logger } from './utils/logger';
import { startAllocationWorker } from './queues/allocation.queue';
import { startExpiryMonitorCron } from './jobs/expiryMonitor';

async function bootstrap() {
  try {
    logger.info('Initializing FoodRescue Backend Services...');

    // 1. Connect MongoDB
    await connectDatabase();

    // 2. Build express app and HTTP server
    const app = createApp();
    const server = http.createServer(app);

    // 3. Initialize Socket.IO
    setupSocket(server);

    // 4. Start BullMQ background worker
    startAllocationWorker();

    // 5. Start background cron for expiry and deadline monitoring
    startExpiryMonitorCron(60000);

    // 6. Listen
    server.listen(env.PORT, () => {
      logger.info(`===============================================`);
      logger.info(`  FoodRescue API is online on PORT: ${env.PORT}  `);
      logger.info(`  Environment: ${env.NODE_ENV}                  `);
      logger.info(`  Health Check: http://localhost:${env.PORT}/api/health `);
      logger.info(`===============================================`);
    });

    // Graceful shutdown signals
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        await disconnectDatabase();
        process.exit(0);
      });

      // Force exit if shutdown hangs
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error: any) {
    logger.error('Failed to start server:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

bootstrap();
