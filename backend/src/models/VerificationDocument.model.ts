import mongoose, { Schema, Document } from 'mongoose';
import { VerificationStatus } from '../types';

export interface IVerificationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  entityType: 'DONOR' | 'NGO' | 'VOLUNTEER';
  entityId: mongoose.Types.ObjectId;
  documentType: string;
  documentUrl: string;
  thumbnailUrl?: string;
  uploadedAt: Date;
  status: VerificationStatus;
  reviewNote?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
}

const verificationDocumentSchema = new Schema<IVerificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    entityType: { type: String, enum: ['DONOR', 'NGO', 'VOLUNTEER'], required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    documentType: { type: String, required: true },
    documentUrl: { type: String, required: true },
    thumbnailUrl: String,
    uploadedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.PENDING,
      index: true,
    },
    reviewNote: String,
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
  },
  { timestamps: true }
);

export const VerificationDocument = mongoose.model<IVerificationDocument>('VerificationDocument', verificationDocumentSchema);
