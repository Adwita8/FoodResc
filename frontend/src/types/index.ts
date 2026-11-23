// ============================================
// Enums
// ============================================

export enum UserRole {
  DONOR = 'DONOR',
  NGO = 'NGO',
  VOLUNTEER = 'VOLUNTEER',
  BENEFICIARY = 'BENEFICIARY',
  ADMIN = 'ADMIN',
}

export enum AccountStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export enum DonorType {
  RESTAURANT = 'RESTAURANT',
  HOTEL = 'HOTEL',
  SUPERMARKET = 'SUPERMARKET',
  GROCERY = 'GROCERY',
  BAKERY = 'BAKERY',
  CATERING = 'CATERING',
  INDIVIDUAL = 'INDIVIDUAL',
  CORPORATE = 'CORPORATE',
  OTHER = 'OTHER',
}

export enum FoodCategory {
  COOKED_MEALS = 'COOKED_MEALS',
  RAW_INGREDIENTS = 'RAW_INGREDIENTS',
  PACKAGED_FOOD = 'PACKAGED_FOOD',
  BAKERY_ITEMS = 'BAKERY_ITEMS',
  DAIRY = 'DAIRY',
  FRUITS_VEGETABLES = 'FRUITS_VEGETABLES',
  BEVERAGES = 'BEVERAGES',
  CANNED_GOODS = 'CANNED_GOODS',
  FROZEN = 'FROZEN',
}

export enum QuantityUnit {
  KG = 'KG',
  PORTIONS = 'PORTIONS',
  ITEMS = 'ITEMS',
  LITERS = 'LITERS',
  BOXES = 'BOXES',
  PACKETS = 'PACKETS',
}

export enum Allergen {
  NUTS = 'NUTS',
  DAIRY = 'DAIRY',
  GLUTEN = 'GLUTEN',
  SOY = 'SOY',
  EGGS = 'EGGS',
  SHELLFISH = 'SHELLFISH',
  FISH = 'FISH',
  NONE = 'NONE',
}

export enum DonationStatus {
  PENDING = 'PENDING',
  MATCHING = 'MATCHING',
  ALLOCATED = 'ALLOCATED',
  PICKED_UP = 'PICKED_UP',
  DELIVERED = 'DELIVERED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum AllocationStatus {
  OFFERED = 'OFFERED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export enum PickupStatus {
  SCHEDULED = 'SCHEDULED',
  EN_ROUTE = 'EN_ROUTE',
  ARRIVED = 'ARRIVED',
  COLLECTED = 'COLLECTED',
  IN_TRANSIT = 'IN_TRANSIT',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum TransportType {
  WALKING = 'WALKING',
  BICYCLE = 'BICYCLE',
  MOTORCYCLE = 'MOTORCYCLE',
  CAR = 'CAR',
  VAN = 'VAN',
  TRUCK = 'TRUCK',
  REFRIGERATED_VAN = 'REFRIGERATED_VAN',
}

export enum UrgencyLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum RequestStatus {
  OPEN = 'OPEN',
  PARTIALLY_FULFILLED = 'PARTIALLY_FULFILLED',
  FULFILLED = 'FULFILLED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum NotificationType {
  DONATION_MATCH = 'DONATION_MATCH',
  ALLOCATION_OFFER = 'ALLOCATION_OFFER',
  PICKUP_ASSIGNED = 'PICKUP_ASSIGNED',
  STATUS_UPDATE = 'STATUS_UPDATE',
  SYSTEM = 'SYSTEM',
  EMERGENCY_ALERT = 'EMERGENCY_ALERT',
}

// ============================================
// Core Geometric & Common Types
// ============================================

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  formattedAddress?: string;
}

export interface PickupSlot {
  _id?: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked?: boolean;
}

// ============================================
// User & Role Models
// ============================================

export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: AccountStatus;
  isEmailVerified: boolean;
  avatarUrl?: string;
  location?: GeoPoint;
  address?: Address;
  donorProfile?: Donor;
  ngoProfile?: NGO;
  volunteerProfile?: Volunteer;
  beneficiaryProfile?: Beneficiary;
  createdAt: string;
  updatedAt: string;
}

export interface Donor {
  _id: string;
  userId: string | User;
  businessName?: string;
  donorType: DonorType;
  fssaiNumber?: string;
  totalDonationsCount: number;
  totalFoodWeightKg: number;
  reliabilityScore: number;
  address: Address;
  location: GeoPoint;
  createdAt: string;
  updatedAt: string;
}

export interface NGO {
  _id: string;
  userId: string | User;
  organizationName: string;
  registrationNumber?: string;
  operatingAreas?: string[];
  capacityPeople: number;
  dietaryPreferences?: string[];
  storageCapacityKg?: number;
  hasRefrigeration?: boolean;
  verificationDocuments?: string[];
  reliabilityScore: number;
  activeRequestsCount: number;
  address: Address;
  location: GeoPoint;
  createdAt: string;
  updatedAt: string;
}

export interface Volunteer {
  _id: string;
  userId: string | User;
  transportType: TransportType;
  hasCoolerBag: boolean;
  maxDistanceKm: number;
  isAvailable: boolean;
  currentLocation?: GeoPoint;
  completedDeliveriesCount: number;
  ratingAverage: number;
  ratingCount: number;
  address: Address;
  createdAt: string;
  updatedAt: string;
}

export interface Beneficiary {
  _id: string;
  userId: string | User;
  familyMembersCount: number;
  specialDietaryNeeds?: string[];
  urgencyLevel: UrgencyLevel;
  associatedNgoId?: string;
  address: Address;
  location: GeoPoint;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Donation & Food Management
// ============================================

export interface Donation {
  _id: string;
  id?: string;
  donorId: string | Donor | User;
  donor?: {
    _id: string;
    name: string;
    businessName?: string;
    phone?: string;
  };
  foodName: string;
  description?: string;
  category: FoodCategory;
  images: string[];
  totalQuantity: number;
  remainingQuantity: number;
  quantityUnit: QuantityUnit;
  numberOfPortions?: number;
  preparationTime: string;
  safeConsumptionDeadline: string;
  pickupDeadline: string;
  storageRequirements?: string;
  temperatureRequirements?: string;
  allergens: Allergen[];
  packagingCondition?: string;
  pickupAddress: string;
  location: GeoPoint;
  pickupSlots: PickupSlot[];
  specialInstructions?: string;
  isEmergency: boolean;
  emergencyRequestId?: string;
  status: DonationStatus;
  aiQualityScore?: number;
  verificationCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AllocationOffer {
  _id: string;
  donationId: string | Donation;
  ngoId: string | NGO | User;
  allocatedQuantity: number;
  status: AllocationStatus;
  expiresAt: string;
  respondedAt?: string;
  declineReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Allocation {
  _id: string;
  donationId: string | Donation;
  ngoId: string | NGO | User;
  volunteerId?: string | Volunteer | User;
  allocatedQuantity: number;
  status: AllocationStatus;
  pickupScheduledAt?: string;
  deliveredAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pickup {
  _id: string;
  allocationId: string | Allocation;
  donationId: string | Donation;
  volunteerId?: string | Volunteer | User;
  ngoId: string | NGO | User;
  status: PickupStatus;
  pickupSlot: PickupSlot;
  routeGeometry?: unknown;
  estimatedArrival?: string;
  donorOtp?: string;
  ngoOtp?: string;
  pickupProofImage?: string;
  deliveryProofImage?: string;
  temperatureAtPickup?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Requests & Emergencies
// ============================================

export interface FoodRequest {
  _id: string;
  ngoId: string | NGO | User;
  title: string;
  description?: string;
  category: FoodCategory;
  requestedQuantity: number;
  fulfilledQuantity: number;
  quantityUnit: QuantityUnit;
  beneficiariesCount: number;
  urgencyLevel: UrgencyLevel;
  requiredByDate: string;
  deliveryAddress: string;
  location: GeoPoint;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyRequest {
  _id: string;
  ngoId: string | NGO | User;
  incidentType: string;
  title: string;
  description: string;
  peopleInNeedCount: number;
  urgency: UrgencyLevel;
  deliveryAddress: string;
  location: GeoPoint;
  contactPerson: string;
  contactPhone: string;
  status: 'ACTIVE' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}

// ============================================
// System, Audit & Notifications
// ============================================

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  link?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  reviewerId: string | User;
  targetId: string | User;
  donationId?: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  userId?: string;
  action: string;
  module: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

// ============================================
// API & Auth Response Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  stack?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  businessName?: string;
  donorType?: DonorType;
  organizationName?: string;
  registrationNumber?: string;
  address?: Address;
  latitude?: number;
  longitude?: number;
}
