import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { UserRole, AccountStatus } from '../types';
import { User } from '../models/User.model';

export interface AuthUserPayload {
  userId: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export const authenticateUser = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new UnauthorizedError('Authentication token missing or invalid');
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthUserPayload;
    req.user = decoded;

    // Verify account status
    const user = await User.findById(decoded.userId).select('accountStatus');
    if (!user) {
      throw new UnauthorizedError('User account not found');
    }
    if (user.accountStatus === AccountStatus.SUSPENDED) {
      throw new ForbiddenError('Account is suspended. Please contact administrator.');
    }
    if (user.accountStatus === AccountStatus.DEACTIVATED) {
      throw new ForbiddenError('Account has been deactivated.');
    }

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Access token has expired', 'TOKEN_EXPIRED'));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Invalid access token', 'TOKEN_INVALID'));
    }
    next(error);
  }
};

export const authorizeRole = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('User is not authenticated'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Access forbidden: requires role [${roles.join(', ')}]`));
    }
    next();
  };
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthUserPayload;
      req.user = decoded;
    }
  } catch {}
  next();
};
