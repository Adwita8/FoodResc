import mongoose, { Schema, Document } from 'mongoose';
import { FoodCategory, QuantityUnit } from '../types';

export interface IFoodRequest extends Document {
  beneficiaryId: mongoose.Types.ObjectId;
  donationId?: mongoose.Types.ObjectId;
  requestedCategory: FoodCategory;
  requestedQuantity: number;
  quantityUnit: QuantityUnit;
  status: 'PENDING' | 'APPROVED' | 'ASSIGNED' | 'COLLECTED' | 'CANCELLED' | 'REJECTED';
  pickupInstructions?: string;
  pickupOTP?: string;
  collectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const foodRequestSchema = new Schema<IFoodRequest>(
  {
    beneficiaryId: { type: Schema.Types.ObjectId, ref: 'Beneficiary', required: true, index: true },
    donationId: { type: Schema.Types.ObjectId, ref: 'Donation', index: true },
    requestedCategory: {
      type: String,
      enum: Object.values(FoodCategory),
      required: true,
    },
    requestedQuantity: { type: Number, required: true },
    quantityUnit: {
      type: String,
      enum: Object.values(QuantityUnit),
      default: QuantityUnit.PORTIONS,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'ASSIGNED', 'COLLECTED', 'CANCELLED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    pickupInstructions: String,
    pickupOTP: String,
    collectedAt: Date,
  },
  { timestamps: true }
);

export const FoodRequest = mongoose.model<IFoodRequest>('FoodRequest', foodRequestSchema);
