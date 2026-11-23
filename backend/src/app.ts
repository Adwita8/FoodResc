import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import path from 'path';

import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';

// Route modules
import authRoutes from './modules/auth/auth.routes';
import donationRoutes from './modules/donations/donation.routes';
import allocationRoutes from './modules/allocations/allocation.routes';
import pickupRoutes from './modules/pickups/pickup.routes';
import donorRoutes from './modules/donors/donor.routes';
import ngoRoutes from './modules/ngos/ngo.routes';
import volunteerRoutes from './modules/volunteers/volunteer.routes';
import beneficiaryRoutes from './modules/beneficiaries/beneficiary.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import adminRoutes from './modules/admin/admin.routes';
import emergencyRoutes from './modules/emergency/emergency.routes';
import reviewRoutes from './modules/reviews/review.routes';

export function createApp(): Application {
  const app = express();

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: false, // Allows cross-origin asset loading in dev
    crossOriginEmbedderPolicy: false,
  }));

  // CORS configuration
  app.use(cors({
    origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }));

  // Body parsing and performance
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser(env.COOKIE_SECRET));
  app.use(compression());

  // Static uploads directory
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  // Global rate limiter
  app.use('/api', generalLimiter);

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'FoodRescue API Monolith',
      environment: env.NODE_ENV,
    });
  });

  // Mount API modules
  app.use('/api/auth', authRoutes);
  app.use('/api/donations', donationRoutes);
  app.use('/api/allocations', allocationRoutes);
  app.use('/api/pickups', pickupRoutes);
  app.use('/api/donors', donorRoutes);
  app.use('/api/ngos', ngoRoutes);
  app.use('/api/volunteers', volunteerRoutes);
  app.use('/api/beneficiaries', beneficiaryRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/emergency', emergencyRoutes);
  app.use('/api/reviews', reviewRoutes);

  // 404 handler
  app.use('*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: `API Route not found: ${req.method} ${req.originalUrl}`,
      errorCode: 'ROUTE_NOT_FOUND',
    });
  });

  // Centralized Error handler
  app.use(errorHandler);

  return app;
}
