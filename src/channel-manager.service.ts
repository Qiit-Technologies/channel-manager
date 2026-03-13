import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { WakanowWebhookPayloadDto } from "./dto/wakanow-webhook-payload.dto";
import { CreateExternalBookingDto } from "./dto/create-external-booking.dto";
import { ChannelManagerRepository } from "./channel-manager.repository";
import { CreateChannelIntegrationDto } from "./dto/create-channel-integration.dto";
import { CreateChannelMappingDto } from "./dto/create-channel-mapping.dto";
import { SyncAvailabilityDto } from "./dto/sync-availability.dto";
import {
  ChannelIntegration,
  IntegrationStatus,
  ChannelType,
} from "./entities/channel-integration.entity";
import { ChannelMapping } from "./entities/channel-mapping.entity";
import {
  ChannelAvailability,
  AvailabilityStatus,
} from "./entities/channel-availability.entity";
import { HotelWebhook } from "./entities/hotel-webhook.entity";
import {
  ChannelSyncLog,
  SyncOperationType,
} from "./entities/channel-sync-log.entity";
import { ChannelRatePlan } from "./entities/channel-rate-plan.entity";
// Note: These entities will be loaded from Anli database
// Hotel, Roomtype, and Guest entities are imported from Anli
import { ChannelApiFactory } from "./api/channel-api-factory.service";
import { WebhookService, WebhookEventType } from "./services/webhook.service";
import { BookingStatus } from "./entities/guest.entity";
import { OtaConfigurationService } from "./services/ota-configuration.service";
import { OreonHotelClient } from "./services/oreon-hotel-client.service";
import { PmsReservationClient } from "./services/pms-reservation-client.service";
import { HotelRegistrationSource } from "./dto/create-hotel.dto";
import { ChannelSyncEngine } from "./sync/channel-sync-engine.service";
import { PmsSyncService } from "./services/pms-sync.service";

// Anli entity imports - these will be loaded from the Anli database
// We'll use type annotations to ensure compatibility

@Injectable()
export class ChannelManagerService {
  private readonly logger = new Logger(ChannelManagerService.name);

  constructor(
    private readonly channelManagerRepository: ChannelManagerRepository,
    private readonly channelSyncEngine: ChannelSyncEngine,
    private readonly channelApiFactory: ChannelApiFactory,
    private readonly otaConfigurationService: OtaConfigurationService,
    private readonly oreonHotelClient: OreonHotelClient,
    private readonly pmsReservationClient: PmsReservationClient,
    private readonly webhookService: WebhookService,
    private readonly pmsSyncService: PmsSyncService,
  ) {}

  // Hotel Management Methods
  async getHotelsByRegistrationSource(
    registrationSource?: string,
  ): Promise<{ count: number; hotels: any[] }> {
    return this.oreonHotelClient.getHotelsByRegistrationSource(
      registrationSource,
    );
  }

  async searchHotels(
    name?: string,
    email?: string,
  ): Promise<{ count: number; hotels: any[] }> {
    return this.oreonHotelClient.searchHotels(name, email);
  }

  async createRoomType(roomTypeData: any) {
    return this.oreonHotelClient.createRoomType(roomTypeData);
  }

  async createRoom(roomData: any) {
    return this.oreonHotelClient.createRoom(roomData);
  }

  async getHotelRoomTypes(hotelId: number) {
    return this.oreonHotelClient.getHotelRoomTypes(hotelId);
  }

  // Channel Integration Management
  async createChannelIntegration(
    dto: CreateChannelIntegrationDto,
    userId: number,
  ): Promise<ChannelIntegration> {
    try {
      let hotelId: number;

      // Handle hotel onboarding if hotelId is not provided
      if (!dto.hotelId) {
        if (!dto.hotel) {
          throw new HttpException(
            "Either hotelId or hotel information must be provided",
            HttpStatus.BAD_REQUEST,
          );
        }

        this.logger.log(
          `Onboarding new hotel: ${dto.hotel.name} for channel integration`,
        );

        // Pass registration source from integration DTO to hotel DTO if provided
        const hotelData = {
          ...dto.hotel,
          registrationSource:
            dto.hotel.registrationSource ||
            HotelRegistrationSource.CHANNEL_MANAGER,
        };

        // Create the hotel in Oreon PMS via API
        const newHotel = await this.oreonHotelClient.createHotel(hotelData);
        hotelId = newHotel.id;

        this.logger.log(
          `Created new hotel in Oreon with ID: ${hotelId} for channel integration`,
        );
      } else {
        hotelId = dto.hotelId;
        // Note: Hotel verification should be done via Oreon API
        // For now, we assume the hotelId is valid if provided
        this.logger.log(
          `Using existing hotel ID: ${hotelId} for channel integration`,
        );
      }

      // Check if hotel already has an integration of this type
      const existingIntegration =
        await this.channelManagerRepository.findIntegrationByHotelAndType(
          hotelId,
          dto.channelType,
        );

      if (existingIntegration) {
        throw new HttpException(
          `Hotel already has a ${dto.channelType} integration`,
          HttpStatus.CONFLICT,
        );
      }

      // Generate property ID if not provided
      if (!dto.channelPropertyId) {
        dto.channelPropertyId = this.generatePropertyId(
          hotelId,
          dto.channelType as string,
        );
      }

      // Test the integration using centralized OTA config
      this.logger.log(
        `NODE_ENV: ${process.env.NODE_ENV}, running connection test...`,
      );

      const testResult = await this.testChannelIntegration(dto);
      if (!testResult.success) {
        throw new HttpException(
          `Integration test failed: ${testResult.error}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const integration = await this.channelManagerRepository.createIntegration(
        {
          ...dto,
          hotelId, // Use the resolved hotelId
          createdBy: userId,
          status: dto.status || IntegrationStatus.PENDING,
        },
      );

      // Auto-setup integration using PMS data
      await this.autoSetupIntegration(integration);

      this.logger.log(
        `Created channel integration: ${integration.channelName} for hotel ID: ${hotelId}`,
      );
      return integration;
    } catch (error) {
      this.logger.error(
        `Failed to create channel integration: ${error.message}`,
      );
      throw error;
    }
  }

  async getChannelIntegrations(hotelId: number): Promise<ChannelIntegration[]> {
    return await this.channelManagerRepository.findIntegrationsByHotel(hotelId);
  }

  async getAllIntegrations(): Promise<ChannelIntegration[]> {
    return await this.channelManagerRepository.findActiveIntegrations();
  }

  async getChannelIntegration(id: number): Promise<ChannelIntegration> {
    const integration =
      await this.channelManagerRepository.findIntegrationById(id);
    if (!integration) {
      throw new HttpException(
        "Channel integration not found",
        HttpStatus.NOT_FOUND,
      );
    }
    return integration;
  }

  async updateChannelIntegration(
    id: number,
    updates: Partial<ChannelIntegration>,
    userId: number,
  ): Promise<ChannelIntegration> {
    const integration = await this.getChannelIntegration(id);

    // If updating channel type, check for duplicates and test the integration
    if (
      updates.channelType &&
      updates.channelType !== integration.channelType
    ) {
      // Check if hotel already has another integration of this type
      const existingIntegration =
        await this.channelManagerRepository.findIntegrationByHotelAndType(
          integration.hotelId,
          updates.channelType,
        );

      if (existingIntegration && existingIntegration.id !== id) {
        throw new HttpException(
          `Hotel already has a ${updates.channelType} integration`,
          HttpStatus.CONFLICT,
        );
      }

      // Test the integration using centralized OTA config
      const testResult = await this.testChannelIntegration(updates);
      if (!testResult.success) {
        throw new HttpException(
          `Integration test failed: ${testResult.error}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const updatedIntegration =
      await this.channelManagerRepository.updateIntegration(id, {
        ...updates,
        updatedBy: userId,
      });

    this.logger.log(
      `Updated channel integration: ${updatedIntegration.channelName}`,
    );
    return updatedIntegration;
  }
  async deleteChannelIntegration(id: number): Promise<void> {
    const integration = await this.getChannelIntegration(id);
    await this.channelManagerRepository.deleteIntegration(id);
    this.logger.log(`Deleted channel integration: ${integration.channelName}`);
  }

  // Hotel Webhook Management
  async getHotelWebhook(hotelId: number): Promise<HotelWebhook | null> {
    return await this.channelManagerRepository.findHotelWebhook(hotelId);
  }

  async updateHotelWebhook(
    hotelId: number,
    updates: Partial<HotelWebhook>,
  ): Promise<HotelWebhook> {
    const webhook = await this.channelManagerRepository.updateHotelWebhook(
      hotelId,
      updates,
    );
    this.logger.log(`Updated hotel webhook for hotel ID: ${hotelId}`);
    return webhook;
  }

  async triggerWebhookTest(
    hotelId: number,
    eventType: WebhookEventType,
  ): Promise<{ success: boolean; message: string }> {
    const config = await this.getHotelWebhook(hotelId);
    if (!config || !config.isEnabled || !config.url) {
      throw new HttpException(
        "Webhook not configured or disabled for this hotel",
        HttpStatus.BAD_REQUEST,
      );
    }

    // Prepare sample data based on event type
    let testData: any = {
      test: true,
      message: `This is a test notification for ${eventType}`,
      generatedAt: new Date().toISOString(),
    };

    if (eventType.startsWith("BOOKING_")) {
      testData = {
        ...testData,
        bookingCode: "TEST-BK-123456",
        otaBookingCode: "OTA-TEST-999",
        guestName: "Test Guest",
        amount: 15000.0,
        currency: "NGN",
        startDate: "2026-06-01",
        endDate: "2026-06-05",
      };
    } else if (eventType.includes("AVAILABILITY")) {
      testData = {
        ...testData,
        roomTypeId: 10,
        date: "2026-06-10",
        availableRooms: 5,
        status: "AVAILABLE",
      };
    }

    await this.webhookService.notifyHotel(config, eventType, testData);
    return {
      success: true,
      message: `Test webhook for ${eventType} sent to ${config.url}`,
    };
  }

  // Channel Mapping Management
  async createChannelMapping(
    dto: CreateChannelMappingDto,
    userId: number,
  ): Promise<ChannelMapping> {
    try {
      // Verify integration exists
      //   const integration = await this.getChannelIntegration(dto.integrationId);

      // Note: Room type verification will be handled by Anli's existing validation
      // For now, we assume the roomtypeId is valid

      const mapping = await this.channelManagerRepository.createMapping({
        ...dto,
        createdBy: userId,
      });

      this.logger.log(
        `Created channel mapping for room type ID: ${dto.roomtypeId}`,
      );
      return mapping;
    } catch (error) {
      this.logger.error(`Failed to create channel mapping: ${error.message}`);
      throw error;
    }
  }

  async getChannelMappings(integrationId: number): Promise<ChannelMapping[]> {
    return await this.channelManagerRepository.findMappingsByIntegration(
      integrationId,
    );
  }

  async updateChannelMapping(
    id: number,
    updates: Partial<ChannelMapping>,
    userId: number,
  ): Promise<ChannelMapping> {
    const mapping = await this.channelManagerRepository.findMappingById(id);
    if (!mapping) {
      throw new HttpException(
        "Channel mapping not found",
        HttpStatus.NOT_FOUND,
      );
    }

    const updatedMapping = await this.channelManagerRepository.updateMapping(
      id,
      {
        ...updates,
        updatedBy: userId,
      },
    );

    this.logger.log(
      `Updated channel mapping: ${updatedMapping.channelRoomTypeName}`,
    );
    return updatedMapping;
  }

  // Availability Management
  async syncAvailability(dto: SyncAvailabilityDto): Promise<any> {
    try {
      const integration = await this.getChannelIntegration(dto.integrationId);

      const updates =
        dto.updates && dto.updates.length > 0
          ? dto.updates
          : [
              {
                roomtypeId: dto.roomtypeId,
                roomTypeId: dto.roomTypeId,
                date: dto.date,
                availableRooms: dto.availableRooms,
                status: dto.status,
                totalRooms: dto.totalRooms,
                occupiedRooms: dto.occupiedRooms,
                blockedRooms: dto.blockedRooms,
                maintenanceRooms: dto.maintenanceRooms,
                rate: dto.rate,
                currency: dto.currency,
                isClosed: dto.isClosed,
                closeReason: dto.closeReason,
                restrictions: dto.restrictions,
                channelData: dto.channelData,
              },
            ];

      const results = [];
      for (const update of updates) {
        const roomtypeId =
          update.roomtypeId ||
          update.roomTypeId ||
          dto.roomtypeId ||
          dto.roomTypeId;
        const dateString = update.date || dto.date;

        if (!roomtypeId || !dateString) {
          this.logger.warn(
            `Skipping availability update: missing roomtypeId or date`,
          );
          continue;
        }

        // Create or update availability record
        const availability =
          await this.channelManagerRepository.findAvailabilityByDateRange(
            dto.integrationId,
            roomtypeId,
            new Date(dateString),
            new Date(dateString),
          );

        let result;
        const recordData = {
          ...update,
          roomtypeId,
          integrationId: dto.integrationId,
          date: new Date(dateString),
        };

        // Remove the roomTypeId alias before saving to DB to avoid extra field errors
        delete (recordData as any).roomTypeId;

        if (availability.length > 0) {
          result = await this.channelManagerRepository.updateAvailability(
            availability[0].id,
            recordData,
          );
        } else {
          result =
            await this.channelManagerRepository.createAvailability(recordData);
        }

        // Trigger real-time sync if enabled
        if (integration.isRealTimeSync) {
          try {
            await this.channelSyncEngine.syncAvailabilityToChannel(result);
          } catch (syncError) {
            this.logger.error(
              `Real-time sync failed for integration ${dto.integrationId}: ${syncError.message}`,
            );
          }
        }

        // Notify global webhooks
        await this.webhookService.broadcast(
          integration.hotelId,
          WebhookEventType.AVAILABILITY_CHANGE,
          result,
        );

        if (update.rate || dto.rate) {
          await this.webhookService.broadcast(
            integration.hotelId,
            WebhookEventType.RATE_CHANGE,
            {
              roomtypeId,
              date: dateString,
              rate: update.rate || dto.rate,
              currency: update.currency || dto.currency,
            },
          );
        }

        results.push(result);
      }

      return results.length === 1 && !dto.updates ? results[0] : results;
    } catch (error) {
      this.logger.error(`Failed to sync availability: ${error.message}`);
      throw error;
    }
  }

  async getAvailabilityByDateRange(
    integrationId: number,
    roomtypeId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<ChannelAvailability[]> {
    return await this.channelManagerRepository.findAvailabilityByDateRange(
      integrationId,
      roomtypeId,
      startDate,
      endDate,
    );
  }

  // Rate Management
  async createChannelRatePlan(
    ratePlan: Partial<ChannelRatePlan>,
    userId: number,
  ): Promise<ChannelRatePlan> {
    const newRatePlan = await this.channelManagerRepository.createRatePlan({
      ...ratePlan,
      createdBy: userId,
    });

    this.logger.log(
      `Created channel rate plan: ${newRatePlan.channelRatePlanName}`,
    );
    return newRatePlan;
  }

  async getChannelRatePlans(integrationId: number): Promise<ChannelRatePlan[]> {
    return await this.channelManagerRepository.findRatePlansByIntegration(
      integrationId,
    );
  }

  async updateChannelRatePlan(
    id: number,
    updates: Partial<ChannelRatePlan>,
    userId: number,
  ): Promise<ChannelRatePlan> {
    try {
      const ratePlan = await this.channelManagerRepository.updateRatePlan(id, {
        ...updates,
        updatedBy: userId,
      });

      if (!ratePlan) {
        throw new HttpException(
          `Rate plan with ID ${id} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      this.logger.log(
        `Updated channel rate plan: ${ratePlan.channelRatePlanName}`,
      );
      return ratePlan;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Failed to update rate plan: ${error.message}`);
      throw new HttpException(
        `Failed to update rate plan: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Sync Management
  async triggerManualSync(
    integrationId: number,
    operationType: SyncOperationType,
  ): Promise<void> {
    const integration = await this.getChannelIntegration(integrationId);

    if (integration.status !== IntegrationStatus.ACTIVE) {
      throw new HttpException(
        "Integration is not active",
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.channelSyncEngine.triggerSync(integration, operationType);
    this.logger.log(
      `Manual sync triggered for integration: ${integration.channelName}`,
    );
  }

  // Inbound webhook handling by hotel and channel type
  async handleIncomingWebhookByHotelAndType(
    hotelId: number,
    channelType: ChannelType,
    webhookData: any,
  ): Promise<void> {
    const integration =
      await this.channelManagerRepository.findIntegrationByHotelAndType(
        hotelId,
        channelType,
      );

    if (!integration) {
      throw new HttpException(
        `Channel integration not found for hotelId=${hotelId} and type=${channelType}`,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.channelSyncEngine.handleIncomingWebhook(
      integration,
      webhookData,
    );
  }

  async getSyncLogs(
    integrationId: number,
    limit: number = 100,
  ): Promise<ChannelSyncLog[]> {
    return await this.channelManagerRepository.findSyncLogsByIntegration(
      integrationId,
      limit,
    );
  }

  async getSyncStatistics(
    integrationId: number,
    days: number = 7,
  ): Promise<any> {
    return await this.channelManagerRepository.getSyncStatistics(
      integrationId,
      days,
    );
  }

  // Testing and Validation
  async createExternalBooking(dto: CreateExternalBookingDto): Promise<any> {
    this.logger.log(
      `Creating external booking from ${dto.source}: ${dto.externalConfirmId}`,
    );

    // Validate Hotel exists via Oreon Client
    // We assume ChannelManagerService has access to this, if not we'll use a direct PmsReservationClient approach
    // or we skip strictly checking hotel existence if PmsReservationClient handles it.

    // Map to Oreon Guest DTO structure
    // Map to Oreon PartnerCreateBookingDto structure
    // This strictly follows PartnerCreateBookingDto in Oreon
    const guestReservationDto = {
      propertyReference: `REF-${dto.hotelId}`,
      fullName:
        (dto.guest as any).fullName ||
        [dto.guest.firstName, dto.guest.lastName]
          .filter(Boolean)
          .join(" ")
          .trim() ||
        dto.guest.email?.split("@")[0] ||
        "Guest",
      email: dto.guest.email,
      phoneNumber: dto.guest.phoneNumber,
      roomTypeId: Number(dto.roomTypeId),
      roomNumber: dto.roomNumber,
      checkInDate: dto.checkInDate,
      checkOutDate: dto.checkOutDate,
      numberOfGuests: dto.quantity || 1,
      amount: dto.totalPrice,
      amountPaid: dto.totalPrice, // External bookings are treated as prepaid
      bookingSource: dto.source,
      otaBookingCode: dto.externalConfirmId,
      sourceReservationId: dto.externalConfirmId,
      bookingStatus: "CONFIRMED",
    };

    try {
      const result = await this.pmsReservationClient.createGuestReservation(
        dto.hotelId,
        guestReservationDto,
      );

      if (!result.success) {
        throw new HttpException(
          `PMS Booking failed: ${result.error}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const bookingId =
        result.data?.bookingCode || result.data?.id || "UNKNOWN";
      this.logger.log(`External booking created successfully: ${bookingId}`);

      return {
        success: true,
        bookingReference: bookingId,
        sourceReference: dto.externalConfirmId,
        status: "CONFIRMED",
      };
    } catch (error) {
      this.logger.error(`Booking creation failed: ${error.message}`);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async testChannelIntegration(
    integration: Partial<ChannelIntegration>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("integration", integration);
      // Get the OTA configuration for this channel type
      const otaConfig = await this.otaConfigurationService.getConfiguration(
        integration.channelType,
      );
      console.log("otaConfig", otaConfig);
      if (!otaConfig || !otaConfig.apiKey) {
        return {
          success: false,
          error: `No API key configured for ${integration.channelType}. Please configure the OTA credentials first.`,
        };
      }

      // Use the credentials from the integration parameter (user-provided credentials)
      // Only fall back to OTA config if the integration doesn't have credentials
      const testIntegration = {
        ...integration,
        apiKey: integration.apiKey || otaConfig.apiKey,
        apiSecret: integration.apiSecret || otaConfig.apiSecret,
        accessToken: integration.accessToken || otaConfig.accessToken,
        refreshToken: integration.refreshToken || otaConfig.refreshToken,
      };

      const channelApi = this.channelApiFactory.createChannelApi(
        integration.channelType,
      );
      const testResult = await channelApi.testConnection(testIntegration);

      if (testResult.success) {
        this.logger.log(
          `Integration test successful for ${integration.channelType}`,
        );
        return { success: true };
      } else {
        return { success: false, error: testResult.error };
      }
    } catch (error) {
      this.logger.error(`Integration test failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // Scheduled Tasks
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleScheduledSync(): Promise<void> {
    try {
      const integrationsNeedingSync =
        await this.channelManagerRepository.findIntegrationsNeedingSync();

      for (const integration of integrationsNeedingSync) {
        try {
          await this.channelSyncEngine.triggerSync(
            integration,
            SyncOperationType.FULL_SYNC,
          );
          this.logger.log(
            `Scheduled sync completed for: ${integration.channelName}`,
          );
        } catch (error) {
          this.logger.error(
            `Scheduled sync failed for ${integration.channelName}: ${error.message}`,
          );

          // Update integration status if sync fails repeatedly
          await this.channelManagerRepository.updateIntegration(
            integration.id,
            {
              status: IntegrationStatus.ERROR,
              errorMessage: error.message,
            },
          );
        }
      }
    } catch (error) {
      this.logger.error(`Scheduled sync task failed: ${error.message}`);
    }
  }

  // Guest Integration (instead of bookings)
  // Note: These methods will be called by Anli when guest status changes
  // For now, they're placeholders that can be implemented later
  async handleGuestCheckIn(guestId: number): Promise<void> {
    try {
      this.logger.log(`Guest check-in triggered for guest ID: ${guestId}`);
      const guest = await this.channelManagerRepository.findGuestById(guestId);
      if (guest) {
        await this.pmsSyncService.handleGuestCheckIn(guestId, guest.hotelId);
      } else {
        this.logger.warn(`Guest ${guestId} not found for check-in`);
      }
    } catch (error) {
      this.logger.error(`Failed to handle guest check-in: ${error.message}`);
    }
  }

  async handleGuestCheckOut(guestId: number): Promise<void> {
    try {
      this.logger.log(`Guest check-out triggered for guest ID: ${guestId}`);
      const guest = await this.channelManagerRepository.findGuestById(guestId);
      if (guest) {
        await this.pmsSyncService.handleGuestCheckOut(guestId, guest.hotelId);
      } else {
        this.logger.warn(`Guest ${guestId} not found for check-out`);
      }
    } catch (error) {
      this.logger.error(`Failed to handle guest check-out: ${error.message}`);
    }
  }

  async handleGuestNoShow(guestId: number): Promise<void> {
    try {
      this.logger.log(`Guest no-show triggered for guest ID: ${guestId}`);
      const guest = await this.channelManagerRepository.findGuestById(guestId);
      if (guest) {
        await this.pmsSyncService.handleGuestNoShow(guestId, guest.hotelId);
      } else {
        this.logger.warn(`Guest ${guestId} not found for no-show`);
      }
    } catch (error) {
      this.logger.error(`Failed to handle guest no-show: ${error.message}`);
    }
  }

  // Auto-setup integration using Anli data
  private async autoSetupIntegration(
    integration: ChannelIntegration,
  ): Promise<void> {
    try {
      this.logger.log(
        `Starting auto-setup for integration: ${integration.channelName}`,
      );

      // 1. Auto-create room type mappings
      await this.autoCreateRoomTypeMappings(integration);

      // 2. Auto-setup availability sync
      await this.autoSetupAvailabilitySync(integration);

      // 3. Auto-setup rate sync
      await this.autoSetupRateSync(integration);

      // 4. Update integration status to ACTIVE
      await this.channelManagerRepository.updateIntegration(integration.id, {
        status: IntegrationStatus.ACTIVE,
      });

      this.logger.log(
        `Auto-setup completed for integration: ${integration.channelName}`,
      );
    } catch (error) {
      this.logger.error(
        `Auto-setup failed for integration ${integration.channelName}: ${error.message}`,
      );

      // Update integration status to ERROR if auto-setup fails
      await this.channelManagerRepository.updateIntegration(integration.id, {
        status: IntegrationStatus.ERROR,
        errorMessage: `Auto-setup failed: ${error.message}`,
      });

      throw error;
    }
  }

  // Auto-create room type mappings from PMS data
  private async autoCreateRoomTypeMappings(
    integration: ChannelIntegration,
  ): Promise<void> {
    try {
      // TODO: Read room types from PMS database
      // For now, we'll create placeholder mappings
      // This will be implemented when PMS integration is complete

      this.logger.log(
        `Auto-creating room type mappings for integration: ${integration.id}`,
      );

      // Placeholder: Create default room type mapping
      const defaultMapping = {
        integrationId: integration.id,
        roomtypeId: 1, // TODO: Get from PMS
        channelRoomTypeId: `${integration.channelPropertyId}_ROOM1`,
        channelRoomTypeName: "Standard Room", // TODO: Get from PMS
        channelAmenities: ["WiFi", "AC", "TV"], // TODO: Get from PMS
        channelDescription: "Comfortable standard room", // TODO: Get from PMS
        isActive: true,
      };

      await this.channelManagerRepository.createMapping(defaultMapping);
      this.logger.log(
        `Created default room type mapping for integration: ${integration.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to auto-create room type mappings: ${error.message}`,
      );
      throw error;
    }
  }

  // Auto-setup availability sync
  private async autoSetupAvailabilitySync(
    integration: ChannelIntegration,
  ): Promise<void> {
    try {
      this.logger.log(
        `Setting up availability sync for integration: ${integration.id}`,
      );

      // TODO: Read room inventory from PMS and create availability records
      // For now, create placeholder availability

      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      // Create availability for next 30 days
      for (
        let d = new Date(today);
        d <= nextMonth;
        d.setDate(d.getDate() + 1)
      ) {
        const availability = {
          integrationId: integration.id,
          roomtypeId: 1, // TODO: Get from PMS
          date: new Date(d),
          availableRooms: 10, // TODO: Get from PMS
          totalRooms: 10, // TODO: Get from PMS
          rate: 100.0, // TODO: Get from PMS
          currency: "USD", // TODO: Get from PMS
        };

        await this.channelManagerRepository.createAvailability(availability);
      }

      this.logger.log(
        `Availability sync setup completed for integration: ${integration.id}`,
      );
    } catch (error) {
      this.logger.error(`Failed to setup availability sync: ${error.message}`);
      throw error;
    }
  }

  // Auto-setup rate sync
  private async autoSetupRateSync(
    integration: ChannelIntegration,
  ): Promise<void> {
    try {
      this.logger.log(
        `Setting up rate sync for integration: ${integration.id}`,
      );

      // TODO: Read rate plans from PMS and create channel rate plans
      // For now, create placeholder rate plan

      const defaultRatePlan = {
        integrationId: integration.id,
        roomtypeId: 1, // TODO: Get from PMS
        channelRatePlanId: `${integration.channelPropertyId}_RATE1`,
        channelRatePlanName: "Standard Rate", // TODO: Get from PMS
        baseRate: 100.0, // TODO: Get from PMS
        currency: "USD", // TODO: Get from PMS
        isActive: true,
      };

      await this.channelManagerRepository.createRatePlan(defaultRatePlan);
      this.logger.log(
        `Rate sync setup completed for integration: ${integration.id}`,
      );
    } catch (error) {
      this.logger.error(`Failed to setup rate sync: ${error.message}`);
      throw error;
    }
  }

  // Get available integration types for a hotel
  async getAvailableIntegrationTypes(hotelId: number): Promise<ChannelType[]> {
    try {
      const existingIntegrations =
        await this.channelManagerRepository.findIntegrationsByHotel(hotelId);
      const existingTypes = existingIntegrations.map(
        (integration) => integration.channelType,
      );

      // Return all channel types that the hotel doesn't have
      const allTypes = Object.values(ChannelType);
      return allTypes.filter((type) => !existingTypes.includes(type));
    } catch (error) {
      this.logger.error(
        `Failed to get available integration types: ${error.message}`,
      );
      throw error;
    }
  }

  // Property ID generation for hotels
  private generatePropertyId(hotelId: number, channelType: string): string {
    const timestamp = Date.now().toString(36);
    const hotelPrefix = `H${hotelId}`;
    const channelPrefix = channelType.replace("_", "").substring(0, 1);
    return `${hotelPrefix}${channelPrefix}${timestamp}`.toUpperCase();
  }

  private async updateAvailabilityForGuest(
    integration: ChannelIntegration,
    guest: any,
  ): Promise<void> {
    try {
      const startDate = new Date(guest.startDate);
      const endDate = new Date(guest.endDate);

      // Update availability for each date in the guest's stay
      for (
        let date = new Date(startDate);
        date < endDate;
        date.setDate(date.getDate() + 1)
      ) {
        const availability =
          await this.channelManagerRepository.findAvailabilityByDateRange(
            integration.id,
            guest.roomTypeId,
            date,
            date,
          );

        if (availability.length > 0) {
          const currentAvailability = availability[0];
          const newOccupiedRooms = Math.max(
            0,
            currentAvailability.occupiedRooms - 1,
          );
          const newAvailableRooms =
            currentAvailability.totalRooms - newOccupiedRooms;

          await this.channelManagerRepository.updateAvailability(
            currentAvailability.id,
            {
              occupiedRooms: newOccupiedRooms,
              availableRooms: newAvailableRooms,
              status:
                newAvailableRooms > 0
                  ? AvailabilityStatus.AVAILABLE
                  : AvailabilityStatus.UNAVAILABLE,
            },
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to update availability for guest: ${error.message}`,
      );
    }
  }

  // Booking Management Methods
  async getBookings(dto: any): Promise<{ bookings: any[]; total: number }> {
    try {
      const [bookings, total] =
        await this.channelManagerRepository.findBookings(dto);
      return { bookings, total };
    } catch (error) {
      this.logger.error(`Failed to get bookings: ${error.message}`);
      throw new HttpException(
        `Failed to retrieve bookings: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getBookingByCode(bookingCode: string): Promise<any> {
    try {
      const booking =
        await this.channelManagerRepository.findBookingByCode(bookingCode);
      if (!booking) {
        throw new HttpException(
          `Booking with code ${bookingCode} not found`,
          HttpStatus.NOT_FOUND,
        );
      }
      return booking;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Failed to get booking: ${error.message}`);
      throw new HttpException(
        `Failed to retrieve booking: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createBooking(bookingData: any): Promise<any> {
    try {
      // Map incoming fields to database schema names strictly matching Guest entity
      const mappedData = {
        ...bookingData,
        fullName:
          bookingData.fullName ||
          bookingData.name ||
          bookingData.guestName ||
          (bookingData.guest && bookingData.guest.fullName) ||
          (bookingData.guest &&
            [bookingData.guest.firstName, bookingData.guest.lastName]
              .filter(Boolean)
              .join(" ")
              .trim()) ||
          undefined,
        email:
          bookingData.email || (bookingData.guest && bookingData.guest.email),
        phoneNumber:
          bookingData.phoneNumber ||
          bookingData.phone ||
          (bookingData.guest && bookingData.guest.phoneNumber),
        startDate:
          bookingData.startDate ||
          bookingData.checkInDate ||
          bookingData.checkIn,
        endDate:
          bookingData.endDate ||
          bookingData.checkOutDate ||
          bookingData.checkOut,
        roomtypeId:
          bookingData.roomtypeId ||
          bookingData.roomTypeId ||
          bookingData.roomType,
        bookingAmount:
          bookingData.bookingAmount ||
          bookingData.amount ||
          bookingData.totalPrice,
        amountPaid:
          bookingData.amountPaid ||
          bookingData.bookingAmount ||
          bookingData.amount ||
          bookingData.totalPrice,
        outstanding: 0,
        bookingSource: bookingData.bookingSource || bookingData.source,
        bookingStatus: bookingData.bookingStatus || bookingData.status,
        property: bookingData.property || bookingData.propertyName,
        propertyReference:
          bookingData.propertyReference ||
          bookingData.propertyRef ||
          `REF-${bookingData.hotelId}`,
        otaBookingCode:
          bookingData.otaBookingCode || bookingData.externalConfirmId,
      };

      // Remove non-existent field names to avoid TypeORM database errors
      delete mappedData.amount;
      delete mappedData.source;
      delete mappedData.status;
      delete mappedData.phone;
      delete mappedData.roomTypeId;
      delete mappedData.roomType;
      delete mappedData.checkInDate;
      delete mappedData.checkOutDate;
      delete mappedData.checkIn;
      delete mappedData.checkOut;
      delete mappedData.totalPrice;
      delete mappedData.externalConfirmId;
      delete mappedData.currency;
      delete mappedData.integrationId;
      delete mappedData.guestDetails;
      delete mappedData.channelData;
      delete mappedData.cancelReason;
      delete mappedData.canceledAt;
      delete mappedData.guest;

      // 1. Save to channel manager DB (Idempotent: check for existing)
      let saved: any;
      const existingByCode = mappedData.bookingCode
        ? await this.channelManagerRepository.findBookingByCode(
            mappedData.bookingCode,
          )
        : null;
      const existingByOta =
        !existingByCode && mappedData.otaBookingCode
          ? await this.channelManagerRepository.findBookingByOtaCode(
              mappedData.otaBookingCode,
            )
          : null;

      const existing = existingByCode || existingByOta;

      if (existing) {
        this.logger.log(
          `[createBooking] Updating existing booking: ${existing.bookingCode}`,
        );
        saved = await this.channelManagerRepository.updateBooking(
          existing.bookingCode,
          mappedData,
        );
      } else {
        saved = await this.channelManagerRepository.createBooking(mappedData);
      }

      // 2. Forward to Oreon PMS
      const oreonPayload = {
        propertyReference: mappedData.propertyReference,
        fullName: mappedData.fullName,
        email: mappedData.email,
        phoneNumber: mappedData.phoneNumber,
        roomTypeId: mappedData.roomtypeId
          ? Number(mappedData.roomtypeId)
          : undefined,
        roomNumber: mappedData.roomNumber,
        checkInDate:
          bookingData.checkInDate ||
          bookingData.checkIn ||
          bookingData.startDate,
        checkOutDate:
          bookingData.checkOutDate ||
          bookingData.checkOut ||
          bookingData.endDate,
        bookingCode: mappedData.bookingCode,
        otaBookingCode: mappedData.otaBookingCode,
        bookingStatus: mappedData.bookingStatus,
        bookingSource: mappedData.bookingSource,
        amount: mappedData.bookingAmount,
        amountPaid: mappedData.bookingAmount, // treat as prepaid
        numberOfGuests: mappedData.numberOfGuests,
        sourceReservationId: mappedData.otaBookingCode,
      };

      const pmsResult = await this.pmsReservationClient.createGuestReservation(
        mappedData.hotelId,
        oreonPayload,
      );

      if (pmsResult.success) {
        this.logger.log(
          `[createBooking] Forwarded to Oreon: bookingCode=${pmsResult.data?.bookingCode || "n/a"}`,
        );
      } else {
        this.logger.warn(
          `[createBooking] Oreon forward failed: ${pmsResult.error} — CM record still saved`,
        );
      }

      const resultPayload = {
        ...saved,
        oreonBookingCode: pmsResult.data?.bookingCode || null,
        oreonForwarded: pmsResult.success,
      };

      // Notify via webhook if enabled
      await this.webhookService.broadcast(
        saved.hotelId,
        WebhookEventType.BOOKING_NEW,
        {
          booking: resultPayload,
        },
      );

      return resultPayload;
    } catch (error) {
      this.logger.error(`Failed to create booking: ${error.message}`);
      throw new HttpException(
        `Failed to create booking: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateBooking(bookingCode: string, updates: any): Promise<any> {
    try {
      const booking =
        await this.channelManagerRepository.findBookingByCode(bookingCode);
      if (!booking) {
        throw new HttpException(
          `Booking with code ${bookingCode} not found`,
          HttpStatus.NOT_FOUND,
        );
      }
      const mappedUpdates = {
        ...updates,
        fullName: updates.fullName || updates.name || updates.guestName,
        email: updates.email,
        phoneNumber: updates.phoneNumber || updates.phone,
        startDate: updates.startDate || updates.checkInDate || updates.checkIn,
        endDate: updates.endDate || updates.checkOutDate || updates.checkOut,
        roomtypeId:
          updates.roomtypeId || updates.roomTypeId || updates.roomType,
        bookingAmount:
          updates.bookingAmount || updates.amount || updates.totalPrice,
        bookingSource: updates.bookingSource || updates.source,
        bookingStatus: updates.bookingStatus || updates.status,
        otaBookingCode: updates.otaBookingCode || updates.externalConfirmId,
      };

      delete mappedUpdates.amount;
      delete mappedUpdates.source;
      delete mappedUpdates.status;
      delete mappedUpdates.phone;
      delete mappedUpdates.roomTypeId;
      delete mappedUpdates.roomType;
      delete mappedUpdates.checkInDate;
      delete mappedUpdates.checkOutDate;
      delete mappedUpdates.checkIn;
      delete mappedUpdates.checkOut;
      delete mappedUpdates.totalPrice;
      delete mappedUpdates.externalConfirmId;
      delete mappedUpdates.currency;
      delete mappedUpdates.integrationId;
      delete mappedUpdates.guestDetails;
      delete mappedUpdates.channelData;
      delete mappedUpdates.cancelReason;
      delete mappedUpdates.canceledAt;

      const updatedBooking = await this.channelManagerRepository.updateBooking(
        bookingCode,
        mappedUpdates,
      );

      // Notify via webhook if status changed
      if (mappedUpdates.bookingStatus === BookingStatus.NO_SHOW) {
        await this.webhookService.broadcast(
          updatedBooking.hotelId,
          WebhookEventType.BOOKING_NO_SHOW,
          {
            bookingCode,
            hotelId: updatedBooking.hotelId,
            status: BookingStatus.NO_SHOW,
          },
        );
      } else if (mappedUpdates.bookingStatus === BookingStatus.CANCELLED) {
        await this.webhookService.broadcast(
          updatedBooking.hotelId,
          WebhookEventType.BOOKING_CANCEL,
          {
            bookingCode,
            hotelId: updatedBooking.hotelId,
            status: BookingStatus.CANCELLED,
          },
        );
      } else {
        await this.webhookService.broadcast(
          updatedBooking.hotelId,
          WebhookEventType.BOOKING_MODIFY,
          {
            bookingCode,
            hotelId: updatedBooking.hotelId,
            updates: mappedUpdates,
          },
        );
      }

      return updatedBooking;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Failed to update booking: ${error.message}`);
      throw new HttpException(
        `Failed to update booking: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
