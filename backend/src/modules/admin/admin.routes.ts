import { Router } from 'express';
import { User } from '../../models/User.model';
import { Donor } from '../../models/Donor.model';
import { NGO } from '../../models/NGO.model';
import { Donation } from '../../models/Donation.model';
import { Allocation } from '../../models/Allocation.model';
import { Pickup } from '../../models/Pickup.model';
import { AuditLog } from '../../models/AuditLog.model';
import { authenticateUser, authorizeRole } from '../../middleware/auth';
import { successResponse, paginatedResponse } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';
import { UserRole, AccountStatus, VerificationStatus } from '../../types';

const router = Router();

// Middleware: all admin routes require ADMIN role
router.use(authenticateUser, authorizeRole(UserRole.ADMIN));

// GET /api/admin/users
router.get('/users', async (req, res, next) => {
  try {
    const { page = '1', limit = '20', role, status, search } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, parseInt(limit as string));

    const filter: any = {};
    if (role) filter.role = role;
    if (status) filter.accountStatus = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter),
    ]);

    return paginatedResponse(res, 'Users retrieved', users, {
      page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/donors
router.get('/donors', async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter: any = {};
    if (status) filter.verificationStatus = status;

    const donors = await Donor.find(filter).populate('userId', 'name email phone accountStatus').sort({ createdAt: -1 });
    return successResponse(res, 'Donors list retrieved', { donors });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/ngos
router.get('/ngos', async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter: any = {};
    if (status) filter.verificationStatus = status;

    const ngos = await NGO.find(filter).populate('userId', 'name email phone accountStatus').sort({ createdAt: -1 });
    return successResponse(res, 'NGOs list retrieved', { ngos });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/donors/:id/verify
router.patch('/donors/:id/verify', async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const donor = await Donor.findById(req.params.id);
    if (!donor) throw new NotFoundError('Donor not found');

    donor.verificationStatus = status as VerificationStatus;
    if (notes) donor.verificationNotes = notes;
    if (status === VerificationStatus.APPROVED) {
      donor.verifiedAt = new Date();
      donor.verifiedBy = req.user!.userId as any;
    }
    await donor.save();

    await AuditLog.create({
      userId: req.user!.userId,
      action: `DONOR_VERIFICATION_${status}`,
      entityType: 'Donor',
      entityId: donor._id,
      metadata: { status, notes },
    });

    return successResponse(res, `Donor verification updated to ${status}`, { donor });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/ngos/:id/verify
router.patch('/ngos/:id/verify', async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const ngo = await NGO.findById(req.params.id);
    if (!ngo) throw new NotFoundError('NGO not found');

    ngo.verificationStatus = status as VerificationStatus;
    if (notes) ngo.verificationNotes = notes;
    if (status === VerificationStatus.APPROVED) {
      ngo.verifiedAt = new Date();
      ngo.verifiedBy = req.user!.userId as any;
    }
    await ngo.save();

    await AuditLog.create({
      userId: req.user!.userId,
      action: `NGO_VERIFICATION_${status}`,
      entityType: 'NGO',
      entityId: ngo._id,
      metadata: { status, notes },
    });

    return successResponse(res, `NGO verification updated to ${status}`, { ngo });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/users/:id/suspend
router.patch('/users/:id/suspend', async (req, res, next) => {
  try {
    const { suspend } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) throw new NotFoundError('User not found');

    user.accountStatus = suspend ? AccountStatus.SUSPENDED : AccountStatus.ACTIVE;
    await user.save();

    await AuditLog.create({
      userId: req.user!.userId,
      action: suspend ? 'USER_SUSPENDED' : 'USER_REACTIVATED',
      entityType: 'User',
      entityId: user._id,
    });

    return successResponse(res, `User account ${suspend ? 'suspended' : 'reactivated'}`);
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', async (req, res, next) => {
  try {
    const logs = await AuditLog.find().populate('userId', 'name email role').sort({ timestamp: -1 }).limit(100).lean();
    return successResponse(res, 'Audit logs retrieved', { logs });
  } catch (error) {
    next(error);
  }
});

export default router;
