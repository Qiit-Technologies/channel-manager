import { Test, TestingModule } from "@nestjs/testing";
import { HttpService } from "@nestjs/axios";
import { of } from "rxjs";
import { HotelbedsApiService } from "./hotelbeds-api.service";
import {
  ChannelIntegration,
  ChannelType,
  IntegrationStatus,
} from "../../entities/channel-integration.entity";
import { ChannelMapping } from "../../entities/channel-mapping.entity";
import { ChannelAvailability } from "../../entities/channel-availability.entity";
import { ChannelRatePlan } from "../../entities/channel-rate-plan.entity";
import { AvailabilityStatus } from "../../entities/channel-availability.entity";

describe("HotelbedsApiService", () => {
  let service: HotelbedsApiService;
  let httpService: HttpService;

  const mockHttpService = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };

  const mockIntegration: Partial<ChannelIntegration> = {
    id: 1,
    hotelId: 1,
    channelType: ChannelType.HOTELBEDS,
    channelName: "Test Hotelbeds Integration",
    status: IntegrationStatus.ACTIVE,
    apiKey: "test-api-key",
    apiSecret: "test-api-secret",
    channelPropertyId: "12345",
  };

  const mockMapping: Partial<ChannelMapping> = {
    id: 1,
    channelRoomTypeName: "Test Room Type",
    channelRoomTypeId: "room-123",
  };

  const mockAvailability: Partial<ChannelAvailability> = {
    id: 1,
    integrationId: 1,
    roomtypeId: 1,
    date: new Date("2024-01-15"),
    availableRooms: 5,
    totalRooms: 10,
    status: AvailabilityStatus.AVAILABLE,
  };

  const mockRatePlan: Partial<ChannelRatePlan> = {
    id: 1,
    integrationId: 1,
    roomtypeId: 1,
    channelRatePlanName: "Test Rate Plan",
    channelRatePlanId: "rate-123",
    baseRate: 100.0,
    currency: "USD",
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HotelbedsApiService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<HotelbedsApiService>(HotelbedsApiService);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("testConnection", () => {
    it("should return success when credentials are valid", async () => {
      const mockResponse = {
        status: 200,
        statusText: "OK",
        data: { success: true },
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.testConnection(mockIntegration);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should return error when API key is missing", async () => {
      const integrationWithoutKey = { ...mockIntegration, apiKey: undefined };

      const result = await service.testConnection(integrationWithoutKey);

      expect(result.success).toBe(false);
      expect(result.error).toContain("API key is required");
    });

    it("should return error when API secret is missing", async () => {
      const integrationWithoutSecret = {
        ...mockIntegration,
        apiSecret: undefined,
      };

      const result = await service.testConnection(integrationWithoutSecret);

      expect(result.success).toBe(false);
      expect(result.error).toContain("API secret is required");
    });
  });

  describe("validateCredentials", () => {
    it("should return true for valid credentials", async () => {
      const mockResponse = {
        status: 200,
        statusText: "OK",
        data: { success: true },
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.validateCredentials(mockIntegration);

      expect(result).toBe(true);
    });

    it("should return false for missing credentials", async () => {
      const integrationWithoutCredentials = {
        ...mockIntegration,
        apiKey: undefined,
        apiSecret: undefined,
      };

      const result = await service.validateCredentials(
        integrationWithoutCredentials
      );

      expect(result).toBe(false);
    });
  });

  describe("getChannelInfo", () => {
    it("should return channel information", async () => {
      const mockResponse = {
        status: 200,
        statusText: "OK",
        data: { hotels: [] },
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getChannelInfo(
        mockIntegration as ChannelIntegration
      );

      expect(result.channelName).toBe("Hotelbeds");
      expect(result.apiVersion).toBe("1.0");
      expect(result.baseUrl).toBe("https://api.hotelbeds.com");
      expect(result.supportedFeatures).toContain("Real-time availability sync");
    });
  });

  describe("updateInventory", () => {
    it("should update inventory successfully", async () => {
      const mockResponse = {
        status: 200,
        statusText: "OK",
        data: { success: true },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      await expect(
        service.updateInventory(
          mockIntegration as ChannelIntegration,
          mockMapping as ChannelMapping
        )
      ).resolves.not.toThrow();
    });

    it("should throw error when credentials are missing", async () => {
      const integrationWithoutCredentials = {
        ...mockIntegration,
        apiKey: undefined,
        apiSecret: undefined,
      };

      await expect(
        service.updateInventory(
          integrationWithoutCredentials as ChannelIntegration,
          mockMapping as ChannelMapping
        )
      ).rejects.toThrow("API credentials are required");
    });
  });

  describe("updateRates", () => {
    it("should update rates successfully", async () => {
      const mockResponse = {
        status: 200,
        statusText: "OK",
        data: { success: true },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      await expect(
        service.updateRates(
          mockIntegration as ChannelIntegration,
          mockRatePlan as ChannelRatePlan
        )
      ).resolves.not.toThrow();
    });
  });

  describe("updateAvailability", () => {
    it("should update availability successfully", async () => {
      const mockResponse = {
        status: 200,
        statusText: "OK",
        data: { success: true },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      await expect(
        service.updateAvailability(
          mockIntegration as ChannelIntegration,
          mockAvailability as ChannelAvailability
        )
      ).resolves.not.toThrow();
    });
  });

  describe("processWebhook", () => {
    it("should process reservation created webhook", async () => {
      const webhookData = {
        type: "RESERVATION_CREATED",
        data: { guestId: "123", guestName: "John Doe" },
      };

      const result = await service.processWebhook(
        mockIntegration as ChannelIntegration,
        webhookData
      );

      expect(result.processed).toBe(true);
      expect(result.action).toBe("reservation_created");
    });

    it("should process unknown webhook type", async () => {
      const webhookData = {
        type: "UNKNOWN_TYPE",
        data: { guestId: "123" },
      };

      const result = await service.processWebhook(
        mockIntegration as ChannelIntegration,
        webhookData
      );

      expect(result.processed).toBe(false);
      expect(result.reason).toBe("Unknown webhook type");
    });
  });

  describe("createGuestReservation", () => {
    it("should create guest reservation successfully", async () => {
      const mockResponse = {
        status: 200,
        statusText: "OK",
        data: { reservationId: "res-123", status: "confirmed" },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const guestData = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        rateKey: "rate-123",
      };

      const result = await service.createGuestReservation(
        mockIntegration as ChannelIntegration,
        guestData
      );

      expect(result.reservationId).toBe("res-123");
      expect(result.status).toBe("confirmed");
    });
  });

  describe("updateGuestReservation", () => {
    it("should update guest reservation successfully", async () => {
      const mockResponse = {
        status: 200,
        statusText: "OK",
        data: { reservationId: "res-123", status: "updated" },
      };

      mockHttpService.put.mockReturnValue(of(mockResponse));

      const updates = {
        holder: { name: "John", surname: "Smith" },
        rooms: [],
      };

      const result = await service.updateGuestReservation(
        mockIntegration as ChannelIntegration,
        "res-123",
        updates
      );

      expect(result.reservationId).toBe("res-123");
      expect(result.status).toBe("updated");
    });
  });

  describe("cancelGuestReservation", () => {
    it("should cancel guest reservation successfully", async () => {
      const mockResponse = {
        status: 200,
        statusText: "OK",
        data: { reservationId: "res-123", status: "cancelled" },
      };

      mockHttpService.delete.mockReturnValue(of(mockResponse));

      const result = await service.cancelGuestReservation(
        mockIntegration as ChannelIntegration,
        "res-123"
      );

      expect(result.reservationId).toBe("res-123");
      expect(result.status).toBe("cancelled");
    });
  });
});

 
 