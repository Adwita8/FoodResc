import mongoose, { Schema, Document } from 'mongoose';
import { FoodCategory, QuantityUnit, UrgencyLevel } from '../types';

export interface IEmergencyRequest extends Document {
  createdBy: mongoose.Types.ObjectId;
  title: string;
  description: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  requiredCategory: FoodCategory;
  requiredQuantity: number;
  quantityUnit: QuantityUnit;
  beneficiaryCount: number;
  urgencyLevel: UrgencyLevel;
  deliveryDeadline: Date;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  status: 'ACTIVE' | 'FULFILLED' | 'EXPIRED' | 'CANCELLED';
  allocatedDonations: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const emergencyRequestSchema = new Schema<IEmergencyRequest>(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    requiredCategory: {
      type: String,
      enum: Object.values(FoodCategory),
      required: true,
    },
    requiredQuantity: { type: Number, required: true },
    quantityUnit: {
      type: String,
      enum: Object.values(QuantityUnit),
      default: QuantityUnit.KILOGRAMS,
    },
    beneficiaryCount: { type: Number, required: true },
    urgencyLevel: {
      type: String,
      enum: Object.values(UrgencyLevel),
      default: UrgencyLevel.HIGH,
      index: true,
    },
    deliveryDeadline: { type: Date, required: true },
    contactName: { type: String, required: true },
    contactPhone: { type: String, required: true },
    contactEmail: String,
    status: {
      type: String,
      enum: ['ACTIVE', 'FULFILLED', 'EXPIRED', 'CANCELLED'],
      default: 'ACTIVE',
      index: true,
    },
    allocatedDonations: [{ type: Schema.Types.ObjectId, ref: 'Donation' }],
  },
  { timestamps: true }
);

emergencyRequestSchema.index({ location: '2dsphere' });

export const EmergencyRequest = mongoose.model<IEmergencyRequest>('EmergencyRequest', emergencyRequestSchema);
