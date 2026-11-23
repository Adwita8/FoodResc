import mongoose, { Schema, Document } from 'mongoose';
import { FoodCategory, QuantityUnit, Allergen, DonationStatus } from '../types';

export interface IDonation extends Document {
  donorId: mongoose.Types.ObjectId;
  foodName: string;
  description?: string;
  category: FoodCategory;
  images: string[];
  totalQuantity: number;
  availableQuantity: number;
  allocatedQuantity: number;
  quantityUnit: QuantityUnit;
  numberOfPortions?: number;
  preparationTime: Date;
  safeConsumptionDeadline: Date;
  pickupDeadline: Date;
  storageRequirements?: string;
  temperatureRequirements?: string;
  allergens: Allergen[];
  packagingCondition?: string;
  pickupAddress: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  pickupSlots: Array<{
    date: string;
    startTime: string;
    endTime: string;
  }>;
  specialInstructions?: string;
  status: DonationStatus;
  statusHistory: Array<{
    status: DonationStatus;
    timestamp: Date;
    note?: string;
  }>;
  isEmergency: boolean;
  emergencyRequestId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const donationSchema = new Schema<IDonation>(
  {
    donorId: { type: Schema.Types.ObjectId, ref: 'Donor', required: true, index: true },
    foodName: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, maxlength: 1000 },
    category: {
      type: String,
      enum: Object.values(FoodCategory),
      required: true,
      index: true,
    },
    images: [{ type: String }],
    totalQuantity: { type: Number, required: true, min: 0 },
    availableQuantity: { type: Number, required: true, min: 0 },
    allocatedQuantity: { type: Number, default: 0, min: 0 },
    quantityUnit: {
      type: String,
      enum: Object.values(QuantityUnit),
      required: true,
    },
    numberOfPortions: { type: Number },
    preparationTime: { type: Date, required: true },
    safeConsumptionDeadline: { type: Date, required: true, index: true },
    pickupDeadline: { type: Date, required: true, index: true },
    storageRequirements: String,
    temperatureRequirements: String,
    allergens: [
      {
        type: String,
        enum: Object.values(Allergen),
      },
    ],
    packagingCondition: String,
    pickupAddress: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
    pickupSlots: [
      {
        date: String,
        startTime: String,
        endTime: String,
      },
    ],
    specialInstructions: String,
    status: {
      type: String,
      enum: Object.values(DonationStatus),
      default: DonationStatus.AVAILABLE,
      index: true,
    },
    statusHistory: [
      {
        status: { type: String, enum: Object.values(DonationStatus) },
        timestamp: { type: Date, default: Date.now },
        note: String,
      },
    ],
    isEmergency: { type: Boolean, default: false },
    emergencyRequestId: { type: Schema.Types.ObjectId, ref: 'EmergencyRequest' },
  },
  { timestamps: true }
);

// Indexes
donationSchema.index({ location: '2dsphere' });
donationSchema.index({ status: 1, category: 1 });
donationSchema.index({ donorId: 1, status: 1 });
donationSchema.index({ safeConsumptionDeadline: 1, status: 1 });

export const Donation = mongoose.model<IDonation>('Donation', donationSchema);
