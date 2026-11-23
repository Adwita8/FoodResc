import mongoose, { Schema, Document } from 'mongoose';

export interface IFoodCategory extends Document {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
}

const foodCategorySchema = new Schema<IFoodCategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: String,
    icon: String,
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const FoodCategoryModel = mongoose.model<IFoodCategory>('FoodCategory', foodCategorySchema);
