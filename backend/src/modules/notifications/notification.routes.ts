import { Router } from 'express';
import { Notification } from '../../models/Notification.model';
import { authenticateUser } from '../../middleware/auth';
import { successResponse, paginatedResponse } from '../../utils/response';

const router = Router();

// GET /api/notifications
router.get('/', authenticateUser, async (req, res, next) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, parseInt(limit as string));

    const filter = {
      $or: [
        { userId: req.user!.userId },
        { userId: null }, // Global/role broadcast
      ],
    };

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, isRead: false }),
    ]);

    return paginatedResponse(res, 'Notifications retrieved', notifications, {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    }, { unreadCount });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticateUser, async (req, res, next) => {
  try {
    await Notification.updateOne(
      { _id: req.params.id },
      { $set: { isRead: true } }
    );
    return successResponse(res, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', authenticateUser, async (req, res, next) => {
  try {
    await Notification.updateMany(
      { $or: [{ userId: req.user!.userId }, { userId: null }] },
      { $set: { isRead: true } }
    );
    return successResponse(res, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
});

export default router;
