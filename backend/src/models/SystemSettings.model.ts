import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSettings extends Document {
  key: string;
  value: any;
  description?: string;
  category?: string;
  updatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const systemSettingsSchema = new Schema<ISystemSettings>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
    description: String,
    category: { type: String, default: 'general' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const SystemSettings = mongoose.model<ISystemSettings>('SystemSettings', systemSettingsSchema);
