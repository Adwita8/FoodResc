import mongoose, { Schema, Document } from 'mongoose';
import { PickupStatus } from '../types';

export interface IPickup extends Document {
  allocationId: mongoose.Types.ObjectId;
  donationId: mongoose.Types.ObjectId;
  donorId: mongoose.Types.ObjectId;
  ngoId: mongoose.Types.ObjectId;
  volunteerId?: mongoose.Types.ObjectId;
  pickupLocation: {
    type: 'Point';
    coordinates: [number, number];
  };
  deliveryLocation: {
    type: 'Point';
    coordinates: [number, number];
  };
  scheduledTime: Date;
  pickupDeadline: Date;
  pickupOTP: string; // sha256 hashed
  pickupOTPExpiry?: Date;
  pickupOTPAttempts: number;
  pickupStatus: PickupStatus;
  pickupProofImages: string[];
  deliveryProofImages: string[];
  collectedAt?: Date;
  deliveredAt?: Date;
  failureReason?: string;
  estimatedDistance?: number;
  estimatedDuration?: number;
  actualDistance?: number;
  createdAt: Date;
  updatedAt: Date;
}

const pickupSchema = new Schema<IPickup>(
  {
    allocationId: { type: Schema.Types.ObjectId, ref: 'Allocation', required: true, index: true },
    donationId: { type: Schema.Types.ObjectId, ref: 'Donation', required: true, index: true },
    donorId: { type: Schema.Types.ObjectId, ref: 'Donor', required: true, index: true },
    ngoId: { type: Schema.Types.ObjectId, ref: 'NGO', required: true, index: true },
    volunteerId: { type: Schema.Types.ObjectId, ref: 'Volunteer', index: true },
    pickupLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    deliveryLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    scheduledTime: { type: Date, required: true },
    pickupDeadline: { type: Date, required: true },
    pickupOTP: { type: String, required: true, select: false },
    pickupOTPExpiry: Date,
    pickupOTPAttempts: { type: Number, default: 0 },
    pickupStatus: {
      type: String,
      enum: Object.values(PickupStatus),
      default: PickupStatus.PENDING,
      index: true,
    },
    pickupProofImages: [{ type: String }],
    deliveryProofImages: [{ type: String }],
    collectedAt: Date,
    deliveredAt: Date,
    failureReason: String,
    estimatedDistance: Number,
    estimatedDuration: Number,
    actualDistance: Number,
  },
  { timestamps: true }
);

pickupSchema.index({ pickupLocation: '2dsphere' });
pickupSchema.index({ deliveryLocation: '2dsphere' });

export const Pickup = mongoose.model<IPickup>('Pickup', pickupSchema);
