import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { logger } from '../utils/logger';

import { User } from '../models/User.model';
import { Donor } from '../models/Donor.model';
import { NGO } from '../models/NGO.model';
import { Volunteer } from '../models/Volunteer.model';
import { Beneficiary } from '../models/Beneficiary.model';
import { Donation } from '../models/Donation.model';
import { Allocation } from '../models/Allocation.model';
import { Pickup } from '../models/Pickup.model';
import { Notification } from '../models/Notification.model';
import { FoodCategoryModel } from '../models/FoodCategory.model';
import {
  UserRole,
  AccountStatus,
  VerificationStatus,
  DonationStatus,
  FoodCategory,
  QuantityUnit,
  Allergen,
  DonorType,
  VehicleType,
  PickupStatus,
  NotificationType,
} from '../types';

export async function seedDatabase() {
  try {
    logger.info('Connecting to database for seeding...');
    await connectDatabase();

    logger.info('Clearing existing records (collections refresh)...');
    await Promise.all([
      User.deleteMany({}),
      Donor.deleteMany({}),
      NGO.deleteMany({}),
      Volunteer.deleteMany({}),
      Beneficiary.deleteMany({}),
      Donation.deleteMany({}),
      Allocation.deleteMany({}),
      Pickup.deleteMany({}),
      Notification.deleteMany({}),
      FoodCategoryModel.deleteMany({}),
    ]);

    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('Password@123', salt);

    logger.info('Seeding default food categories...');
    const categories = [
      { name: 'Cooked Meals', slug: 'cooked-meals', description: 'Freshly prepared nutritious hot meals', sortOrder: 1 },
      { name: 'Raw Vegetables', slug: 'raw-vegetables', description: 'Fresh farm produce, greens, and veggies', sortOrder: 2 },
      { name: 'Fresh Fruits', slug: 'fresh-fruits', description: 'Seasonal and surplus whole fruits', sortOrder: 3 },
      { name: 'Bakery Products', slug: 'bakery-products', description: 'Bread, buns, rolls, and dry baked goods', sortOrder: 4 },
      { name: 'Dairy Products', slug: 'dairy-products', description: 'Milk, cheese, yogurt, and paneer', sortOrder: 5 },
      { name: 'Packaged Food', slug: 'packaged-food', description: 'Sealed non-perishable canned and boxed food', sortOrder: 6 },
    ];
    await FoodCategoryModel.insertMany(categories);

    logger.info('Seeding 1 Admin account...');
    const adminUser = await User.create({
      name: 'Platform Administrator',
      email: 'admin@foodrescue.org',
      phone: '+919876543210',
      passwordHash: defaultPasswordHash,
      role: UserRole.ADMIN,
      isEmailVerified: true,
      accountStatus: AccountStatus.ACTIVE,
    });

    logger.info('Seeding 3 Donors...');
    // Donor 1: Taj Gateway Restaurant (Bangalore MG Road)
    const donor1User = await User.create({
      name: 'Chef Rajesh Kumar',
      email: 'donor.taj@foodrescue.org',
      phone: '+919876543211',
      passwordHash: defaultPasswordHash,
      role: UserRole.DONOR,
      isEmailVerified: true,
      accountStatus: AccountStatus.ACTIVE,
    });
    const donor1 = await Donor.create({
      userId: donor1User._id,
      businessName: 'The Gateway Grand Hotel & Banquets',
      donorType: DonorType.HOTEL,
      description: 'Luxury hotel buffet and event dining with high hygiene standards.',
      address: { street: 'MG Road, Ashok Nagar', city: 'Bangalore', state: 'Karnataka', pincode: '560001', country: 'India' },
      location: { type: 'Point', coordinates: [77.6080, 12.9750] },
      contactPhone: '+919876543211',
      verificationStatus: VerificationStatus.APPROVED,
      reliabilityScore: 96,
      acceptedDonationCount: 42,
      successfulDonationCount: 40,
      totalFoodDonated: 1250,
    });

    // Donor 2: FreshBake Patisserie (Indiranagar)
    const donor2User = await User.create({
      name: 'Ananya Sharma',
      email: 'donor.freshbake@foodrescue.org',
      phone: '+919876543212',
      passwordHash: defaultPasswordHash,
      role: UserRole.DONOR,
      isEmailVerified: true,
      accountStatus: AccountStatus.ACTIVE,
    });
    const donor2 = await Donor.create({
      userId: donor2User._id,
      businessName: 'FreshBake Artisanal Bakery',
      donorType: DonorType.BAKERY,
      description: 'Daily fresh bread, sandwich loaves, and bakery goods.',
      address: { street: '100ft Road, Indiranagar', city: 'Bangalore', state: 'Karnataka', pincode: '560038', country: 'India' },
      location: { type: 'Point', coordinates: [77.6410, 12.9780] },
      contactPhone: '+919876543212',
      verificationStatus: VerificationStatus.APPROVED,
      reliabilityScore: 92,
      acceptedDonationCount: 28,
      successfulDonationCount: 26,
      totalFoodDonated: 640,
    });

    // Donor 3: GreenBasket Supermarket (Koramangala)
    const donor3User = await User.create({
      name: 'Sunil Rao',
      email: 'donor.greenbasket@foodrescue.org',
      phone: '+919876543213',
      passwordHash: defaultPasswordHash,
      role: UserRole.DONOR,
      isEmailVerified: true,
      accountStatus: AccountStatus.ACTIVE,
    });
    const donor3 = await Donor.create({
      userId: donor3User._id,
      businessName: 'GreenBasket Hypermarket',
      donorType: DonorType.SUPERMARKET,
      description: 'Supermarket chain redirecting daily surplus vegetables and packaged goods.',
      address: { street: '5th Block, Koramangala', city: 'Bangalore', state: 'Karnataka', pincode: '560095', country: 'India' },
      location: { type: 'Point', coordinates: [77.6180, 12.9340] },
      contactPhone: '+919876543213',
      verificationStatus: VerificationStatus.APPROVED,
      reliabilityScore: 88,
      acceptedDonationCount: 35,
      successfulDonationCount: 33,
      totalFoodDonated: 1890,
    });

    logger.info('Seeding 3 NGOs...');
    // NGO 1: Asha Jyothi Child Care & Food Bank (Shanthi Nagar)
    const ngo1User = await User.create({
      name: 'Sister Mary Teresa',
      email: 'ngo.ashajyothi@foodrescue.org',
      phone: '+919876543221',
      passwordHash: defaultPasswordHash,
      role: UserRole.NGO,
      isEmailVerified: true,
      accountStatus: AccountStatus.ACTIVE,
    });
    const ngo1 = await NGO.create({
      userId: ngo1User._id,
      organizationName: 'Asha Jyothi Community Shelter & Kitchen',
      registrationNumber: 'NGO-KA-2018-8472',
      description: 'Providing daily hot meals and sheltering 120 children and senior citizens.',
      contactPerson: 'Sister Mary Teresa',
      address: { street: 'Langford Road, Shanthi Nagar', city: 'Bangalore', state: 'Karnataka', pincode: '560027', country: 'India' },
      location: { type: 'Point', coordinates: [77.5990, 12.9550] },
      acceptedFoodCategories: [FoodCategory.COOKED_MEALS, FoodCategory.BAKERY, FoodCategory.FRUITS],
      storageFacilities: ['Refrigerators', 'Insulated warmers', 'Dry storage'],
      maximumCapacity: 300,
      availableCapacity: 250,
      transportationAvailability: true,
      beneficiaryCount: 120,
      verificationStatus: VerificationStatus.APPROVED,
      reliabilityScore: 98,
      successfulPickups: 54,
    });

    // NGO 2: Karuna Food Bank (Ulsoor)
    const ngo2User = await User.create({
      name: 'Dr. Vivek Menon',
      email: 'ngo.karuna@foodrescue.org',
      phone: '+919876543222',
      passwordHash: defaultPasswordHash,
      role: UserRole.NGO,
      isEmailVerified: true,
      accountStatus: AccountStatus.ACTIVE,
    });
    const ngo2 = await NGO.create({
      userId: ngo2User._id,
      organizationName: 'Karuna Feeding Hope Initiative',
      registrationNumber: 'NGO-KA-2015-1190',
      description: 'Community pantry and food redistribution network feeding underserved slums.',
      contactPerson: 'Dr. Vivek Menon',
      address: { street: 'Near Ulsoor Lake, Someshwarpura', city: 'Bangalore', state: 'Karnataka', pincode: '560008', country: 'India' },
      location: { type: 'Point', coordinates: [77.6220, 12.9810] },
      acceptedFoodCategories: [FoodCategory.COOKED_MEALS, FoodCategory.RAW_VEGETABLES, FoodCategory.PACKAGED],
      storageFacilities: ['Deep Freezers', 'Shelving units'],
      maximumCapacity: 500,
      availableCapacity: 400,
      transportationAvailability: true,
      beneficiaryCount: 250,
      verificationStatus: VerificationStatus.APPROVED,
      reliabilityScore: 94,
      successfulPickups: 82,
    });

    // NGO 3: Sneha Deepa Foundation (HSR Layout)
    const ngo3User = await User.create({
      name: 'Pooja Hegde',
      email: 'ngo.snehadeepa@foodrescue.org',
      phone: '+919876543223',
      passwordHash: defaultPasswordHash,
      role: UserRole.NGO,
      isEmailVerified: true,
      accountStatus: AccountStatus.ACTIVE,
    });
    const ngo3 = await NGO.create({
      userId: ngo3User._id,
      organizationName: 'Sneha Deepa Foundation for Homeless',
      registrationNumber: 'NGO-KA-2020-4321',
      description: 'Evening night shelter and emergency nutrition distribution.',
      contactPerson: 'Pooja Hegde',
      address: { street: 'Sector 3, HSR Layout', city: 'Bangalore', state: 'Karnataka', pincode: '560102', country: 'India' },
      location: { type: 'Point', coordinates: [77.6360, 12.9120] },
      acceptedFoodCategories: [FoodCategory.COOKED_MEALS, FoodCategory.BAKERY, FoodCategory.DAIRY],
      storageFacilities: ['Coolers'],
      maximumCapacity: 200,
      availableCapacity: 150,
      transportationAvailability: false,
      beneficiaryCount: 80,
      verificationStatus: VerificationStatus.APPROVED,
      reliabilityScore: 89,
      successfulPickups: 31,
    });

    logger.info('Seeding 3 Volunteers...');
    const volunteer1User = await User.create({
      name: 'Karthik Gowda',
      email: 'volunteer.karthik@foodrescue.org',
      phone: '+919876543231',
      passwordHash: defaultPasswordHash,
      role: UserRole.VOLUNTEER,
      isEmailVerified: true,
      accountStatus: AccountStatus.ACTIVE,
    });
    const volunteer1 = await Volunteer.create({
      userId: volunteer1User._id,
      vehicleType: VehicleType.VAN,
      vehicleCapacity: 200,
      availability: true,
      verificationStatus: VerificationStatus.APPROVED,
      totalDeliveries: 45,
      totalDistanceTravelled: 340,
      totalFoodTransported: 1100,
      rating: 4.9,
    });

    const volunteer2User = await User.create({
      name: 'Sneha Reddy',
      email: 'volunteer.sneha@foodrescue.org',
      phone: '+919876543232',
      passwordHash: defaultPasswordHash,
      role: UserRole.VOLUNTEER,
      isEmailVerified: true,
      accountStatus: AccountStatus.ACTIVE,
    });
    await Volunteer.create({
      userId: volunteer2User._id,
      vehicleType: VehicleType.CAR,
      vehicleCapacity: 60,
      availability: true,
      verificationStatus: VerificationStatus.APPROVED,
      totalDeliveries: 28,
      totalDistanceTravelled: 190,
      totalFoodTransported: 580,
      rating: 4.8,
    });

    const volunteer3User = await User.create({
      name: 'Rohan Verma',
      email: 'volunteer.rohan@foodrescue.org',
      phone: '+919876543233',
      passwordHash: defaultPasswordHash,
      role: UserRole.VOLUNTEER,
      isEmailVerified: true,
      accountStatus: AccountStatus.ACTIVE,
    });
    await Volunteer.create({
      userId: volunteer3User._id,
      vehicleType: VehicleType.MOTORCYCLE,
      vehicleCapacity: 25,
      availability: true,
      verificationStatus: VerificationStatus.APPROVED,
      totalDeliveries: 19,
      totalDistanceTravelled: 125,
      totalFoodTransported: 240,
      rating: 4.7,
    });

    logger.info('Seeding 2 Beneficiaries...');
    const ben1User = await User.create({
      name: 'Lakshmi Devi',
      email: 'beneficiary.lakshmi@foodrescue.org',
      phone: '+919876543241',
      passwordHash: defaultPasswordHash,
      role: UserRole.BENEFICIARY,
      isEmailVerified: true,
      accountStatus: AccountStatus.ACTIVE,
    });
    await Beneficiary.create({
      userId: ben1User._id,
      householdSize: 5,
      dietaryRestrictions: ['Vegetarian'],
      totalRequestsMade: 8,
      totalFoodReceived: 32,
    });

    const ben2User = await User.create({
      name: 'Manjunath Swamy',
      email: 'beneficiary.manjunath@foodrescue.org',
      phone: '+919876543242',
      passwordHash: defaultPasswordHash,
      role: UserRole.BENEFICIARY,
      isEmailVerified: true,
      accountStatus: AccountStatus.ACTIVE,
    });
    await Beneficiary.create({
      userId: ben2User._id,
      householdSize: 4,
      dietaryRestrictions: [],
      totalRequestsMade: 6,
      totalFoodReceived: 24,
    });

    logger.info('Seeding Donations across all lifecycles...');
    const now = new Date();

    // 1. Available Fresh Meal
    await Donation.create({
      donorId: donor1._id,
      foodName: 'Paneer Butter Masala & Steamed Jeera Rice Combo',
      description: 'Fresh banquet surplus packed in food-grade thermocol containers. Kept warm.',
      category: FoodCategory.COOKED_MEALS,
      images: ['https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80'],
      totalQuantity: 60,
      availableQuantity: 60,
      allocatedQuantity: 0,
      quantityUnit: QuantityUnit.PORTIONS,
      numberOfPortions: 60,
      preparationTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2h ago
      safeConsumptionDeadline: new Date(now.getTime() + 6 * 60 * 60 * 1000), // in 6 hours
      pickupDeadline: new Date(now.getTime() + 3 * 60 * 60 * 1000), // in 3 hours
      storageRequirements: 'Keep above 65°C or refrigerate within 2 hours',
      allergens: [Allergen.MILK],
      packagingCondition: 'Sealed food-grade containers',
      pickupAddress: 'The Gateway Grand Hotel, MG Road Banquet Hall Dispatch',
      location: { type: 'Point', coordinates: [77.6080, 12.9750] },
      status: DonationStatus.AVAILABLE,
      statusHistory: [{ status: DonationStatus.AVAILABLE, timestamp: now, note: 'Listed for redistribution' }],
    });

    // 2. Available Fresh Breads & Loaves
    await Donation.create({
      donorId: donor2._id,
      foodName: 'Whole Wheat Sandwich Loaves & Sweet Buns',
      description: 'Surplus morning artisanal bakery bake. Crisp crust, baked without preservatives.',
      category: FoodCategory.BAKERY,
      images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80'],
      totalQuantity: 40,
      availableQuantity: 40,
      allocatedQuantity: 0,
      quantityUnit: QuantityUnit.PACKETS,
      preparationTime: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      safeConsumptionDeadline: new Date(now.getTime() + 28 * 60 * 60 * 1000),
      pickupDeadline: new Date(now.getTime() + 8 * 60 * 60 * 1000),
      storageRequirements: 'Store in cool dry place away from direct sunlight',
      allergens: [Allergen.WHEAT],
      packagingCondition: 'Clean craft paper bags',
      pickupAddress: 'FreshBake Artisanal Bakery, Indiranagar',
      location: { type: 'Point', coordinates: [77.6410, 12.9780] },
      status: DonationStatus.AVAILABLE,
    });

    // 3. Partially Allocated Donation (divided between NGOs)
    const partDonation = await Donation.create({
      donorId: donor3._id,
      foodName: 'Fresh Farm Apples, Bananas & Seasonal Melons',
      description: 'Supermarket daily fresh stock rotation, perfectly ripe and healthy fruits.',
      category: FoodCategory.FRUITS,
      images: ['https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=600&q=80'],
      totalQuantity: 100,
      availableQuantity: 40,
      allocatedQuantity: 60,
      quantityUnit: QuantityUnit.KILOGRAMS,
      preparationTime: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      safeConsumptionDeadline: new Date(now.getTime() + 48 * 60 * 60 * 1000),
      pickupDeadline: new Date(now.getTime() + 12 * 60 * 60 * 1000),
      pickupAddress: 'GreenBasket Supermarket Loading Bay, Koramangala',
      location: { type: 'Point', coordinates: [77.6180, 12.9340] },
      status: DonationStatus.PARTIALLY_ALLOCATED,
    });

    const alloc1 = await Allocation.create({
      donationId: partDonation._id,
      ngoId: ngo1._id,
      allocatedQuantity: 30,
      allocationScore: 92,
      status: 'ACCEPTED',
      acceptedAt: now,
      pickupDeadline: partDonation.pickupDeadline,
    });

    await Allocation.create({
      donationId: partDonation._id,
      ngoId: ngo2._id,
      allocatedQuantity: 30,
      allocationScore: 88,
      status: 'ACCEPTED',
      acceptedAt: now,
      pickupDeadline: partDonation.pickupDeadline,
    });

    // 4. Pickup in progress (with OTP verification)
    const activeDonation = await Donation.create({
      donorId: donor1._id,
      foodName: 'Dal Makhani, Roti & Vegetable Pulao Feast',
      description: 'Packed banquet lunch ready for volunteer pickup.',
      category: FoodCategory.COOKED_MEALS,
      images: ['https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80'],
      totalQuantity: 50,
      availableQuantity: 0,
      allocatedQuantity: 50,
      quantityUnit: QuantityUnit.PORTIONS,
      preparationTime: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      safeConsumptionDeadline: new Date(now.getTime() + 5 * 60 * 60 * 1000),
      pickupDeadline: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      pickupAddress: 'The Gateway Grand Hotel, MG Road',
      location: { type: 'Point', coordinates: [77.6080, 12.9750] },
      status: DonationStatus.PICKUP_SCHEDULED,
    });

    const pickupAlloc = await Allocation.create({
      donationId: activeDonation._id,
      ngoId: ngo1._id,
      allocatedQuantity: 50,
      allocationScore: 95,
      status: 'ACCEPTED',
      pickupDeadline: activeDonation.pickupDeadline,
    });

    const crypto = await import('crypto');
    const sampleOtp = '482910';
    const otpHash = crypto.createHash('sha256').update(sampleOtp).digest('hex');

    await Pickup.create({
      allocationId: pickupAlloc._id,
      donationId: activeDonation._id,
      donorId: donor1._id,
      ngoId: ngo1._id,
      volunteerId: volunteer1._id,
      pickupLocation: activeDonation.location,
      deliveryLocation: ngo1.location,
      scheduledTime: now,
      pickupDeadline: activeDonation.pickupDeadline,
      pickupOTP: otpHash,
      pickupStatus: PickupStatus.ASSIGNED,
    });

    // 5. Completed Donation
    const completedDonation = await Donation.create({
      donorId: donor3._id,
      foodName: 'Cartons of UHT Whole Milk & Yogurt Cups',
      description: 'Sealed dairy products safely delivered to shelter.',
      category: FoodCategory.DAIRY,
      images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80'],
      totalQuantity: 80,
      availableQuantity: 0,
      allocatedQuantity: 80,
      quantityUnit: QuantityUnit.LITRES,
      preparationTime: new Date(now.getTime() - 48 * 60 * 60 * 1000),
      safeConsumptionDeadline: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      pickupDeadline: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      pickupAddress: 'GreenBasket Koramangala',
      location: { type: 'Point', coordinates: [77.6180, 12.9340] },
      status: DonationStatus.COMPLETED,
    });

    const compAlloc = await Allocation.create({
      donationId: completedDonation._id,
      ngoId: ngo1._id,
      allocatedQuantity: 80,
      status: 'COMPLETED',
      pickupDeadline: completedDonation.pickupDeadline,
      completedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    });

    await Pickup.create({
      allocationId: compAlloc._id,
      donationId: completedDonation._id,
      donorId: donor3._id,
      ngoId: ngo1._id,
      volunteerId: volunteer1._id,
      pickupLocation: completedDonation.location,
      deliveryLocation: ngo1.location,
      scheduledTime: new Date(now.getTime() - 26 * 60 * 60 * 1000),
      pickupDeadline: completedDonation.pickupDeadline,
      pickupOTP: otpHash,
      pickupStatus: PickupStatus.DELIVERED,
      collectedAt: new Date(now.getTime() - 25 * 60 * 60 * 1000),
      deliveredAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    });

    // 6. Expired Donation (for safety monitoring demonstration)
    await Donation.create({
      donorId: donor1._id,
      foodName: 'Mixed Fruit Salad Cups',
      description: 'Prepared for high tea breakfast, kept refrigerated.',
      category: FoodCategory.FRUITS,
      images: ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80'],
      totalQuantity: 20,
      availableQuantity: 20,
      allocatedQuantity: 0,
      quantityUnit: QuantityUnit.PORTIONS,
      preparationTime: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      safeConsumptionDeadline: new Date(now.getTime() - 2 * 60 * 60 * 1000), // Expired 2h ago
      pickupDeadline: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      pickupAddress: 'The Gateway Grand Hotel, MG Road',
      location: { type: 'Point', coordinates: [77.6080, 12.9750] },
      status: DonationStatus.EXPIRED,
      statusHistory: [{ status: DonationStatus.EXPIRED, timestamp: now, note: 'Safe consumption deadline passed' }],
    });

    // Seed sample notifications
    await Notification.create({
      userId: donor1User._id,
      title: 'Donation Claimed',
      message: 'Your donation of Dal Makhani Feast has been accepted by Asha Jyothi Community Shelter.',
      type: NotificationType.DONATION_CLAIMED,
      isRead: false,
    });

    await Notification.create({
      userId: ngo1User._id,
      title: 'Volunteer Dispatched',
      message: 'Volunteer Karthik Gowda is assigned and en route for pickup from The Gateway Grand Hotel.',
      type: NotificationType.VOLUNTEER_ASSIGNED,
      isRead: false,
    });

    logger.info('====================================================');
    logger.info('Database seeded successfully with realistic data!');
    logger.info('DEMO ACCOUNTS (Password for all: Password@123):');
    logger.info('Admin:        admin@foodrescue.org');
    logger.info('Donor 1:      donor.taj@foodrescue.org');
    logger.info('Donor 2:      donor.freshbake@foodrescue.org');
    logger.info('Donor 3:      donor.greenbasket@foodrescue.org');
    logger.info('NGO 1:        ngo.ashajyothi@foodrescue.org');
    logger.info('NGO 2:        ngo.karuna@foodrescue.org');
    logger.info('NGO 3:        ngo.snehadeepa@foodrescue.org');
    logger.info('Volunteer 1:  volunteer.karthik@foodrescue.org');
    logger.info('Volunteer 2:  volunteer.sneha@foodrescue.org');
    logger.info('Beneficiary:  beneficiary.lakshmi@foodrescue.org');
    logger.info('Active Pickup Demo OTP: 482910');
    logger.info('====================================================');

    await disconnectDatabase();
  } catch (error: any) {
    logger.error('Failed to seed database:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  seedDatabase();
}
