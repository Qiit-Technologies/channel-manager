import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
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
import {
  ChannelSyncLog,
  SyncOperationType,
} from "./entities/channel-sync-log.entity";
import { ChannelRatePlan } from "./entities/channel-rate-plan.entity";
// Note: These entities will be loaded from Anli database
// Hotel, Roomtype, and Guest entities are imported from Anli
import { ChannelSyncEngine } from "./sync/channel-sync-engine.service";
import { ChannelApiFactory } from "./api/channel-api-factory.service";
import { OtaConfigurationService } from "./services/ota-configuration.service";

// Anli entity imports - these will be loaded from the Anli database
// We'll use type annotations to ensure compatibility

@Injectable()
export class ChannelManagerService {
  private readonly logger = new Logger(ChannelManagerService.name);

  constructor(
    private readonly channelManagerRepository: ChannelManagerRepository,
    private readonly channelSyncEngine: ChannelSyncEngine,
    private readonly channelApiFactory: ChannelApiFactory,
    private readonly otaConfigurationService: OtaConfigurationService
  ) {}

  // Channel Integration Management
  async createChannelIntegration(
    dto: CreateChannelIntegrationDto,
    userId: number
  ): Promise<ChannelIntegration> {
    try {
      // Note: Hotel verification will be handled by Anli's existing validation
      // For now, we assume the hotelId is valid

      // Check if hotel already has an integration of this type
      const existingIntegration =
        await this.channelManagerRepository.findIntegrationByHotelAndType(
          dto.hotelId,
          dto.channelType
        );

      if (existingIntegration) {
        throw new HttpException(
          `Hotel already has a ${dto.channelType} integration`,
          HttpStatus.CONFLICT
        );
      }

      // Generate property ID if not provided
      if (!dto.channelPropertyId) {
        dto.channelPropertyId = this.generatePropertyId(
          dto.hotelId,
          dto.channelType as string
        );
      }

      // Test the integration using centralized OTA config
      this.logger.log(
        `NODE_ENV: ${process.env.NODE_ENV}, running connection test...`
      );

      const testResult = await this.testChannelIntegration(dto);
      if (!testResult.success) {
        throw new HttpException(
          `Integration test failed: ${testResult.error}`,
          HttpStatus.BAD_REQUEST
        );
      }

      const integration = await this.channelManagerRepository.createIntegration(
        {
          ...dto,
          createdBy: userId,
          status: dto.status || IntegrationStatus.PENDING,
        }
      );

      // Auto-setup integration using PMS data
      await this.autoSetupIntegration(integration);

      this.logger.log(
        `Created channel integration: ${integration.channelName} for hotel ID: ${dto.hotelId}`
      );
      return integration;
    } catch (error) {
      this.logger.error(
        `Failed to create channel integration: ${error.message}`
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
        HttpStatus.NOT_FOUND
      );
    }
    return integration;
  }

  async updateChannelIntegration(
    id: number,
    updates: Partial<ChannelIntegration>,
    userId: number
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
          updates.channelType
        );

      if (existingIntegration && existingIntegration.id !== id) {
        throw new HttpException(
          `Hotel already has a ${updates.channelType} integration`,
          HttpStatus.CONFLICT
        );
      }

      // Test the integration using centralized OTA config
      const testResult = await this.testChannelIntegration(updates);
      if (!testResult.success) {
        throw new HttpException(
          `Integration test failed: ${testResult.error}`,
          HttpStatus.BAD_REQUEST
        );
      }
    }

    const updatedIntegration =
      await this.channelManagerRepository.updateIntegration(id, {
        ...updates,
        updatedBy: userId,
      });

    this.logger.log(
      `Updated channel integration: ${updatedIntegration.channelName}`
    );
    return updatedIntegration;
  }

  async deleteChannelIntegration(id: number): Promise<void> {
    const integration = await this.getChannelIntegration(id);
    await this.channelManagerRepository.deleteIntegration(id);
    this.logger.log(`Deleted channel integration: ${integration.channelName}`);
  }

  // Channel Mapping Management
  async createChannelMapping(
    dto: CreateChannelMappingDto,
    userId: number
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
        `Created channel mapping for room type ID: ${dto.roomtypeId}`
      );
      return mapping;
    } catch (error) {
      this.logger.error(`Failed to create channel mapping: ${error.message}`);
      throw error;
    }
  }

  async getChannelMappings(integrationId: number): Promise<ChannelMapping[]> {
    return await this.channelManagerRepository.findMappingsByIntegration(
      integrationId
    );
  }

  async updateChannelMapping(
    id: number,
    updates: Partial<ChannelMapping>,
    userId: number
  ): Promise<ChannelMapping> {
    const mapping = await this.channelManagerRepository.findMappingById(id);
    if (!mapping) {
      throw new HttpException(
        "Channel mapping not found",
        HttpStatus.NOT_FOUND
      );
    }

    const updatedMapping = await this.channelManagerRepository.updateMapping(
      id,
      {
        ...updates,
        updatedBy: userId,
      }
    );

    this.logger.log(
      `Updated channel mapping: ${updatedMapping.channelRoomTypeName}`
    );
    return updatedMapping;
  }

  // Availability Management
  async syncAvailability(
    dto: SyncAvailabilityDto
  ): Promise<ChannelAvailability> {
    try {
      const integration = await this.getChannelIntegration(dto.integrationId);

      // Create or update availability record
      const availability =
        await this.channelManagerRepository.findAvailabilityByDateRange(
          dto.integrationId,
          dto.roomtypeId,
          new Date(dto.date),
          new Date(dto.date)
        );

      if (availability.length > 0) {
        const updatedAvailability =
          await this.channelManagerRepository.updateAvailability(
            availability[0].id,
            { ...dto, date: new Date(dto.date) }
          );
        return updatedAvailability;
      } else {
        const newAvailability =
          await this.channelManagerRepository.createAvailability({
            ...dto,
            date: new Date(dto.date),
          });
        return newAvailability;
      }

      // Trigger real-time sync if enabled
      if (integration.isRealTimeSync) {
        await this.channelSyncEngine.syncAvailabilityToChannel(availability[0]);
      }

      return availability[0];
    } catch (error) {
      this.logger.error(`Failed to sync availability: ${error.message}`);
      throw error;
    }
  }

  async getAvailabilityByDateRange(
    integrationId: number,
    roomtypeId: number,
    startDate: Date,
    endDate: Date
  ): Promise<ChannelAvailability[]> {
    return await this.channelManagerRepository.findAvailabilityByDateRange(
      integrationId,
      roomtypeId,
      startDate,
      endDate
    );
  }

  // Rate Management
  async createChannelRatePlan(
    ratePlan: Partial<ChannelRatePlan>,
    userId: number
  ): Promise<ChannelRatePlan> {
    const newRatePlan = await this.channelManagerRepository.createRatePlan({
      ...ratePlan,
      createdBy: userId,
    });

    this.logger.log(
      `Created channel rate plan: ${newRatePlan.channelRatePlanName}`
    );
    return newRatePlan;
  }

  async getChannelRatePlans(integrationId: number): Promise<ChannelRatePlan[]> {
    return await this.channelManagerRepository.findRatePlansByIntegration(
      integrationId
    );
  }

  // Sync Management
  async triggerManualSync(
    integrationId: number,
    operationType: SyncOperationType
  ): Promise<void> {
    const integration = await this.getChannelIntegration(integrationId);

    if (integration.status !== IntegrationStatus.ACTIVE) {
      throw new HttpException(
        "Integration is not active",
        HttpStatus.BAD_REQUEST
      );
    }

    await this.channelSyncEngine.triggerSync(integration, operationType);
    this.logger.log(
      `Manual sync triggered for integration: ${integration.channelName}`
    );
  }

  async getSyncLogs(
    integrationId: number,
    limit: number = 100
  ): Promise<ChannelSyncLog[]> {
    return await this.channelManagerRepository.findSyncLogsByIntegration(
      integrationId,
      limit
    );
  }

  async getSyncStatistics(
    integrationId: number,
    days: number = 7
  ): Promise<any> {
    return await this.channelManagerRepository.getSyncStatistics(
      integrationId,
      days
    );
  }

  // Testing and Validation
  async testChannelIntegration(
    integration: Partial<ChannelIntegration>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("integration", integration);
      // Get the OTA configuration for this channel type
      const otaConfig = await this.otaConfigurationService.getConfiguration(
        integration.channelType
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
        integration.channelType
      );
      const testResult = await channelApi.testConnection(testIntegration);

      if (testResult.success) {
        this.logger.log(
          `Integration test successful for ${integration.channelType}`
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
            SyncOperationType.FULL_SYNC
          );
          this.logger.log(
            `Scheduled sync completed for: ${integration.channelName}`
          );
        } catch (error) {
          this.logger.error(
            `Scheduled sync failed for ${integration.channelName}: ${error.message}`
          );

          // Update integration status if sync fails repeatedly
          await this.channelManagerRepository.updateIntegration(
            integration.id,
            {
              status: IntegrationStatus.ERROR,
              errorMessage: error.message,
            }
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
      // TODO: Implement guest check-in logic when Anli integration is complete
      // This will involve:
      // 1. Getting guest details from Anli
      // 2. Updating availability across all channels
      // 3. Triggering real-time sync
    } catch (error) {
      this.logger.error(`Failed to handle guest check-in: ${error.message}`);
    }
  }

  async handleGuestCheckOut(guestId: number): Promise<void> {
    try {
      this.logger.log(`Guest check-out triggered for guest ID: ${guestId}`);
      // TODO: Implement guest check-out logic when Anli integration is complete
      // This will involve:
      // 1. Getting guest details from Anli
      // 2. Updating availability across all channels
      // 3. Triggering real-time sync
    } catch (error) {
      this.logger.error(`Failed to handle guest check-out: ${error.message}`);
    }
  }

  // Auto-setup integration using Anli data
  private async autoSetupIntegration(
    integration: ChannelIntegration
  ): Promise<void> {
    try {
      this.logger.log(
        `Starting auto-setup for integration: ${integration.channelName}`
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
        `Auto-setup completed for integration: ${integration.channelName}`
      );
    } catch (error) {
      this.logger.error(
        `Auto-setup failed for integration ${integration.channelName}: ${error.message}`
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
    integration: ChannelIntegration
  ): Promise<void> {
    try {
      // TODO: Read room types from PMS database
      // For now, we'll create placeholder mappings
      // This will be implemented when PMS integration is complete

      this.logger.log(
        `Auto-creating room type mappings for integration: ${integration.id}`
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
        `Created default room type mapping for integration: ${integration.id}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to auto-create room type mappings: ${error.message}`
      );
      throw error;
    }
  }

  // Auto-setup availability sync
  private async autoSetupAvailabilitySync(
    integration: ChannelIntegration
  ): Promise<void> {
    try {
      this.logger.log(
        `Setting up availability sync for integration: ${integration.id}`
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
        `Availability sync setup completed for integration: ${integration.id}`
      );
    } catch (error) {
      this.logger.error(`Failed to setup availability sync: ${error.message}`);
      throw error;
    }
  }

  // Auto-setup rate sync
  private async autoSetupRateSync(
    integration: ChannelIntegration
  ): Promise<void> {
    try {
      this.logger.log(
        `Setting up rate sync for integration: ${integration.id}`
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
        `Rate sync setup completed for integration: ${integration.id}`
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
        (integration) => integration.channelType
      );

      // Return all channel types that the hotel doesn't have
      const allTypes = Object.values(ChannelType);
      return allTypes.filter((type) => !existingTypes.includes(type));
    } catch (error) {
      this.logger.error(
        `Failed to get available integration types: ${error.message}`
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
    guest: any
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
            date
          );

        if (availability.length > 0) {
          const currentAvailability = availability[0];
          const newOccupiedRooms = Math.max(
            0,
            currentAvailability.occupiedRooms - 1
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
            }
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to update availability for guest: ${error.message}`
      );
    }
  }
}
