import mongoose, { Schema, Document } from 'mongoose';
import { FoodCategory, VerificationStatus } from '../types';

export interface INGO extends Document {
  userId: mongoose.Types.ObjectId;
  organizationName: string;
  registrationNumber?: string;
  description?: string;
  contactPerson?: string;
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
  acceptedFoodCategories: FoodCategory[];
  storageFacilities: string[];
  maximumCapacity: number; // in kg or portions
  availableCapacity: number;
  operatingHours: Array<{
    day: string;
    open: string;
    close: string;
  }>;
  transportationAvailability: boolean;
  transportationDetails?: string;
  beneficiaryCount: number;
  verificationStatus: VerificationStatus;
  verificationDocuments: Array<{
    url: string;
    type: string;
    uploadedAt: Date;
  }>;
  verificationNotes?: string;
  verifiedAt?: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  successfulPickups: number;
  cancelledPickups: number;
  missedDeadlines: number;
  reliabilityScore: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
}

const ngoSchema = new Schema<INGO>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    organizationName: { type: String, required: true, trim: true },
    registrationNumber: { type: String, trim: true },
    description: { type: String, maxlength: 1000 },
    contactPerson: String,
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
    acceptedFoodCategories: [
      {
        type: String,
        enum: Object.values(FoodCategory),
      },
    ],
    storageFacilities: [{ type: String }],
    maximumCapacity: { type: Number, default: 500 },
    availableCapacity: { type: Number, default: 500 },
    operatingHours: [
      {
        day: String,
        open: String,
        close: String,
      },
    ],
    transportationAvailability: { type: Boolean, default: false },
    transportationDetails: String,
    beneficiaryCount: { type: Number, default: 50 },
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
    successfulPickups: { type: Number, default: 0 },
    cancelledPickups: { type: Number, default: 0 },
    missedDeadlines: { type: Number, default: 0 },
    reliabilityScore: { type: Number, default: 80, min: 0, max: 100 },
  },
  { timestamps: true }
);

ngoSchema.index({ location: '2dsphere' });

export const NGO = mongoose.model<INGO>('NGO', ngoSchema);
