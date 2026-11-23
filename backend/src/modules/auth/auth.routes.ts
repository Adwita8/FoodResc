import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../../models/User.model';
import { Donor } from '../../models/Donor.model';
import { NGO } from '../../models/NGO.model';
import { Volunteer } from '../../models/Volunteer.model';
import { Beneficiary } from '../../models/Beneficiary.model';
import { authenticateUser } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import { authLimiter } from '../../middleware/rateLimiter';
import { successResponse, errorResponse } from '../../utils/response';
import { AppError, UnauthorizedError, ConflictError, ValidationError } from '../../utils/errors';
import { env } from '../../config/env';
import { UserRole, AccountStatus } from '../../types';
import { logger } from '../../utils/logger';

const router = Router();

// ============ SCHEMAS ============

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Phone must be at least 10 digits').max(15).optional(),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain an uppercase letter')
      .regex(/[a-z]/, 'Password must contain a lowercase letter')
      .regex(/[0-9]/, 'Password must contain a number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain a special character'),
    role: z.enum(['DONOR', 'NGO', 'VOLUNTEER', 'BENEFICIARY']),
    // Donor-specific fields
    businessName: z.string().optional(),
    donorType: z.enum(['RESTAURANT', 'HOTEL', 'SUPERMARKET', 'GROCERY', 'BAKERY', 'CATERING', 'INDIVIDUAL']).optional(),
    // NGO-specific fields
    organizationName: z.string().optional(),
    registrationNumber: z.string().optional(),
    // Location fields
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pincode: z.string().optional(),
      country: z.string().default('India'),
    }).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string(),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain uppercase')
      .regex(/[a-z]/, 'Must contain lowercase')
      .regex(/[0-9]/, 'Must contain number'),
  }),
});

// ============ HELPERS ============

function generateAccessToken(userId: string, role: string): string {
  return jwt.sign(
    { userId, role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRY || '15m' }
  );
}

function generateRefreshToken(userId: string, role: string): string {
  return jwt.sign(
    { userId, role },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRY || '7d' }
  );
}

function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// ============ ROUTES ============

// POST /api/auth/register
router.post('/register', authLimiter, validateRequest(registerSchema), async (req, res, next) => {
  try {
    const { name, email, phone, password, role, businessName, donorType, organizationName, registrationNumber, address, latitude, longitude } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ConflictError('An account with this email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate email verification token
    const emailVerificationToken = generateVerificationToken();
    const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role,
      accountStatus: AccountStatus.ACTIVE,
      isEmailVerified: false, // In dev, we'll auto-verify
      emailVerificationToken: crypto.createHash('sha256').update(emailVerificationToken).digest('hex'),
      emailVerificationExpiry,
    });

    // Create role-specific profile
    const locationData = latitude && longitude ? {
      type: 'Point' as const,
      coordinates: [longitude, latitude] as [number, number],
    } : undefined;

    if (role === UserRole.DONOR) {
      await Donor.create({
        userId: user._id,
        businessName: businessName || name,
        donorType: donorType || 'INDIVIDUAL',
        address: address || {},
        location: locationData,
        verificationStatus: env.NODE_ENV === 'development' ? 'APPROVED' : 'NOT_SUBMITTED',
        reliabilityScore: 85,
      });
    } else if (role === UserRole.NGO) {
      await NGO.create({
        userId: user._id,
        organizationName: organizationName || name,
        registrationNumber: registrationNumber || '',
        address: address || {},
        location: locationData,
        acceptedFoodCategories: [],
        storageFacilities: [],
        maximumCapacity: 500,
        availableCapacity: 500,
        operatingHours: [],
        transportationAvailability: false,
        verificationStatus: env.NODE_ENV === 'development' ? 'APPROVED' : 'NOT_SUBMITTED',
        reliabilityScore: 85,
      });
    } else if (role === UserRole.VOLUNTEER) {
      await Volunteer.create({
        userId: user._id,
        address: address || {},
        location: locationData,
        vehicleType: 'BICYCLE',
        availability: true,
        verificationStatus: 'NOT_SUBMITTED',
      });
    } else if (role === UserRole.BENEFICIARY) {
      await Beneficiary.create({
        userId: user._id,
        address: address || {},
        location: locationData,
      });
    }

    // In development, auto-verify email
    if (env.NODE_ENV === 'development') {
      user.isEmailVerified = true;
      await user.save();
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString(), user.role);

    // Store hashed refresh token
    const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    user.refreshTokens = [hashedRefreshToken];
    await user.save();

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth',
    });

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profileImage: user.profileImage,
      isEmailVerified: user.isEmailVerified,
      accountStatus: user.accountStatus,
    };

    return successResponse(res, 'Registration successful', {
      user: userResponse,
      accessToken,
    }, 201);
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, validateRequest(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check account status
    if (user.accountStatus === AccountStatus.SUSPENDED) {
      throw new UnauthorizedError('Your account has been suspended. Please contact support.');
    }

    if (user.accountStatus === AccountStatus.DEACTIVATED) {
      throw new UnauthorizedError('Your account has been deactivated.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString(), user.role);

    // Store hashed refresh token (keep last 5 sessions)
    const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    if (!user.refreshTokens) user.refreshTokens = [];
    user.refreshTokens = [...user.refreshTokens.slice(-4), hashedRefreshToken];
    user.lastLogin = new Date();
    await user.save();

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });

    // Get role-specific profile
    let profile = null;
    if (user.role === UserRole.DONOR) {
      profile = await Donor.findOne({ userId: user._id });
    } else if (user.role === UserRole.NGO) {
      profile = await NGO.findOne({ userId: user._id });
    } else if (user.role === UserRole.VOLUNTEER) {
      profile = await Volunteer.findOne({ userId: user._id });
    } else if (user.role === UserRole.BENEFICIARY) {
      profile = await Beneficiary.findOne({ userId: user._id });
    }

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profileImage: user.profileImage,
      isEmailVerified: user.isEmailVerified,
      accountStatus: user.accountStatus,
      profile,
    };

    return successResponse(res, 'Login successful', {
      user: userResponse,
      accessToken,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateUser, async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    
    if (refreshToken) {
      const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await User.updateOne(
        { _id: req.user!.userId },
        { $pull: { refreshTokens: hashedToken } }
      );
    }

    res.clearCookie('refreshToken', { path: '/api/auth' });
    return successResponse(res, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token not provided');
    }

    // Verify refresh token
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Find user and verify token exists
    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const user = await User.findOne({
      _id: decoded.userId,
      refreshTokens: hashedToken,
    });

    if (!user) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (user.accountStatus !== AccountStatus.ACTIVE) {
      throw new UnauthorizedError('Account is not active');
    }

    // Rotate tokens
    const newAccessToken = generateAccessToken(user._id.toString(), user.role);
    const newRefreshToken = generateRefreshToken(user._id.toString(), user.role);

    // Replace old refresh token with new one
    const newHashedToken = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    user.refreshTokens = user.refreshTokens.filter((t: string) => t !== hashedToken);
    user.refreshTokens.push(newHashedToken);
    await user.save();

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });

    return successResponse(res, 'Token refreshed', {
      accessToken: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      throw new ValidationError('Verification token is required');
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: { $gt: new Date() },
    });

    if (!user) {
      throw new ValidationError('Invalid or expired verification token');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save();

    return successResponse(res, 'Email verified successfully');
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, validateRequest(forgotPasswordSchema), async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user) {
      return successResponse(res, 'If an account exists with this email, a password reset link has been sent');
    }

    const resetToken = generateVerificationToken();
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // TODO: Send email with reset link (requires SMTP config)
    // In development, log the token
    if (env.NODE_ENV === 'development') {
      logger.info(`Password reset token for ${email}: ${resetToken}`);
    }

    return successResponse(res, 'If an account exists with this email, a password reset link has been sent');
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', validateRequest(resetPasswordSchema), async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiry: { $gt: new Date() },
    });

    if (!user) {
      throw new ValidationError('Invalid or expired reset token');
    }

    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(password, salt);
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    user.refreshTokens = []; // Invalidate all sessions
    await user.save();

    return successResponse(res, 'Password reset successful. Please login with your new password.');
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', authenticateUser, async (req, res, next) => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Get role-specific profile
    let profile = null;
    if (user.role === UserRole.DONOR) {
      profile = await Donor.findOne({ userId: user._id });
    } else if (user.role === UserRole.NGO) {
      profile = await NGO.findOne({ userId: user._id });
    } else if (user.role === UserRole.VOLUNTEER) {
      profile = await Volunteer.findOne({ userId: user._id });
    } else if (user.role === UserRole.BENEFICIARY) {
      profile = await Beneficiary.findOne({ userId: user._id });
    }

    return successResponse(res, 'User profile retrieved', {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
        isEmailVerified: user.isEmailVerified,
        accountStatus: user.accountStatus,
        createdAt: user.createdAt,
      },
      profile,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
