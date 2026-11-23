import { Router } from 'express';
import { EmergencyRequest } from '../../models/EmergencyRequest.model';
import { authenticateUser, authorizeRole } from '../../middleware/auth';
import { successResponse } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';
import { UserRole } from '../../types';

const router = Router();

// GET /api/emergency
router.get('/', async (_req, res, next) => {
  try {
    const requests = await EmergencyRequest.find({ status: 'ACTIVE' }).sort({ urgencyLevel: -1, createdAt: -1 });
    return successResponse(res, 'Active emergency food requests retrieved', { requests });
  } catch (error) {
    next(error);
  }
});

// POST /api/emergency
router.post('/', authenticateUser, authorizeRole(UserRole.ADMIN, UserRole.NGO), async (req, res, next) => {
  try {
    const { title, description, latitude, longitude, requiredCategory, requiredQuantity, quantityUnit, beneficiaryCount, urgencyLevel, deliveryDeadline, contactName, contactPhone, contactEmail } = req.body;

    const request = await EmergencyRequest.create({
      createdBy: req.user!.userId,
      title,
      description,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      requiredCategory,
      requiredQuantity,
      quantityUnit: quantityUnit || 'KILOGRAMS',
      beneficiaryCount,
      urgencyLevel: urgencyLevel || 'CRITICAL',
      deliveryDeadline: new Date(deliveryDeadline),
      contactName,
      contactPhone,
      contactEmail,
    });

    return successResponse(res, 'Emergency request broadcasted successfully', { request }, 201);
  } catch (error) {
    next(error);
  }
});

export default router;
