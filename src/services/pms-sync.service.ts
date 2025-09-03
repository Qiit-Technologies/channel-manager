import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ChannelManagerRepository } from "../channel-manager.repository";
import {
  ChannelIntegration,
  IntegrationStatus,
} from "../entities/channel-integration.entity";

@Injectable()
export class PmsSyncService {
  private readonly logger = new Logger(PmsSyncService.name);

  constructor(
    private readonly channelManagerRepository: ChannelManagerRepository
  ) {}

  // Sync room types from PMS to channel manager
  async syncRoomTypes(hotelId: number): Promise<void> {
    try {
      this.logger.log(`Starting room type sync for hotel: ${hotelId}`);

                // TODO: Read room types from PMS database
      // This will be implemented when PMS integration is complete

      // For now, log the sync attempt
      this.logger.log(`Room type sync completed for hotel: ${hotelId}`);
    } catch (error) {
      this.logger.error(
        `Room type sync failed for hotel ${hotelId}: ${error.message}`
      );
    }
  }

  // Sync inventory from PMS to channel manager
  async syncInventory(hotelId: number): Promise<void> {
    try {
      this.logger.log(`Starting inventory sync for hotel: ${hotelId}`);

                // TODO: Read inventory from PMS database
      // This will be implemented when PMS integration is complete

      // For now, log the sync attempt
      this.logger.log(`Inventory sync completed for hotel: ${hotelId}`);
    } catch (error) {
      this.logger.error(
        `Inventory sync failed for hotel ${hotelId}: ${error.message}`
      );
    }
  }

  // Sync rates from PMS to channel manager
  async syncRates(hotelId: number): Promise<void> {
    try {
      this.logger.log(`Starting rate sync for hotel: ${hotelId}`);

      // TODO: Read rates from PMS database
      // This will be implemented when PMS integration is complete

      // For now, log the sync attempt
      this.logger.log(`Rate sync completed for hotel: ${hotelId}`);
    } catch (error) {
      this.logger.error(
        `Rate sync failed for hotel ${hotelId}: ${error.message}`
      );
    }
  }

  // Sync guest bookings from PMS to channel manager
  async syncGuestBookings(hotelId: number): Promise<void> {
    try {
      this.logger.log(`Starting guest booking sync for hotel: ${hotelId}`);

      // TODO: Read guest bookings from PMS database
      // This will be implemented when PMS integration is complete

      // For now, log the sync attempt
      this.logger.log(`Guest booking sync completed for hotel: ${hotelId}`);
    } catch (error) {
      this.logger.error(
        `Guest booking sync failed for hotel ${hotelId}: ${error.message}`
      );
    }
  }

  // Full sync for a specific hotel
  async fullSync(hotelId: number): Promise<void> {
    try {
      this.logger.log(`Starting full sync for hotel: ${hotelId}`);

      await Promise.all([
        this.syncRoomTypes(hotelId),
        this.syncInventory(hotelId),
        this.syncRates(hotelId),
        this.syncGuestBookings(hotelId),
      ]);

      this.logger.log(`Full sync completed for hotel: ${hotelId}`);
    } catch (error) {
      this.logger.error(
        `Full sync failed for hotel ${hotelId}: ${error.message}`
      );
    }
  }

  // Sync all active integrations
  async syncAllActiveIntegrations(): Promise<void> {
    try {
      this.logger.log("Starting sync for all active integrations");

      const activeIntegrations =
        await this.channelManagerRepository.findActiveIntegrations();

      for (const integration of activeIntegrations) {
        try {
          await this.fullSync(integration.hotelId);
        } catch (error) {
          this.logger.error(
            `Sync failed for integration ${integration.id}: ${error.message}`
          );
        }
      }

      this.logger.log("Sync completed for all active integrations");
    } catch (error) {
      this.logger.error(`Failed to sync all integrations: ${error.message}`);
    }
  }

  // Scheduled sync every 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleScheduledSync(): Promise<void> {
    try {
      this.logger.log("Starting scheduled sync");
      await this.syncAllActiveIntegrations();
    } catch (error) {
      this.logger.error(`Scheduled sync failed: ${error.message}`);
    }
  }

  // Sync when guest checks in
  async handleGuestCheckIn(guestId: number, hotelId: number): Promise<void> {
    try {
      this.logger.log(
        `Guest check-in detected: ${guestId} for hotel: ${hotelId}`
      );

      // Update availability across all channels
      await this.updateAvailabilityForGuest(guestId, hotelId, "CHECK_IN");

      this.logger.log(`Guest check-in sync completed: ${guestId}`);
    } catch (error) {
      this.logger.error(`Guest check-in sync failed: ${error.message}`);
    }
  }

  // Sync when guest checks out
  async handleGuestCheckOut(guestId: number, hotelId: number): Promise<void> {
    try {
      this.logger.log(
        `Guest check-out detected: ${guestId} for hotel: ${hotelId}`
      );

      // Update availability across all channels
      await this.updateAvailabilityForGuest(guestId, hotelId, "CHECK_OUT");

      this.logger.log(`Guest check-out sync completed: ${guestId}`);
    } catch (error) {
      this.logger.error(`Guest check-out sync failed: ${error.message}`);
    }
  }

  // Update availability for guest events
  private async updateAvailabilityForGuest(
    guestId: number,
    hotelId: number,
    eventType: "CHECK_IN" | "CHECK_OUT"
  ): Promise<void> {
    try {
      // TODO: Update availability records based on guest event
      // This will be implemented when Oreon integration is complete

      this.logger.log(
        `Availability updated for guest ${guestId} event: ${eventType}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to update availability for guest ${guestId}: ${error.message}`
      );
    }
  }
}
