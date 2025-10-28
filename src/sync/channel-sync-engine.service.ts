import { Injectable, Logger } from "@nestjs/common";
import { ChannelManagerRepository } from "../channel-manager.repository";
import { ChannelIntegration } from "../entities/channel-integration.entity";
import {
  ChannelAvailability,
  AvailabilityStatus,
} from "../entities/channel-availability.entity";
import {
  ChannelSyncLog,
  SyncOperationType,
  SyncStatus,
  SyncDirection,
} from "../entities/channel-sync-log.entity";
import { ChannelApiFactory } from "../api/channel-api-factory.service";
import { PmsReservationClient } from "../services/pms-reservation-client.service";
import { ChannelApiInterface } from "../api/channel-api.interface";

@Injectable()
export class ChannelSyncEngine {
  private readonly logger = new Logger(ChannelSyncEngine.name);

  constructor(
    private readonly channelManagerRepository: ChannelManagerRepository,
    private readonly channelApiFactory: ChannelApiFactory,
    private readonly pmsReservationClient: PmsReservationClient
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

  private normalizeReservationSummary(
    result: any,
    webhookData: any
  ): {
    roomTypeIdOrChannelId: number | string;
    startDate: string | Date;
    endDate: string | Date;
    rooms?: number;
  } | null {
    const src =
      result?.reservationSummary ?? result?.reservation ?? webhookData ?? {};
    const roomTypeIdOrChannelId =
      src.roomTypeId ??
      src.room_type_id ??
      src.roomType ??
      src.channelRoomTypeId ??
      src.channel_room_type_id;
    const startDate =
      src.startDate ?? src.start_date ?? src.checkIn ?? src.check_in;
    const endDate =
      src.endDate ?? src.end_date ?? src.checkOut ?? src.check_out;
    const rooms =
      src.rooms ?? src.quantity ?? src.numberOfRooms ?? src.num_rooms ?? 1;
    if (!roomTypeIdOrChannelId || !startDate || !endDate) return null;
    return { roomTypeIdOrChannelId, startDate, endDate, rooms };
  }

  private async applyReservationAvailabilityIfPresent(
    integration: ChannelIntegration,
    webhookData: any,
    result: any
  ): Promise<void> {
    try {
      const summary = this.normalizeReservationSummary(result, webhookData);
      if (!summary) return;

      const { roomTypeIdOrChannelId, startDate, endDate, rooms } = summary;
      let roomtypeId: number | null = null;
      if (typeof roomTypeIdOrChannelId === "number") {
        roomtypeId = roomTypeIdOrChannelId;
      } else if (typeof roomTypeIdOrChannelId === "string") {
        const mapping =
          await this.channelManagerRepository.findMappingByChannelRoomTypeId(
            integration.id,
            roomTypeIdOrChannelId
          );
        roomtypeId = mapping?.roomtypeId ?? null;
      }

      if (!roomtypeId || !startDate || !endDate) return;

      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

      const roomsToApply = Math.max(1, Number(rooms) || 1);
      for (
        let date = new Date(start);
        date < end;
        date.setDate(date.getDate() + 1)
      ) {
        const day = new Date(date);
        const availability =
          await this.channelManagerRepository.findAvailabilityByDateRange(
            integration.id,
            roomtypeId,
            day,
            day
          );
        if (!availability || availability.length === 0) continue;

        const current = availability[0];
        const baseTotal = current.totalRooms ?? current.availableRooms ?? 0;
        const newOccupied = Math.min(
          baseTotal,
          (current.occupiedRooms ?? 0) + roomsToApply
        );
        const newAvailable = Math.max(
          0,
          baseTotal -
            newOccupied -
            (current.blockedRooms ?? 0) -
            (current.maintenanceRooms ?? 0)
        );

        await this.channelManagerRepository.updateAvailability(current.id, {
          occupiedRooms: newOccupied,
          availableRooms: newAvailable,
          status:
            newAvailable > 0
              ? AvailabilityStatus.AVAILABLE
              : AvailabilityStatus.OCCUPIED,
          updatedAt: new Date(),
        });

        if (integration.isRealTimeSync) {
          const updated = {
            ...current,
            occupiedRooms: newOccupied,
            availableRooms: newAvailable,
            status:
              newAvailable > 0
                ? AvailabilityStatus.AVAILABLE
                : AvailabilityStatus.OCCUPIED,
          } as ChannelAvailability;
          try {
            await this.syncAvailabilityToChannel(updated);
          } catch (err) {
            this.logger.error(
              `Real-time availability push failed: ${err.message}`
            );
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to apply reservation availability: ${error.message}`
      );
    }
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
      this.logger.log(`Inbound syncLog created: id=${syncLog.id}`);

      // Process the webhook data based on channel type
      const channelApi = this.channelApiFactory.createChannelApi(
        integration.channelType
      );
      this.logger.log(`[Webhook] Processing via channel API: ${integration.channelType}`);
      const result = await channelApi.processWebhook(integration, webhookData);
      this.logger.log(
        `[Webhook] Processed result: processed=${(result && result.processed) ?? 'n/a'} type=${(result && result.type) ?? 'n/a'}`
      );

      // Apply availability blocking if reservation details are present
      await this.applyReservationAvailabilityIfPresent(
        integration,
        webhookData,
        result
      );

      // Optionally forward standardized guest payload to PMS
      try {
        const oreonGuestDto =
          (result && (result.oreon_guest_dto || result.guest || result.createGuestDto)) ||
          null;
        if (oreonGuestDto) {
          // Try to translate channel room type to PMS roomtype via mapping before forwarding
          try {
            const mappedRoomtype = await this.resolvePmsRoomtypeId(
              integration,
              webhookData,
              result,
              oreonGuestDto?.roomtype
            );
            if (mappedRoomtype) {
              oreonGuestDto.roomtype = mappedRoomtype;
            }
          } catch (mapErr: any) {
            this.logger.warn(
              `[PMS Forward] Roomtype mapping skipped: ${mapErr?.message || mapErr}`
            );
          }

          this.logger.log(
            `[PMS Forward] Found oreon_guest_dto: fullName=${oreonGuestDto.fullName || 'n/a'} email=${oreonGuestDto.email || 'n/a'} roomtype=${oreonGuestDto.roomtype || 'n/a'} start=${oreonGuestDto.startDate || 'n/a'} end=${oreonGuestDto.endDate || 'n/a'} guests=${oreonGuestDto.numberOfGuests || 'n/a'}`
          );

          const forwardResult = await this.pmsReservationClient.createGuestReservation(
            integration.hotelId,
            oreonGuestDto
          );
          this.logger.log(
            `[PMS Forward] Response: success=${forwardResult.success} status=${forwardResult.status ?? 'n/a'} error=${forwardResult.error ?? ''}`
          );
        } else {
          this.logger.log(`[PMS Forward] No oreon_guest_dto from channel API; skipping forward`);
        }
      } catch (err: any) {
        this.logger.error(`PMS reservation forward error: ${err?.message || err}`);
      }

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

  private async resolvePmsRoomtypeId(
    integration: ChannelIntegration,
    webhookData: any,
    result: any,
    currentRoomtype: any
  ): Promise<number | null> {
    // Prefer channel-provided room_type_id from webhook result/summary
    const summary = this.normalizeReservationSummary(result, webhookData);
    const candidate =
      (summary && (summary as any).roomTypeIdOrChannelId) ??
      webhookData?.data?.room_type_id ??
      webhookData?.room_type_id ??
      currentRoomtype;

    if (candidate === undefined || candidate === null) return null;

    // If candidate appears to be a PMS roomtype already (non-string channel ID unlikely), we still try mapping by string match
    const channelId = String(candidate);
    try {
      const mapping = await this.channelManagerRepository.findMappingByChannelRoomTypeId(
        integration.id,
        channelId
      );
      if (mapping?.roomtypeId) {
        this.logger.log(
          `[PMS Forward] Roomtype mapped: channelRoomTypeId=${channelId} -> pmsRoomtypeId=${mapping.roomtypeId}`
        );
        return mapping.roomtypeId;
      }
    } catch {}

    // No mapping found; if candidate is a finite number, assume it's already a PMS roomtype
    const num = Number(candidate);
    if (Number.isFinite(num)) return num;

    // Unable to resolve
    this.logger.warn(
      `[PMS Forward] No roomtype mapping found for channelRoomTypeId=${channelId}; forwarding as-is may fail.`
    );
    return null;
  }
}
