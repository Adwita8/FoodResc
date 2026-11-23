import mongoose, { Schema, Document } from 'mongoose';
import { NotificationType } from '../types';

export interface INotification extends Document {
  userId?: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  relatedEntityType?: string;
  relatedEntityId?: mongoose.Types.ObjectId;
  isRead: boolean;
  channel: 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
      index: true,
    },
    relatedEntityType: String,
    relatedEntityId: { type: Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false, index: true },
    channel: {
      type: String,
      enum: ['IN_APP', 'EMAIL', 'SMS', 'PUSH'],
      default: 'IN_APP',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
