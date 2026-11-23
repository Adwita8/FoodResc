// ============================================
// FoodRescue Core TypeScript Types & Interfaces
// ============================================

export enum UserRole {
  ADMIN = 'ADMIN',
  DONOR = 'DONOR',
  NGO = 'NGO',
  VOLUNTEER = 'VOLUNTEER',
  BENEFICIARY = 'BENEFICIARY',
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED',
}

export enum VerificationStatus {
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  RESUBMISSION_REQUIRED = 'RESUBMISSION_REQUIRED',
  SUSPENDED = 'SUSPENDED',
}

export enum DonationStatus {
  DRAFT = 'DRAFT',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  AVAILABLE = 'AVAILABLE',
  OFFERED = 'OFFERED',
  PARTIALLY_ALLOCATED = 'PARTIALLY_ALLOCATED',
  FULLY_ALLOCATED = 'FULLY_ALLOCATED',
  CLAIMED = 'CLAIMED',
  PICKUP_SCHEDULED = 'PICKUP_SCHEDULED',
  PICKED_UP = 'PICKED_UP',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export enum PickupStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  ACCEPTED = 'ACCEPTED',
  EN_ROUTE = 'EN_ROUTE',
  ARRIVED = 'ARRIVED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum AllocationOfferStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum AllocationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  PICKED_UP = 'PICKED_UP',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export enum FoodCategory {
  COOKED_MEALS = 'COOKED_MEALS',
  RAW_VEGETABLES = 'RAW_VEGETABLES',
  FRUITS = 'FRUITS',
  DAIRY = 'DAIRY',
  BAKERY = 'BAKERY',
  PACKAGED = 'PACKAGED',
  FROZEN = 'FROZEN',
  BEVERAGES = 'BEVERAGES',
  OTHER = 'OTHER',
}

export enum QuantityUnit {
  PACKETS = 'PACKETS',
  PORTIONS = 'PORTIONS',
  KILOGRAMS = 'KILOGRAMS',
  LITRES = 'LITRES',
  PIECES = 'PIECES',
}

export enum Allergen {
  MILK = 'MILK',
  PEANUTS = 'PEANUTS',
  TREE_NUTS = 'TREE_NUTS',
  SOY = 'SOY',
  WHEAT = 'WHEAT',
  EGGS = 'EGGS',
  FISH = 'FISH',
  SHELLFISH = 'SHELLFISH',
}

export enum UrgencyLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum DonorType {
  RESTAURANT = 'RESTAURANT',
  HOTEL = 'HOTEL',
  SUPERMARKET = 'SUPERMARKET',
  GROCERY = 'GROCERY',
  BAKERY = 'BAKERY',
  CATERING = 'CATERING',
  INDIVIDUAL = 'INDIVIDUAL',
}

export enum VehicleType {
  BICYCLE = 'BICYCLE',
  MOTORCYCLE = 'MOTORCYCLE',
  CAR = 'CAR',
  VAN = 'VAN',
  TRUCK = 'TRUCK',
}

export enum NotificationType {
  DONATION_CREATED = 'DONATION_CREATED',
  DONATION_OFFERED = 'DONATION_OFFERED',
  OFFER_ACCEPTED = 'OFFER_ACCEPTED',
  OFFER_REJECTED = 'OFFER_REJECTED',
  OFFER_EXPIRED = 'OFFER_EXPIRED',
  PICKUP_SCHEDULED = 'PICKUP_SCHEDULED',
  PICKUP_ASSIGNED = 'PICKUP_ASSIGNED',
  PICKUP_ACCEPTED = 'PICKUP_ACCEPTED',
  PICKUP_EN_ROUTE = 'PICKUP_EN_ROUTE',
  PICKUP_ARRIVED = 'PICKUP_ARRIVED',
  FOOD_COLLECTED = 'FOOD_COLLECTED',
  FOOD_DELIVERED = 'FOOD_DELIVERED',
  EMERGENCY_ALERT = 'EMERGENCY_ALERT',
  VERIFICATION_APPROVED = 'VERIFICATION_APPROVED',
  VERIFICATION_REJECTED = 'VERIFICATION_REJECTED',
  ACCOUNT_STATUS_CHANGED = 'ACCOUNT_STATUS_CHANGED',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
}

export enum FoodRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  ASSIGNED = 'ASSIGNED',
  COLLECTED = 'COLLECTED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
}

export enum EmergencyRequestStatus {
  ACTIVE = 'ACTIVE',
  FULFILLED = 'FULFILLED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

// GeoJSON Point format
export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

// Address structure
export interface Address {
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

// Operating hours structure
export interface OperatingHour {
  day: string;
  open: string;
  close: string;
}

// Pickup slot structure
export interface PickupSlot {
  date: string;
  startTime: string;
  endTime: string;
}

// Verification document item
export interface VerificationDocumentItem {
  url: string;
  type: string;
  uploadedAt: Date;
}

// Authenticated user attached to Express request
export interface AuthUser {
  userId: string;
  id?: string;
  email: string;
  role: UserRole;
  accountStatus?: AccountStatus;
  donorId?: string;
  ngoId?: string;
  volunteerId?: string;
  beneficiaryId?: string;
  [key: string]: unknown;
}

// Express Request declaration merging
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
