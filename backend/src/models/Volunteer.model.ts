import mongoose, { Schema, Document } from 'mongoose';
import { VehicleType, VerificationStatus } from '../types';

export interface IVolunteer extends Document {
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
  profilePhoto?: string;
  vehicleType: VehicleType;
  vehicleCapacity?: number;
  availability: boolean;
  availabilitySchedule?: string;
  verificationDocuments: Array<{
    url: string;
    type: string;
    uploadedAt: Date;
  }>;
  verificationStatus: VerificationStatus;
  totalDeliveries: number;
  totalDistanceTravelled: number; // in km
  totalFoodTransported: number; // in kg
  rating: number; // 0-5
  createdAt: Date;
  updatedAt: Date;
}

const volunteerSchema = new Schema<IVolunteer>(
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
    profilePhoto: String,
    vehicleType: {
      type: String,
      enum: Object.values(VehicleType),
      default: VehicleType.MOTORCYCLE,
    },
    vehicleCapacity: { type: Number, default: 20 },
    availability: { type: Boolean, default: true, index: true },
    availabilitySchedule: String,
    verificationDocuments: [
      {
        url: { type: String, required: true },
        type: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    verificationStatus: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.NOT_SUBMITTED,
    },
    totalDeliveries: { type: Number, default: 0 },
    totalDistanceTravelled: { type: Number, default: 0 },
    totalFoodTransported: { type: Number, default: 0 },
    rating: { type: Number, default: 5.0, min: 1, max: 5 },
  },
  { timestamps: true }
);

volunteerSchema.index({ location: '2dsphere' });

export const Volunteer = mongoose.model<IVolunteer>('Volunteer', volunteerSchema);
