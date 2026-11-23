import mongoose, { Schema, Document } from 'mongoose';
import { DonorType, VerificationStatus } from '../types';

export interface IDonor extends Document {
  userId: mongoose.Types.ObjectId;
  businessName: string;
  donorType: DonorType;
  description?: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country: string;
  };
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  contactPhone?: string;
  website?: string;
  verificationStatus: VerificationStatus;
  verificationDocuments: Array<{
    url: string;
    type: string;
    uploadedAt: Date;
  }>;
  verificationNotes?: string;
  verifiedAt?: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  acceptedDonationCount: number;
  successfulDonationCount: number;
  cancellationCount: number;
  totalFoodDonated: number; // in kg
  reliabilityScore: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
}

const donorSchema = new Schema<IDonor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    businessName: { type: String, required: true, trim: true },
    donorType: {
      type: String,
      enum: Object.values(DonorType),
      default: DonorType.INDIVIDUAL,
      index: true,
    },
    description: { type: String, maxlength: 1000 },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' },
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [77.5946, 12.9716] }, // default Bangalore
    },
    contactPhone: String,
    website: String,
    verificationStatus: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.NOT_SUBMITTED,
      index: true,
    },
    verificationDocuments: [
      {
        url: { type: String, required: true },
        type: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    verificationNotes: String,
    verifiedAt: Date,
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    acceptedDonationCount: { type: Number, default: 0 },
    successfulDonationCount: { type: Number, default: 0 },
    cancellationCount: { type: Number, default: 0 },
    totalFoodDonated: { type: Number, default: 0 },
    reliabilityScore: { type: Number, default: 75, min: 0, max: 100 },
  },
  { timestamps: true }
);

donorSchema.index({ location: '2dsphere' });

export const Donor = mongoose.model<IDonor>('Donor', donorSchema);
