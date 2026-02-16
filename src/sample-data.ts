/**
 * Sample Data for Channel Manager API Endpoints
 *
 * This file contains comprehensive sample data for all channel manager endpoints
 * to aid in testing, documentation, and development.
 */

import {
  ChannelType,
  IntegrationStatus,
} from "./entities/channel-integration.entity";
import { AvailabilityStatus } from "./entities/channel-availability.entity";
import {
  RatePlanType,
  RateModifierType,
} from "./entities/channel-rate-plan.entity";
import {
  SyncOperationType,
  SyncStatus,
  SyncDirection,
} from "./entities/channel-sync-log.entity";
import { BookingStatus } from "./entities/guest.entity";
import { HotelRegistrationSource } from "./dto/create-hotel.dto";

// ============================================================================
// 1. CHANNEL INTEGRATION SAMPLE DATA
// ============================================================================

export const sampleChannelIntegrations = {
  // GET /integrations - List all integrations
  list: [
    {
      id: 1,
      hotelId: 1,
      channelType: ChannelType.BOOKING_COM,
      channelName: "Booking.com Main Integration",
      status: IntegrationStatus.ACTIVE,
      apiKey: "bk_api_key_12345",
      apiSecret: null,
      accessToken: "access_token_xyz789",
      refreshToken: "refresh_token_abc123",
      channelPropertyId: "BCOM-HOTEL-01",
      channelUsername: "hotel-account",
      channelPassword: null,
      webhookUrl: "https://api.example.com/webhooks/booking-com",
      webhookSecret: "webhook_secret_xyz",
      isWebhookEnabled: true,
      syncIntervalMinutes: 15,
      isRealTimeSync: true,
      lastSyncAt: new Date("2025-01-15T10:30:00.000Z"),
      lastSuccessfulSync: new Date("2025-01-15T10:30:00.000Z"),
      errorMessage: null,
      testMode: false,
      channelSettings: {
        autoSync: true,
        defaultCurrency: "USD",
        timeZone: "America/New_York",
        locale: "en-US",
      },
      supportedFeatures: [
        "real-time_sync",
        "webhooks",
        "multi_currency",
        "rate_updates",
        "availability_updates",
      ],
      createdAt: new Date("2025-01-01T10:00:00.000Z"),
      updatedAt: new Date("2025-01-15T10:30:00.000Z"),
      createdBy: 1,
      updatedBy: 1,
    },
    {
      id: 2,
      hotelId: 1,
      channelType: ChannelType.EXPEDIA,
      channelName: "Expedia Partner Integration",
      status: IntegrationStatus.ACTIVE,
      apiKey: "exp_api_key_67890",
      apiSecret: "exp_secret_xyz",
      accessToken: null,
      refreshToken: null,
      channelPropertyId: "EXP-PROP-12345",
      channelUsername: "expedia_partner",
      channelPassword: null,
      webhookUrl: "https://api.example.com/webhooks/expedia",
      webhookSecret: "exp_webhook_secret",
      isWebhookEnabled: true,
      syncIntervalMinutes: 30,
      isRealTimeSync: false,
      lastSyncAt: new Date("2025-01-15T09:45:00.000Z"),
      lastSuccessfulSync: new Date("2025-01-15T09:45:00.000Z"),
      errorMessage: null,
      testMode: false,
      channelSettings: {
        autoSync: true,
        defaultCurrency: "USD",
        timeZone: "America/Los_Angeles",
      },
      supportedFeatures: [
        "inventory_sync",
        "guest_management",
        "xml_api",
        "rate_updates",
      ],
      createdAt: new Date("2025-01-05T14:20:00.000Z"),
      updatedAt: new Date("2025-01-15T09:45:00.000Z"),
      createdBy: 1,
      updatedBy: 1,
    },
    {
      id: 3,
      hotelId: 1,
      channelType: ChannelType.AIRBNB,
      channelName: "Airbnb Calendar Sync",
      status: IntegrationStatus.PENDING,
      apiKey: null,
      apiSecret: null,
      accessToken: "airbnb_access_token_123",
      refreshToken: "airbnb_refresh_token_456",
      channelPropertyId: "AIRBNB-LISTING-789",
      channelUsername: null,
      channelPassword: null,
      webhookUrl: null,
      webhookSecret: null,
      isWebhookEnabled: false,
      syncIntervalMinutes: 60,
      isRealTimeSync: true,
      lastSyncAt: null,
      lastSuccessfulSync: null,
      errorMessage: "Pending initial connection test",
      testMode: true,
      channelSettings: {
        autoSync: false,
        defaultCurrency: "USD",
        instantBooking: false,
      },
      supportedFeatures: [
        "calendar_sync",
        "instant_booking",
        "guest_communication",
      ],
      createdAt: new Date("2025-01-14T16:00:00.000Z"),
      updatedAt: new Date("2025-01-14T16:00:00.000Z"),
      createdBy: 1,
      updatedBy: 1,
    },
    {
      id: 4,
      hotelId: 2,
      channelType: ChannelType.SEVEN,
      channelName: "7even Suites Integration",
      status: IntegrationStatus.ACTIVE,
      apiKey: "seven_api_key_abc",
      apiSecret: null,
      accessToken: null,
      refreshToken: null,
      channelPropertyId: "7EVEN-PROP-001",
      channelUsername: null,
      channelPassword: null,
      webhookUrl: "https://api.example.com/webhooks/seven",
      webhookSecret: "seven_webhook_secret",
      isWebhookEnabled: true,
      syncIntervalMinutes: 15,
      isRealTimeSync: true,
      lastSyncAt: new Date("2025-01-15T11:00:00.000Z"),
      lastSuccessfulSync: new Date("2025-01-15T11:00:00.000Z"),
      errorMessage: null,
      testMode: false,
      channelSettings: {
        autoSync: true,
        defaultCurrency: "NGN",
        timeZone: "Africa/Lagos",
      },
      supportedFeatures: ["webhooks", "reservation_sync"],
      createdAt: new Date("2024-12-01T08:00:00.000Z"),
      updatedAt: new Date("2025-01-15T11:00:00.000Z"),
      createdBy: 2,
      updatedBy: 2,
    },
  ],

  // GET /integrations/:id - Get single integration
  single: {
    id: 1,
    hotelId: 1,
    channelType: ChannelType.BOOKING_COM,
    channelName: "Booking.com Main Integration",
    status: IntegrationStatus.ACTIVE,
    apiKey: "bk_api_key_12345",
    apiSecret: null,
    accessToken: "access_token_xyz789",
    refreshToken: "refresh_token_abc123",
    channelPropertyId: "BCOM-HOTEL-01",
    channelUsername: "hotel-account",
    channelPassword: null,
    webhookUrl: "https://api.example.com/webhooks/booking-com",
    webhookSecret: "webhook_secret_xyz",
    isWebhookEnabled: true,
    syncIntervalMinutes: 15,
    isRealTimeSync: true,
    lastSyncAt: new Date("2025-01-15T10:30:00.000Z"),
    lastSuccessfulSync: new Date("2025-01-15T10:30:00.000Z"),
    errorMessage: null,
    testMode: false,
    channelSettings: {
      autoSync: true,
      defaultCurrency: "USD",
      timeZone: "America/New_York",
      locale: "en-US",
    },
    supportedFeatures: [
      "real-time_sync",
      "webhooks",
      "multi_currency",
      "rate_updates",
      "availability_updates",
    ],
    createdAt: new Date("2025-01-01T10:00:00.000Z"),
    updatedAt: new Date("2025-01-15T10:30:00.000Z"),
    createdBy: 1,
    updatedBy: 1,
  },

  // POST /integrations - Create integration request body (existing hotel)
  createRequest: {
    hotelId: 1,
    channelType: ChannelType.BOOKING_COM,
    channelName: "Booking.com Integration",
    channelUsername: "hotel-account",
    channelPassword: "super-secret",
    channelPropertyId: "BCOM-HOTEL-01",
    isWebhookEnabled: true,
    syncIntervalMinutes: 30,
    channelSettings: {
      defaultCurrency: "USD",
      timeZone: "America/New_York",
    },
  },

  // POST /integrations - Create integration with hotel onboarding
  createRequestWithHotelOnboarding: {
    channelType: ChannelType.BOOKING_COM,
    channelName: "Booking.com Integration",
    channelUsername: "hotel-account",
    channelPassword: "super-secret",
    isWebhookEnabled: true,
    syncIntervalMinutes: 30,
    registrationSource: HotelRegistrationSource.CHANNEL_MANAGER, // Optional: specify registration source
    hotel: {
      name: "Grand Hotel",
      email: "info@grandhotel.com",
      address: "123 Main Street",
      country: "United States",
      state: "New York",
      isActive: true,
      registrationSource: HotelRegistrationSource.CHANNEL_MANAGER, // Can also be specified in hotel object
    },
    channelSettings: {
      defaultCurrency: "USD",
      timeZone: "America/New_York",
    },
  },

  // GET /integrations/available-types/:hotelId
  availableTypes: [
    ChannelType.HOTELS_COM,
    ChannelType.TRIPADVISOR,
    ChannelType.AGODA,
    ChannelType.HOTELBEDS,
    ChannelType.CUSTOM,
  ],
};

// ============================================================================
// 2. CHANNEL MAPPING SAMPLE DATA
// ============================================================================

export const sampleChannelMappings = {
  // GET /integrations/:integrationId/mappings - List mappings
  list: [
    {
      id: 1,
      integrationId: 1,
      roomtypeId: 14,
      channelRoomTypeId: "STD-DOUBLE",
      channelRoomTypeName: "Standard Double Room",
      channelRatePlanId: "BAR",
      channelRatePlanName: "Best Available Rate",
      channelAmenities: ["WiFi", "Air Conditioning", "TV", "Mini Bar"],
      channelDescription:
        "Spacious double room with modern amenities and city view",
      channelImages: [
        "https://example.com/images/std-double-1.jpg",
        "https://example.com/images/std-double-2.jpg",
      ],
      isActive: true,
      mappingRules: {
        minStay: 1,
        maxStay: 30,
        advanceBookingDays: 365,
      },
      customFields: {
        roomSize: "25 sqm",
        bedType: "Double",
        maxOccupancy: 2,
      },
      createdAt: new Date("2025-01-02T10:00:00.000Z"),
      updatedAt: new Date("2025-01-02T10:00:00.000Z"),
      createdBy: 1,
      updatedBy: 1,
    },
    {
      id: 2,
      integrationId: 1,
      roomtypeId: 15,
      channelRoomTypeId: "DLX-SUITE",
      channelRoomTypeName: "Deluxe Suite",
      channelRatePlanId: "FLEX-NRB",
      channelRatePlanName: "Flexible Non-Refundable",
      channelAmenities: [
        "WiFi",
        "Air Conditioning",
        "TV",
        "Mini Bar",
        "Balcony",
        "Room Service",
      ],
      channelDescription:
        "Luxurious suite with separate living area and premium amenities",
      channelImages: [
        "https://example.com/images/dlx-suite-1.jpg",
        "https://example.com/images/dlx-suite-2.jpg",
      ],
      isActive: true,
      mappingRules: {
        minStay: 2,
        maxStay: 14,
        advanceBookingDays: 180,
      },
      customFields: {
        roomSize: "45 sqm",
        bedType: "King",
        maxOccupancy: 3,
      },
      createdAt: new Date("2025-01-02T10:15:00.000Z"),
      updatedAt: new Date("2025-01-02T10:15:00.000Z"),
      createdBy: 1,
      updatedBy: 1,
    },
    {
      id: 3,
      integrationId: 2,
      roomtypeId: 14,
      channelRoomTypeId: "EXP-STD-001",
      channelRoomTypeName: "Standard Room",
      channelRatePlanId: "EXP-RATE-STD",
      channelRatePlanName: "Standard Rate",
      channelAmenities: ["WiFi", "TV", "Coffee Maker"],
      channelDescription:
        "Comfortable standard room with all essential amenities",
      channelImages: ["https://example.com/images/exp-std-1.jpg"],
      isActive: true,
      mappingRules: {
        minStay: 1,
      },
      customFields: {},
      createdAt: new Date("2025-01-06T09:00:00.000Z"),
      updatedAt: new Date("2025-01-06T09:00:00.000Z"),
      createdBy: 1,
      updatedBy: 1,
    },
  ],

  // POST /mappings - Create mapping request body
  createRequest: {
    integrationId: 42,
    roomTypeId: 14,
    ratePlanId: 10,
    channelRoomIdentifier: "STD-DOUBLE",
    channelRatePlanIdentifier: "BAR",
    restrictions: { minStay: 1 },
  },

  // PUT /mappings/:id - Update mapping request body
  updateRequest: {
    isActive: false,
    channelDescription: "Updated room description with new amenities",
    channelAmenities: ["WiFi", "Air Conditioning", "TV", "Mini Bar", "Balcony"],
  },
};

// ============================================================================
// 3. AVAILABILITY SAMPLE DATA
// ============================================================================

export const sampleAvailability = {
  // GET /availability - List availability by date range
  list: [
    {
      id: 1,
      integrationId: 1,
      roomtypeId: 14,
      date: new Date("2025-02-01"),
      status: AvailabilityStatus.AVAILABLE,
      availableRooms: 8,
      totalRooms: 10,
      occupiedRooms: 2,
      blockedRooms: 0,
      maintenanceRooms: 0,
      rate: 150.0,
      currency: "USD",
      isClosed: false,
      closeReason: null,
      restrictions: {
        minStay: 1,
        maxStay: 30,
        closedToArrival: false,
        closedToDeparture: false,
      },
      channelData: {
        bookingCode: "BCOM-001",
        lastUpdated: "2025-01-15T10:00:00Z",
      },
      isSynced: true,
      lastSyncedAt: new Date("2025-01-15T10:30:00.000Z"),
      syncStatus: "SUCCESS",
      errorMessage: null,
      createdAt: new Date("2025-01-15T10:00:00.000Z"),
      updatedAt: new Date("2025-01-15T10:30:00.000Z"),
      createdBy: 1,
      updatedBy: 1,
    },
    {
      id: 2,
      integrationId: 1,
      roomtypeId: 14,
      date: new Date("2025-02-02"),
      status: AvailabilityStatus.AVAILABLE,
      availableRooms: 7,
      totalRooms: 10,
      occupiedRooms: 3,
      blockedRooms: 0,
      maintenanceRooms: 0,
      rate: 165.0,
      currency: "USD",
      isClosed: false,
      closeReason: null,
      restrictions: {
        minStay: 2,
        maxStay: 30,
      },
      channelData: {},
      isSynced: true,
      lastSyncedAt: new Date("2025-01-15T10:30:00.000Z"),
      syncStatus: "SUCCESS",
      errorMessage: null,
      createdAt: new Date("2025-01-15T10:00:00.000Z"),
      updatedAt: new Date("2025-01-15T10:30:00.000Z"),
      createdBy: 1,
      updatedBy: 1,
    },
    {
      id: 3,
      integrationId: 1,
      roomtypeId: 14,
      date: new Date("2025-02-03"),
      status: AvailabilityStatus.AVAILABLE,
      availableRooms: 5,
      totalRooms: 10,
      occupiedRooms: 5,
      blockedRooms: 0,
      maintenanceRooms: 0,
      rate: 180.0,
      currency: "USD",
      isClosed: false,
      closeReason: null,
      restrictions: {},
      channelData: {},
      isSynced: true,
      lastSyncedAt: new Date("2025-01-15T10:30:00.000Z"),
      syncStatus: "SUCCESS",
      errorMessage: null,
      createdAt: new Date("2025-01-15T10:00:00.000Z"),
      updatedAt: new Date("2025-01-15T10:30:00.000Z"),
      createdBy: 1,
      updatedBy: 1,
    },
    {
      id: 4,
      integrationId: 1,
      roomtypeId: 14,
      date: new Date("2025-02-04"),
      status: AvailabilityStatus.MAINTENANCE,
      availableRooms: 0,
      totalRooms: 10,
      occupiedRooms: 0,
      blockedRooms: 0,
      maintenanceRooms: 10,
      rate: null,
      currency: "USD",
      isClosed: true,
      closeReason: "Scheduled maintenance",
      restrictions: {},
      channelData: {},
      isSynced: false,
      lastSyncedAt: null,
      syncStatus: "PENDING",
      errorMessage: null,
      createdAt: new Date("2025-01-15T10:00:00.000Z"),
      updatedAt: new Date("2025-01-15T10:00:00.000Z"),
      createdBy: 1,
      updatedBy: 1,
    },
  ],

  // POST /availability/sync - Sync availability request body
  syncRequest: {
    integrationId: 42,
    updates: [
      {
        roomTypeId: 14,
        date: "2025-02-10",
        availableRooms: 5,
      },
      {
        roomTypeId: 14,
        date: "2025-02-11",
        availableRooms: 4,
      },
    ],
  },

  // Alternative sync request format
  syncRequestSingle: {
    integrationId: 1,
    roomtypeId: 14,
    date: "2025-01-15",
    status: "AVAILABLE",
    availableRooms: 5,
    totalRooms: 10,
    rate: 150.0,
    currency: "USD",
    isClosed: false,
  },
};

// ============================================================================
// 4. RATE PLAN SAMPLE DATA
// ============================================================================

export const sampleRatePlans = {
  // GET /integrations/:integrationId/rate-plans - List rate plans
  list: [
    {
      id: 1,
      integrationId: 1,
      roomtypeId: 14,
      channelRatePlanId: "BAR",
      channelRatePlanName: "Best Available Rate",
      ratePlanType: RatePlanType.STANDARD,
      baseRate: 150.0,
      currency: "USD",
      minStay: 1,
      maxStay: 30,
      closedToArrival: false,
      closedToDeparture: false,
      advanceBookingDays: 365,
      cancellationPolicy: "Free cancellation until 24 hours before check-in",
      seasonalRates: {
        "2025-06-01": 200.0,
        "2025-07-01": 250.0,
        "2025-08-01": 250.0,
        "2025-12-20": 300.0,
      },
      dayOfWeekRates: {
        friday: 180.0,
        saturday: 180.0,
        sunday: 160.0,
      },
      specialDates: {
        "2025-12-25": 350.0,
        "2026-01-01": 350.0,
      },
      rateModifier: 0,
      rateModifierType: RateModifierType.PERCENTAGE,
      isActive: true,
      restrictions: {
        minStay: 1,
        maxStay: 30,
        advanceBookingDays: 365,
      },
      inclusions: ["WiFi", "Breakfast", "Parking"],
      exclusions: [],
      createdAt: new Date("2025-01-02T10:00:00.000Z"),
      updatedAt: new Date("2025-01-02T10:00:00.000Z"),
      createdBy: 1,
      updatedBy: 1,
    },
    {
      id: 2,
      integrationId: 1,
      roomtypeId: 14,
      channelRatePlanId: "FLEX-REFUNDABLE",
      channelRatePlanName: "Flexible Refundable",
      ratePlanType: RatePlanType.STANDARD,
      baseRate: 175.0,
      currency: "USD",
      minStay: 1,
      maxStay: 21,
      closedToArrival: false,
      closedToDeparture: false,
      advanceBookingDays: 180,
      cancellationPolicy: "Free cancellation up to 48 hours before arrival",
      seasonalRates: {},
      dayOfWeekRates: {},
      specialDates: {},
      rateModifier: 0,
      rateModifierType: RateModifierType.PERCENTAGE,
      isActive: true,
      restrictions: {
        minStay: 1,
        maxStay: 21,
      },
      inclusions: ["WiFi", "Breakfast"],
      exclusions: [],
      createdAt: new Date("2025-01-02T10:05:00.000Z"),
      updatedAt: new Date("2025-01-02T10:05:00.000Z"),
      createdBy: 1,
      updatedBy: 1,
    },
    {
      id: 3,
      integrationId: 1,
      roomtypeId: 15,
      channelRatePlanId: "NON-REFUNDABLE",
      channelRatePlanName: "Non-Refundable Discount",
      ratePlanType: RatePlanType.DISCOUNT,
      baseRate: 120.0,
      currency: "USD",
      minStay: 2,
      maxStay: 14,
      closedToArrival: false,
      closedToDeparture: false,
      advanceBookingDays: 90,
      cancellationPolicy: "Non-refundable. No cancellation allowed.",
      seasonalRates: {},
      dayOfWeekRates: {},
      specialDates: {},
      rateModifier: -20,
      rateModifierType: RateModifierType.PERCENTAGE,
      isActive: true,
      restrictions: {
        minStay: 2,
        maxStay: 14,
        nonRefundable: true,
      },
      inclusions: ["WiFi"],
      exclusions: ["Breakfast", "Parking"],
      createdAt: new Date("2025-01-02T10:10:00.000Z"),
      updatedAt: new Date("2025-01-02T10:10:00.000Z"),
      createdBy: 1,
      updatedBy: 1,
    },
  ],

  // POST /rate-plans - Create rate plan request body
  createRequest: {
    integrationId: 42,
    name: "Standard Flexible",
    baseRate: 180,
    currency: "USD",
    restrictions: { minStay: 1, maxStay: 21 },
    cancellationPolicy: "Free cancellation up to 48 hours before arrival",
    channelRatePlanIdentifier: "FLEX-REFUNDABLE",
  },

  // PUT /rate-plans/:id - Update rate plan request body
  updateRequest: {
    baseRate: 175.0,
    minStay: 2,
    maxStay: 30,
    currency: "USD",
    cancellationPolicy: "Free cancellation 48h before check-in",
    closedToArrival: false,
    closedToDeparture: false,
    advanceBookingDays: 365,
    rateModifier: 0,
    isActive: true,
  },
};

// ============================================================================
// 5. BOOKING/GUEST SAMPLE DATA
// ============================================================================

export const sampleBookings = {
  // GET /bookings - List bookings
  list: {
    bookings: [
      {
        id: 1,
        bookingCode: "BK-2024-001",
        otaBookingCode: "BCOM-12345678",
        fullName: "John Doe",
        email: "john.doe@example.com",
        phone: "+1234567890",
        startDate: new Date("2024-06-01"),
        endDate: new Date("2024-06-05"),
        amount: 500.0,
        currency: "USD",
        source: "BOOKING_COM",
        status: BookingStatus.CONFIRMED,
        hotelId: 1,
        roomTypeId: 14,
        integrationId: 1,
        guestDetails: {
          nationality: "US",
          specialRequests: "Late check-in requested",
          numberOfGuests: 2,
          numberOfChildren: 0,
        },
        channelData: {
          confirmationNumber: "BCOM-12345678",
          bookingDate: "2024-05-15T10:00:00Z",
          paymentMethod: "Credit Card",
        },
        cancelReason: null,
        canceledAt: null,
        createdAt: new Date("2024-05-15T10:00:00.000Z"),
        updatedAt: new Date("2024-05-15T10:00:00.000Z"),
      },
      {
        id: 2,
        bookingCode: "BK-2024-002",
        otaBookingCode: "EXP-98765432",
        fullName: "Jane Smith",
        email: "jane.smith@example.com",
        phone: "+0987654321",
        startDate: new Date("2024-06-10"),
        endDate: new Date("2024-06-12"),
        amount: 300.0,
        currency: "USD",
        source: "EXPEDIA",
        status: BookingStatus.CONFIRMED,
        hotelId: 1,
        roomTypeId: 15,
        integrationId: 2,
        guestDetails: {
          nationality: "CA",
          specialRequests: "High floor preferred",
          numberOfGuests: 1,
        },
        channelData: {
          confirmationNumber: "EXP-98765432",
          bookingDate: "2024-05-20T14:30:00Z",
        },
        cancelReason: null,
        canceledAt: null,
        createdAt: new Date("2024-05-20T14:30:00.000Z"),
        updatedAt: new Date("2024-05-20T14:30:00.000Z"),
      },
      {
        id: 3,
        bookingCode: "BK-2024-003",
        otaBookingCode: "SEVEN-ABC123",
        fullName: "Frank George",
        email: "admin@7evensuites.com",
        phone: "+2348012345678",
        startDate: new Date("2025-10-12"),
        endDate: new Date("2025-10-15"),
        amount: 45000.0,
        currency: "NGN",
        source: "SEVEN",
        status: BookingStatus.CHECKED_IN,
        hotelId: 2,
        roomTypeId: 20,
        integrationId: 4,
        guestDetails: {
          nationality: "NG",
          numberOfGuests: 2,
        },
        channelData: {
          roomTypeId: "voyager-deluxe-plus",
          rooms: 1,
        },
        cancelReason: null,
        canceledAt: null,
        createdAt: new Date("2025-01-10T08:00:00.000Z"),
        updatedAt: new Date("2025-10-12T14:00:00.000Z"),
      },
      {
        id: 4,
        bookingCode: "BK-2024-004",
        otaBookingCode: "BCOM-87654321",
        fullName: "Michael Johnson",
        email: "michael.j@example.com",
        phone: "+1122334455",
        startDate: new Date("2024-07-01"),
        endDate: new Date("2024-07-03"),
        amount: 350.0,
        currency: "USD",
        source: "BOOKING_COM",
        status: BookingStatus.CANCELED,
        hotelId: 1,
        roomTypeId: 14,
        integrationId: 1,
        guestDetails: {
          nationality: "GB",
          numberOfGuests: 2,
        },
        channelData: {},
        cancelReason: "Guest request",
        canceledAt: new Date("2024-06-25T16:00:00.000Z"),
        createdAt: new Date("2024-06-01T12:00:00.000Z"),
        updatedAt: new Date("2024-06-25T16:00:00.000Z"),
      },
    ],
    total: 4,
  },

  // GET /bookings/:bookingCode - Get single booking
  single: {
    id: 1,
    bookingCode: "BK-2024-001",
    otaBookingCode: "BCOM-12345678",
    fullName: "John Doe",
    email: "john.doe@example.com",
    phone: "+1234567890",
    startDate: new Date("2024-06-01"),
    endDate: new Date("2024-06-05"),
    amount: 500.0,
    currency: "USD",
    source: "BOOKING_COM",
    status: BookingStatus.CONFIRMED,
    hotelId: 1,
    roomTypeId: 14,
    integrationId: 1,
    guestDetails: {
      nationality: "US",
      specialRequests: "Late check-in requested",
      numberOfGuests: 2,
      numberOfChildren: 0,
    },
    channelData: {
      confirmationNumber: "BCOM-12345678",
      bookingDate: "2024-05-15T10:00:00Z",
      paymentMethod: "Credit Card",
    },
    cancelReason: null,
    canceledAt: null,
    createdAt: new Date("2024-05-15T10:00:00.000Z"),
    updatedAt: new Date("2024-05-15T10:00:00.000Z"),
  },

  // POST /bookings - Create booking request body
  createRequest: {
    bookingCode: "BK-2024-001",
    otaBookingCode: "BCOM-12345678",
    fullName: "John Doe",
    email: "john.doe@example.com",
    phone: "+1234567890",
    startDate: "2024-06-01",
    endDate: "2024-06-05",
    amount: 500.0,
    currency: "USD",
    source: "BOOKING_COM",
    status: "CONFIRMED",
    hotelId: 1,
    roomTypeId: 14,
    integrationId: 1,
    guestDetails: {
      nationality: "US",
      specialRequests: "Late check-in requested",
    },
    channelData: {
      confirmationNumber: "BCOM-12345678",
    },
  },

  // PUT /bookings/:bookingCode - Update booking request body
  updateRequest: {
    status: "CHECKED_IN",
    amount: 520.0,
    currency: "USD",
    startDate: "2024-06-01",
    endDate: "2024-06-05",
  },
};

// ============================================================================
// 6. SYNC LOG SAMPLE DATA
// ============================================================================

export const sampleSyncLogs = {
  // GET /integrations/:id/sync-logs - List sync logs
  list: [
    {
      id: 1,
      integrationId: 1,
      operationType: SyncOperationType.AVAILABILITY_UPDATE,
      status: SyncStatus.SUCCESS,
      direction: SyncDirection.OUTBOUND,
      requestData: JSON.stringify({
        roomTypeId: 14,
        dates: ["2025-01-15", "2025-01-16"],
        availableRooms: 5,
      }),
      responseData: JSON.stringify({
        success: true,
        recordsUpdated: 2,
      }),
      errorMessage: null,
      errorCode: null,
      retryCount: 0,
      maxRetries: 3,
      processingTimeMs: 245,
      recordsProcessed: 2,
      recordsSuccess: 2,
      recordsFailed: 0,
      metadata: {
        roomTypeId: 14,
        dateRange: "2025-01-15 to 2025-01-16",
      },
      nextRetryAt: null,
      completedAt: new Date("2025-01-15T10:30:15.000Z"),
      createdAt: new Date("2025-01-15T10:30:00.000Z"),
      createdBy: 1,
    },
    {
      id: 2,
      integrationId: 1,
      operationType: SyncOperationType.RATE_UPDATE,
      status: SyncStatus.SUCCESS,
      direction: SyncDirection.OUTBOUND,
      requestData: JSON.stringify({
        ratePlanId: 1,
        baseRate: 150.0,
      }),
      responseData: JSON.stringify({
        success: true,
        ratePlanId: "BAR",
      }),
      errorMessage: null,
      errorCode: null,
      retryCount: 0,
      maxRetries: 3,
      processingTimeMs: 180,
      recordsProcessed: 1,
      recordsSuccess: 1,
      recordsFailed: 0,
      metadata: {
        ratePlanId: 1,
      },
      nextRetryAt: null,
      completedAt: new Date("2025-01-15T10:25:00.000Z"),
      createdAt: new Date("2025-01-15T10:24:45.000Z"),
      createdBy: 1,
    },
    {
      id: 3,
      integrationId: 1,
      operationType: SyncOperationType.FULL_SYNC,
      status: SyncStatus.PARTIAL_SUCCESS,
      direction: SyncDirection.OUTBOUND,
      requestData: JSON.stringify({
        syncType: "full",
        roomTypes: [14, 15],
      }),
      responseData: JSON.stringify({
        success: true,
        recordsUpdated: 58,
        recordsFailed: 2,
      }),
      errorMessage: "Failed to sync 2 availability records",
      errorCode: "SYNC_PARTIAL",
      retryCount: 1,
      maxRetries: 3,
      processingTimeMs: 5432,
      recordsProcessed: 60,
      recordsSuccess: 58,
      recordsFailed: 2,
      metadata: {
        syncType: "full",
        roomTypes: [14, 15],
      },
      nextRetryAt: new Date("2025-01-15T11:00:00.000Z"),
      completedAt: new Date("2025-01-15T10:30:00.000Z"),
      createdAt: new Date("2025-01-15T10:20:00.000Z"),
      createdBy: 1,
    },
    {
      id: 4,
      integrationId: 2,
      operationType: SyncOperationType.INVENTORY_UPDATE,
      status: SyncStatus.FAILED,
      direction: SyncDirection.OUTBOUND,
      requestData: JSON.stringify({
        roomTypeId: 14,
        totalRooms: 10,
      }),
      responseData: null,
      errorMessage: "API authentication failed",
      errorCode: "AUTH_ERROR",
      retryCount: 3,
      maxRetries: 3,
      processingTimeMs: 150,
      recordsProcessed: 0,
      recordsSuccess: 0,
      recordsFailed: 1,
      metadata: {
        roomTypeId: 14,
      },
      nextRetryAt: null,
      completedAt: new Date("2025-01-15T09:50:00.000Z"),
      createdAt: new Date("2025-01-15T09:45:00.000Z"),
      createdBy: 1,
    },
  ],

  // GET /integrations/:id/sync-statistics - Get sync statistics
  statistics: {
    totalSyncs: 150,
    successfulSyncs: 142,
    failedSyncs: 5,
    partialSuccessSyncs: 3,
    successRate: 94.67,
    averageProcessingTimeMs: 325,
    totalRecordsProcessed: 1250,
    totalRecordsSuccess: 1235,
    totalRecordsFailed: 15,
    lastSyncAt: new Date("2025-01-15T10:30:00.000Z"),
    lastSuccessfulSync: new Date("2025-01-15T10:30:00.000Z"),
    syncBreakdown: [
      {
        operationType: SyncOperationType.AVAILABILITY_UPDATE,
        count: 120,
        successCount: 115,
        failureCount: 3,
        partialCount: 2,
      },
      {
        operationType: SyncOperationType.RATE_UPDATE,
        count: 20,
        successCount: 20,
        failureCount: 0,
        partialCount: 0,
      },
      {
        operationType: SyncOperationType.FULL_SYNC,
        count: 10,
        successCount: 7,
        failureCount: 2,
        partialCount: 1,
      },
    ],
  },

  // POST /integrations/:id/sync - Trigger manual sync request body
  triggerSyncRequest: {
    operationType: "FULL_SYNC",
  },
};

// ============================================================================
// 7. DASHBOARD SAMPLE DATA
// ============================================================================

export const sampleDashboard = {
  // GET /dashboard/summary - Dashboard summary
  summary: {
    totalIntegrations: 3,
    activeIntegrations: 2,
    pendingIntegrations: 1,
    errorIntegrations: 0,
    channels: [
      {
        id: 1,
        name: "Booking.com Main Integration",
        type: ChannelType.BOOKING_COM,
        status: IntegrationStatus.ACTIVE,
        lastSync: new Date("2025-01-15T10:30:00.000Z"),
      },
      {
        id: 2,
        name: "Expedia Partner Integration",
        type: ChannelType.EXPEDIA,
        status: IntegrationStatus.ACTIVE,
        lastSync: new Date("2025-01-15T09:45:00.000Z"),
      },
      {
        id: 3,
        name: "Airbnb Calendar Sync",
        type: ChannelType.AIRBNB,
        status: IntegrationStatus.PENDING,
        lastSync: null,
      },
    ],
  },

  // GET /dashboard/performance - Performance metrics
  performance: [
    {
      integrationId: 1,
      channelName: "Booking.com Main Integration",
      channelType: ChannelType.BOOKING_COM,
      totalSyncs: 150,
      successfulSyncs: 142,
      failedSyncs: 5,
      partialSuccessSyncs: 3,
      successRate: 94.67,
      averageProcessingTimeMs: 325,
      totalRecordsProcessed: 1250,
      totalRecordsSuccess: 1235,
      totalRecordsFailed: 15,
      bookingsReceived: 25,
      bookingsConfirmed: 23,
      bookingsCanceled: 2,
      revenue: 12500.0,
      currency: "USD",
    },
    {
      integrationId: 2,
      channelName: "Expedia Partner Integration",
      channelType: ChannelType.EXPEDIA,
      totalSyncs: 85,
      successfulSyncs: 82,
      failedSyncs: 2,
      partialSuccessSyncs: 1,
      successRate: 96.47,
      averageProcessingTimeMs: 450,
      totalRecordsProcessed: 680,
      totalRecordsSuccess: 675,
      totalRecordsFailed: 5,
      bookingsReceived: 15,
      bookingsConfirmed: 15,
      bookingsCanceled: 0,
      revenue: 7800.0,
      currency: "USD",
    },
    {
      integrationId: 3,
      channelName: "Airbnb Calendar Sync",
      channelType: ChannelType.AIRBNB,
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      partialSuccessSyncs: 0,
      successRate: 0,
      averageProcessingTimeMs: 0,
      totalRecordsProcessed: 0,
      totalRecordsSuccess: 0,
      totalRecordsFailed: 0,
      bookingsReceived: 0,
      bookingsConfirmed: 0,
      bookingsCanceled: 0,
      revenue: 0.0,
      currency: "USD",
    },
  ],
};

// ============================================================================
// 8. CHANNEL INFORMATION SAMPLE DATA
// ============================================================================

export const sampleChannelInfo = {
  // GET /channels/supported - Supported channels
  supportedChannels: Object.values(ChannelType),

  // GET /channels/:type/features - Channel features
  features: {
    [ChannelType.BOOKING_COM]: [
      "real-time_sync",
      "webhooks",
      "multi_currency",
      "rate_updates",
      "availability_updates",
      "guest_management",
      "payment_processing",
    ],
    [ChannelType.EXPEDIA]: [
      "inventory_sync",
      "guest_management",
      "xml_api",
      "rate_updates",
      "availability_updates",
      "reporting",
    ],
    [ChannelType.AIRBNB]: [
      "calendar_sync",
      "instant_booking",
      "guest_communication",
      "price_updates",
      "availability_updates",
    ],
    [ChannelType.HOTELS_COM]: [
      "inventory_sync",
      "rate_updates",
      "availability_updates",
    ],
    [ChannelType.TRIPADVISOR]: [
      "business_listing",
      "review_management",
      "rating_updates",
    ],
    [ChannelType.AGODA]: [
      "inventory_sync",
      "rate_updates",
      "availability_updates",
      "guest_management",
    ],
    [ChannelType.HOTELBEDS]: [
      "inventory_sync",
      "rate_updates",
      "availability_updates",
      "booking_sync",
    ],
    [ChannelType.SEVEN]: [
      "webhooks",
      "reservation_sync",
      "availability_updates",
    ],
    [ChannelType.CORNICHE]: [
      "webhooks",
      "reservation_sync",
      "availability_updates",
    ],
    [ChannelType.CUSTOM]: ["custom_api", "webhooks", "full_control"],
  },
};

// ============================================================================
// 9. TESTING ENDPOINT SAMPLE DATA
// ============================================================================

export const sampleTesting = {
  // POST /integrations/:id/test - Test integration response
  testResponse: {
    success: true,
    error: null,
  },

  testResponseFailure: {
    success: false,
    error: "Invalid credentials. Please check your API key and secret.",
  },
};

// ============================================================================
// 10. WEBHOOK SAMPLE DATA
// ============================================================================

export const sampleWebhooks = {
  // POST /webhooks/:type - Webhook payloads
  sevenReservation: {
    hotelId: 1,
    event_type: "reservation",
    data: {
      room_type_id: "voyager-deluxe-plus",
      check_in: "2025-10-12",
      check_out: "2025-10-15",
      rooms: 1,
      guest: {
        name: "Frank George",
        email: "admin@7evensuites.com",
      },
    },
  },

  sevenCancellation: {
    hotelId: 1,
    event_type: "cancellation",
    data: {
      room_type_id: "voyager-deluxe-plus",
      check_in: "2025-10-12",
      check_out: "2025-10-15",
      rooms: 1,
      guest: {
        name: "Frank George",
        email: "admin@7evensuites.com",
      },
    },
  },

  sevenModification: {
    hotelId: 1,
    event_type: "modification",
    data: {
      room_type_id: "voyager-deluxe-plus",
      check_in: "2025-10-12",
      check_out: "2025-10-16",
      rooms: 2,
      guest: {
        name: "Frank George",
        email: "admin@7evensuites.com",
      },
    },
  },

  cornicheReservation: {
    hotelId: 1,
    event_type: "reservation",
    data: {
      room_type_id: "14",
      check_in: "2025-10-12",
      check_out: "2025-10-15",
      rooms: 1,
      guest: {
        name: "John Doe",
        email: "john.doe@example.com",
      },
    },
  },

  bookingComWebhook: {
    hotelId: 1,
    event_type: "booking_created",
    data: {
      booking_id: "BCOM-12345678",
      guest_name: "John Doe",
      guest_email: "john.doe@example.com",
      check_in: "2024-06-01",
      check_out: "2024-06-05",
      room_type: "STD-DOUBLE",
      amount: 500.0,
      currency: "USD",
    },
  },
};

// ============================================================================
// 11. GUEST OPERATIONS SAMPLE DATA
// ============================================================================

export const sampleGuestOperations = {
  // POST /guests/:guestId/check-in - Check-in response
  checkInResponse: {
    success: true,
    message: "Guest checked in successfully",
    bookingCode: "BK-2024-001",
    checkedInAt: new Date("2025-01-15T14:00:00.000Z"),
  },

  // POST /guests/:guestId/check-out - Check-out response
  checkOutResponse: {
    success: true,
    message: "Guest checked out successfully",
    bookingCode: "BK-2024-001",
    checkedOutAt: new Date("2025-01-18T11:00:00.000Z"),
  },
};

// ============================================================================
// EXPORT ALL SAMPLE DATA
// ============================================================================

export default {
  integrations: sampleChannelIntegrations,
  mappings: sampleChannelMappings,
  availability: sampleAvailability,
  ratePlans: sampleRatePlans,
  bookings: sampleBookings,
  syncLogs: sampleSyncLogs,
  dashboard: sampleDashboard,
  channelInfo: sampleChannelInfo,
  testing: sampleTesting,
  webhooks: sampleWebhooks,
  guestOperations: sampleGuestOperations,
};
