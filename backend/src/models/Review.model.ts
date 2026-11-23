import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  reviewerId: mongoose.Types.ObjectId;
  reviewedUserId: mongoose.Types.ObjectId;
  donationId: mongoose.Types.ObjectId;
  allocationId?: mongoose.Types.ObjectId;
  rating: number; // 1-5
  comment?: string;
  createdAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reviewedUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    donationId: { type: Schema.Types.ObjectId, ref: 'Donation', required: true, index: true },
    allocationId: { type: Schema.Types.ObjectId, ref: 'Allocation', index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 1000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Prevent duplicate review per user per donation
reviewSchema.index({ reviewerId: 1, donationId: 1 }, { unique: true });

export const Review = mongoose.model<IReview>('Review', reviewSchema);
