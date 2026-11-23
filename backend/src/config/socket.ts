import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from './env';
import { logger } from '../utils/logger';

let io: SocketIOServer | null = null;

interface AuthenticatedSocket extends Socket {
  userId?: string;
  role?: string;
}

export function setupSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
  });

  // Socket authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (token) {
        try {
          const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string; role: string };
          socket.userId = decoded.userId;
          socket.role = decoded.role;
        } catch (tokenErr) {
          logger.warn('Socket connection has expired or invalid token, connecting as guest');
        }
      }
      next();
    } catch (err: any) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`Socket connected: ${socket.id} (User: ${socket.userId || 'Guest'}, Role: ${socket.role || 'None'})`);

    // Join user-specific room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Join role-specific room
    if (socket.role) {
      socket.join(`role:${socket.role.toLowerCase()}`);
      if (socket.role === 'ADMIN') {
        socket.join('admin');
      }
    }

    // Join donation tracking room
    socket.on('join:donation', (donationId: string) => {
      socket.join(`donation:${donationId}`);
    });

    socket.on('leave:donation', (donationId: string) => {
      socket.leave(`donation:${donationId}`);
    });

    // Join pickup tracking room
    socket.on('join:pickup', (pickupId: string) => {
      socket.join(`pickup:${pickupId}`);
    });

    socket.on('leave:pickup', (pickupId: string) => {
      socket.leave(`pickup:${pickupId}`);
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet');
  }
  return io;
}
