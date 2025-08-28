import { Injectable, Logger } from "@nestjs/common";
import { ChannelManagerRepository } from "../channel-manager.repository";
import { ChannelIntegration } from "../entities/channel-integration.entity";
import { ChannelAvailability } from "../entities/channel-availability.entity";
import {
  ChannelSyncLog,
  SyncOperationType,
  SyncStatus,
  SyncDirection,
} from "../entities/channel-sync-log.entity";
import { ChannelApiFactory } from "../api/channel-api-factory.service";
import { ChannelApiInterface } from "../api/channel-api.interface";

@Injectable()
export class ChannelSyncEngine {
  private readonly logger = new Logger(ChannelSyncEngine.name);

  constructor(
    private readonly channelManagerRepository: ChannelManagerRepository,
    private readonly channelApiFactory: ChannelApiFactory
  ) {}

  async triggerSync(
    integration: ChannelIntegration,
    operationType: SyncOperationType
  ): Promise<void> {
    const startTime = Date.now();
    let syncLog: ChannelSyncLog;

    try {
      // Create sync log entry
      syncLog = await this.channelManagerRepository.createSyncLog({
        integrationId: integration.id,
        operationType,
        status: SyncStatus.IN_PROGRESS,
        direction: SyncDirection.OUTBOUND,
        createdAt: new Date(),
      });

      this.logger.log(
        `Starting sync for integration: ${integration.channelName}, operation: ${operationType}`
      );

      // Get channel API instance
      const channelApi = this.channelApiFactory.createChannelApi(
        integration.channelType
      );

      // Perform the sync operation
      let result: any;
      switch (operationType) {
        case SyncOperationType.INVENTORY_UPDATE:
          result = await this.syncInventory(integration, channelApi);
          break;
        case SyncOperationType.RATE_UPDATE:
          result = await this.syncRates(integration, channelApi);
          break;
        case SyncOperationType.AVAILABILITY_UPDATE:
          result = await this.syncAvailability(integration, channelApi);
          break;
        case SyncOperationType.FULL_SYNC:
          result = await this.performFullSync(integration, channelApi);
          break;
        default:
          throw new Error(`Unsupported operation type: ${operationType}`);
      }

      // Update sync log with success
      await this.channelManagerRepository.updateSyncLog(syncLog.id, {
        status: SyncStatus.SUCCESS,
        responseData: JSON.stringify(result),
        processingTimeMs: Date.now() - startTime,
        recordsProcessed: result.recordsProcessed || 0,
        recordsSuccess: result.recordsSuccess || 0,
        recordsFailed: result.recordsFailed || 0,
        completedAt: new Date(),
      });

      // Update integration last sync time
      await this.channelManagerRepository.updateIntegration(integration.id, {
        lastSyncAt: new Date(),
        lastSuccessfulSync: new Date(),
        errorMessage: null,
      });

      this.logger.log(
        `Sync completed successfully for: ${integration.channelName}`
      );
    } catch (error) {
      this.logger.error(
        `Sync failed for ${integration.channelName}: ${error.message}`
      );

      // Update sync log with failure
      if (syncLog) {
        await this.channelManagerRepository.updateSyncLog(syncLog.id, {
          status: SyncStatus.FAILED,
          errorMessage: error.message,
          errorCode: error.code || "SYNC_ERROR",
          processingTimeMs: Date.now() - startTime,
          completedAt: new Date(),
        });
      }

      // Update integration with error
      await this.channelManagerRepository.updateIntegration(integration.id, {
        errorMessage: error.message,
        lastSyncAt: new Date(),
      });

      throw error;
    }
  }

  async syncAvailabilityToChannel(
    availability: ChannelAvailability
  ): Promise<void> {
    try {
      const integration =
        await this.channelManagerRepository.findIntegrationById(
          availability.integrationId
        );
      const channelApi = this.channelApiFactory.createChannelApi(
        integration.channelType
      );

      await channelApi.updateAvailability(integration, availability);

      this.logger.log(
        `Real-time availability sync completed for: ${integration.channelName}`
      );
    } catch (error) {
      this.logger.error(`Real-time availability sync failed: ${error.message}`);
      throw error;
    }
  }

  private async syncInventory(
    integration: ChannelIntegration,
    channelApi: ChannelApiInterface
  ): Promise<any> {
    this.logger.log(`Syncing inventory for: ${integration.channelName}`);

    // Get all room types for the hotel
    const mappings =
      await this.channelManagerRepository.findMappingsByIntegration(
        integration.id
      );

    let recordsProcessed = 0;
    let recordsSuccess = 0;
    let recordsFailed = 0;

    for (const mapping of mappings) {
      try {
        await channelApi.updateInventory(integration, mapping);
        recordsSuccess++;
      } catch (error) {
        this.logger.error(
          `Failed to sync inventory for mapping ${mapping.id}: ${error.message}`
        );
        recordsFailed++;
      }
      recordsProcessed++;
    }

    return { recordsProcessed, recordsSuccess, recordsFailed };
  }

  private async syncRates(
    integration: ChannelIntegration,
    channelApi: ChannelApiInterface
  ): Promise<any> {
    this.logger.log(`Syncing rates for: ${integration.channelName}`);

    // Get all rate plans for the integration
    const ratePlans =
      await this.channelManagerRepository.findRatePlansByIntegration(
        integration.id
      );

    let recordsProcessed = 0;
    let recordsSuccess = 0;
    let recordsFailed = 0;

    for (const ratePlan of ratePlans) {
      try {
        await channelApi.updateRates(integration, ratePlan);
        recordsSuccess++;
      } catch (error) {
        this.logger.error(
          `Failed to sync rates for rate plan ${ratePlan.id}: ${error.message}`
        );
        recordsFailed++;
      }
      recordsProcessed++;
    }

    return { recordsProcessed, recordsSuccess, recordsFailed };
  }

  private async syncAvailability(
    integration: ChannelIntegration,
    channelApi: ChannelApiInterface
  ): Promise<any> {
    this.logger.log(`Syncing availability for: ${integration.channelName}`);

    // Get availability for the next 30 days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const mappings =
      await this.channelManagerRepository.findMappingsByIntegration(
        integration.id
      );

    let recordsProcessed = 0;
    let recordsSuccess = 0;
    let recordsFailed = 0;

    for (const mapping of mappings) {
      try {
        const availability =
          await this.channelManagerRepository.findAvailabilityByDateRange(
            integration.id,
            mapping.roomtypeId,
            startDate,
            endDate
          );

        for (const avail of availability) {
          try {
            await channelApi.updateAvailability(integration, avail);
            recordsSuccess++;
          } catch (error) {
            this.logger.error(
              `Failed to sync availability for date ${avail.date}: ${error.message}`
            );
            recordsFailed++;
          }
          recordsProcessed++;
        }
      } catch (error) {
        this.logger.error(
          `Failed to sync availability for mapping ${mapping.id}: ${error.message}`
        );
        recordsFailed++;
      }
    }

    return { recordsProcessed, recordsSuccess, recordsFailed };
  }

  private async performFullSync(
    integration: ChannelIntegration,
    channelApi: ChannelApiInterface
  ): Promise<any> {
    this.logger.log(`Performing full sync for: ${integration.channelName}`);

    const inventoryResult = await this.syncInventory(integration, channelApi);
    const ratesResult = await this.syncRates(integration, channelApi);
    const availabilityResult = await this.syncAvailability(
      integration,
      channelApi
    );

    const totalProcessed =
      inventoryResult.recordsProcessed +
      ratesResult.recordsProcessed +
      availabilityResult.recordsProcessed;
    const totalSuccess =
      inventoryResult.recordsSuccess +
      ratesResult.recordsSuccess +
      availabilityResult.recordsSuccess;
    const totalFailed =
      inventoryResult.recordsFailed +
      ratesResult.recordsFailed +
      availabilityResult.recordsFailed;

    return {
      recordsProcessed: totalProcessed,
      recordsSuccess: totalSuccess,
      recordsFailed: totalFailed,
      inventory: inventoryResult,
      rates: ratesResult,
      availability: availabilityResult,
    };
  }

  async handleIncomingWebhook(
    integration: ChannelIntegration,
    webhookData: any
  ): Promise<void> {
    try {
      this.logger.log(
        `Processing incoming webhook for: ${integration.channelName}`
      );

      // Create sync log for inbound operation
      const syncLog = await this.channelManagerRepository.createSyncLog({
        integrationId: integration.id,
        operationType: SyncOperationType.BOOKING_CREATE, // Default, can be updated based on webhook data
        status: SyncStatus.IN_PROGRESS,
        direction: SyncDirection.INBOUND,
        requestData: JSON.stringify(webhookData),
        createdAt: new Date(),
      });

      // Process the webhook data based on channel type
      const channelApi = this.channelApiFactory.createChannelApi(
        integration.channelType
      );
      const result = await channelApi.processWebhook(integration, webhookData);

      // Update sync log with success
      await this.channelManagerRepository.updateSyncLog(syncLog.id, {
        status: SyncStatus.SUCCESS,
        responseData: JSON.stringify(result),
        completedAt: new Date(),
      });

      this.logger.log(
        `Webhook processed successfully for: ${integration.channelName}`
      );
    } catch (error) {
      this.logger.error(
        `Webhook processing failed for ${integration.channelName}: ${error.message}`
      );
      throw error;
    }
  }
}
