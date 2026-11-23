import mongoose, { Schema, Document } from 'mongoose';

export interface IAllocation extends Document {
  donationId: mongoose.Types.ObjectId;
  ngoId: mongoose.Types.ObjectId;
  allocatedQuantity: number;
  allocationScore: number;
  status: 'PENDING' | 'ACCEPTED' | 'PICKED_UP' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  acceptedAt?: Date;
  pickupDeadline: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const allocationSchema = new Schema<IAllocation>(
  {
    donationId: { type: Schema.Types.ObjectId, ref: 'Donation', required: true, index: true },
    ngoId: { type: Schema.Types.ObjectId, ref: 'NGO', required: true, index: true },
    allocatedQuantity: { type: Number, required: true },
    allocationScore: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'PICKED_UP', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    acceptedAt: Date,
    pickupDeadline: { type: Date, required: true },
    completedAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
  },
  { timestamps: true }
);

export const Allocation = mongoose.model<IAllocation>('Allocation', allocationSchema);
