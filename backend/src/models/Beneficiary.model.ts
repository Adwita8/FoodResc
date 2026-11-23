import mongoose, { Schema, Document } from 'mongoose';

export interface IBeneficiary extends Document {
  userId: mongoose.Types.ObjectId;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country: string;
  };
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  householdSize: number;
  dietaryRestrictions: string[];
  totalRequestsMade: number;
  totalFoodReceived: number; // portions/kg
  createdAt: Date;
  updatedAt: Date;
}

const beneficiarySchema = new Schema<IBeneficiary>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' },
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [77.5946, 12.9716] },
    },
    householdSize: { type: Number, default: 4 },
    dietaryRestrictions: [{ type: String }],
    totalRequestsMade: { type: Number, default: 0 },
    totalFoodReceived: { type: Number, default: 0 },
  },
  { timestamps: true }
);

beneficiarySchema.index({ location: '2dsphere' });

export const Beneficiary = mongoose.model<IBeneficiary>('Beneficiary', beneficiarySchema);
