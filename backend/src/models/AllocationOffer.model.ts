import mongoose, { Schema, Document } from 'mongoose';

export interface IAllocationOffer extends Document {
  donationId: mongoose.Types.ObjectId;
  ngoId: mongoose.Types.ObjectId;
  offeredQuantity: number;
  score: number;
  rank: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  expiresAt: Date;
  respondedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
}

const allocationOfferSchema = new Schema<IAllocationOffer>(
  {
    donationId: { type: Schema.Types.ObjectId, ref: 'Donation', required: true, index: true },
    ngoId: { type: Schema.Types.ObjectId, ref: 'NGO', required: true, index: true },
    offeredQuantity: { type: Number, required: true },
    score: { type: Number, default: 0 },
    rank: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    expiresAt: { type: Date, required: true, index: true },
    respondedAt: Date,
    rejectionReason: String,
  },
  { timestamps: true }
);

export const AllocationOffer = mongoose.model<IAllocationOffer>('AllocationOffer', allocationOfferSchema);
