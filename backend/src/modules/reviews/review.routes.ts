import { Router } from 'express';
import { Review } from '../../models/Review.model';
import { authenticateUser } from '../../middleware/auth';
import { successResponse } from '../../utils/response';
import { ConflictError } from '../../utils/errors';

const router = Router();

// GET /api/reviews/user/:userId
router.get('/user/:userId', async (req, res, next) => {
  try {
    const reviews = await Review.find({ reviewedUserId: req.params.userId })
      .populate('reviewerId', 'name profileImage role')
      .sort({ createdAt: -1 });

    return successResponse(res, 'User reviews retrieved', { reviews });
  } catch (error) {
    next(error);
  }
});

// POST /api/reviews
router.post('/', authenticateUser, async (req, res, next) => {
  try {
    const { reviewedUserId, donationId, rating, comment } = req.body;

    const existingReview = await Review.findOne({
      reviewerId: req.user!.userId,
      donationId,
    });
    if (existingReview) {
      throw new ConflictError('You have already submitted a review for this donation transaction');
    }

    const review = await Review.create({
      reviewerId: req.user!.userId,
      reviewedUserId,
      donationId,
      rating,
      comment,
    });

    return successResponse(res, 'Review posted successfully', { review }, 201);
  } catch (error) {
    next(error);
  }
});

export default router;
