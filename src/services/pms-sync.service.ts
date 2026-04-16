import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ChannelManagerRepository } from "../channel-manager.repository";
import { WebhookService, WebhookEventType } from "./webhook.service";
import {
  ChannelIntegration,
  IntegrationStatus,
} from "../entities/channel-integration.entity";
import {
  ChannelAvailability,
  AvailabilityStatus,
} from "../entities/channel-availability.entity";
import { ChannelSyncEngine } from "../sync/channel-sync-engine.service";
import { OreonHotelClient } from "./oreon-hotel-client.service";

@Injectable()
export class PmsSyncService {
  private readonly logger = new Logger(PmsSyncService.name);

  constructor(
    private readonly channelManagerRepository: ChannelManagerRepository,
    private readonly webhookService: WebhookService,
    private readonly channelSyncEngine: ChannelSyncEngine,
    private readonly oreonHotelClient: OreonHotelClient,
  ) {}

  /**
   * Get property name by hotelId
   */
  private async getPropertyName(hotelId: number): Promise<string | null> {
    try {
      const hotel = await this.oreonHotelClient.getHotel(hotelId);
      return hotel?.name || null;
    } catch (error) {
      this.logger.warn(
        `Failed to get property name for hotelId ${hotelId}: ${error.message}`,
      );
      return null;
    }
  }

  // Sync room types from PMS to channel manager
  async syncRoomTypes(hotelId: number): Promise<void> {
    try {
      this.logger.log(`Starting room type sync for hotel: ${hotelId}`);

      // Fetch room types from PMS API
      const pmsData = await this.oreonHotelClient.getHotelRoomTypes(hotelId);

      this.logger.log(
        `Fetched ${pmsData.roomTypes?.length || 0} room types from PMS for hotel ${hotelId}`,
      );

      // Note: In the future, we could auto-create mappings here if they don't exist
      // For now, we just log the sync to ensure connectivity
      this.logger.log(`Room type sync completed for hotel: ${hotelId}`);
    } catch (error) {
      this.logger.error(
        `Room type sync failed for hotel ${hotelId}: ${error.message}`,
      );
    }
  }

  // Sync inventory from PMS to channel manager
  async syncInventory(hotelId: number): Promise<void> {
    try {
      this.logger.log(`Starting inventory sync for hotel: ${hotelId}`);

      // 1. Fetch room types and rooms from PMS
      const pmsData = await this.oreonHotelClient.getHotelRoomTypes(hotelId);
      if (!pmsData || !pmsData.roomTypes) {
        this.logger.warn(`No room types found for hotel ${hotelId} in PMS`);
        return;
      }

      // 2. Find all active integrations
      const integrations =
        await this.channelManagerRepository.findIntegrationsByHotel(hotelId);

      for (const integration of integrations) {
        if (integration.status !== IntegrationStatus.ACTIVE) continue;

        for (const roomType of pmsData.roomTypes) {
          const totalRooms = roomType.rooms?.length || 0;
          const availableRoomsNow =
            roomType.rooms?.filter((r) => r.status === "AVAILABLE").length || 0;

          // Update availability record for today
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const avails =
            await this.channelManagerRepository.findAvailabilityByDateRange(
              integration.id,
              roomType.id,
              today,
              today,
            );

          let updatedAvail: ChannelAvailability;
          if (avails.length > 0) {
            updatedAvail =
              await this.channelManagerRepository.updateAvailability(
                avails[0].id,
                {
                  totalRooms,
                  availableRooms: availableRoomsNow,
                  updatedAt: new Date(),
                },
              );
          } else {
            updatedAvail =
              await this.channelManagerRepository.createAvailability({
                integrationId: integration.id,
                roomtypeId: roomType.id,
                date: today,
                totalRooms,
                availableRooms: availableRoomsNow,
              });
          }

          // Trigger real-time sync if enabled
          if (integration.isRealTimeSync && updatedAvail) {
            try {
              await this.channelSyncEngine.syncAvailabilityToChannel(
                updatedAvail,
              );
            } catch (err) {
              this.logger.error(
                `Real-time sync failed during inventory update for integration ${integration.id}: ${err.message}`,
              );
            }
          }
        }
      }

      this.logger.log(`Inventory sync completed for hotel: ${hotelId}`);
    } catch (error) {
      this.logger.error(
        `Inventory sync failed for hotel ${hotelId}: ${error.message}`,
      );
    }
  }

  // Sync rates from PMS to channel manager
  async syncRates(hotelId: number): Promise<void> {
    try {
      this.logger.log(`Starting rate sync for hotel: ${hotelId}`);

      // 1. Fetch room types to pull prices from PMS
      const pmsData = await this.oreonHotelClient.getHotelRoomTypes(hotelId);
      if (!pmsData || !pmsData.roomTypes) return;

      // 2. Find all active integrations
      const integrations =
        await this.channelManagerRepository.findIntegrationsByHotel(hotelId);

      for (const integration of integrations) {
        if (integration.status !== IntegrationStatus.ACTIVE) continue;

        for (const roomType of pmsData.roomTypes) {
          const defaultPrice = roomType.rooms?.[0]?.price || 0;
          if (defaultPrice === 0) continue;

          // Update existing rate plans for this room type
          const ratePlans =
            await this.channelManagerRepository.findRatePlansByIntegration(
              integration.id,
            );
          const roomRatePlan = ratePlans.find(
            (rp) => rp.roomtypeId === roomType.id,
          );

          if (roomRatePlan) {
            await this.channelManagerRepository.updateRatePlan(
              roomRatePlan.id,
              {
                baseRate: defaultPrice,
                updatedAt: new Date(),
              },
            );
          }

          // Update future availability records (next 30 days) with latest price
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const monthLater = new Date(today);
          monthLater.setDate(today.getDate() + 30);

          const avails =
            await this.channelManagerRepository.findAvailabilityByDateRange(
              integration.id,
              roomType.id,
              today,
              monthLater,
            );

          for (const avail of avails) {
            await this.channelManagerRepository.updateAvailability(avail.id, {
              rate: defaultPrice,
              updatedAt: new Date(),
            });
          }
        }
      }

      this.logger.log(`Rate sync completed for hotel: ${hotelId}`);
    } catch (error) {
      this.logger.error(
        `Rate sync failed for hotel ${hotelId}: ${error.message}`,
      );
    }
  }

  // Sync guest bookings from PMS to channel manager
  async syncGuestBookings(hotelId: number): Promise<void> {
    try {
      this.logger.log(`Starting guest booking sync for hotel: ${hotelId}`);

      // Note: Full booking sync requires a GET /bookings endpoint in the PMS API
      // Currently, we only receive bookings via push or during onboarding
      // This remains a placeholder for the periodic deep sync

      this.logger.log(`Guest booking sync completed for hotel: ${hotelId}`);
    } catch (error) {
      this.logger.error(
        `Guest booking sync failed for hotel ${hotelId}: ${error.message}`,
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
        `Full sync failed for hotel ${hotelId}: ${error.message}`,
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
            `Sync failed for integration ${integration.id}: ${error.message}`,
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
        `Guest check-in detected: ${guestId} for hotel: ${hotelId}`,
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
        `Guest check-out detected: ${guestId} for hotel: ${hotelId}`,
      );

      // Update availability across all channels
      await this.updateAvailabilityForGuest(guestId, hotelId, "CHECK_OUT");

      this.logger.log(`Guest check-out sync completed: ${guestId}`);
    } catch (error) {
      this.logger.error(`Guest check-out sync failed: ${error.message}`);
    }
  }

  // Sync when guest no-show
  async handleGuestNoShow(guestId: number, hotelId: number): Promise<void> {
    try {
      this.logger.log(
        `Guest no-show detected: ${guestId} for hotel: ${hotelId}`,
      );

      // Update availability across all channels
      await this.updateAvailabilityForGuest(guestId, hotelId, "NO_SHOW");

      this.logger.log(`Guest no-show sync completed: ${guestId}`);
    } catch (error) {
      this.logger.error(`Guest no-show sync failed: ${error.message}`);
    }
  }

  // Update availability for guest events
  private async updateAvailabilityForGuest(
    guestId: number,
    hotelId: number,
    eventType: "CHECK_IN" | "CHECK_OUT" | "NO_SHOW",
  ): Promise<void> {
    try {
      // 1. Fetch guest details to get booking codes and dates
      const guest = await this.channelManagerRepository.findGuestById(guestId);
      if (!guest) {
        this.logger.warn(
          `Guest ${guestId} not found, cannot update availability`,
        );
        return;
      }

      // 2. Determine date range for availability adjustment
      const start = new Date(guest.startDate);
      const end = new Date(guest.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let adjustmentStart = start;
      const adjustmentEnd = end;
      let delta = 0; // Negative means block (decrease available), positive means release (increase available)

      if (eventType === "CHECK_IN") {
        delta = -1; // Block the room
      } else if (eventType === "CHECK_OUT") {
        // If they checkout, the room is free from today onwards for the original stay period
        adjustmentStart = today > start ? today : start;
        delta = 1; // Release the room
      } else if (eventType === "NO_SHOW") {
        delta = 1; // Release the room for the entire duration
      }

      if (delta !== 0) {
        // 3. Find all active integrations for this hotel
        const integrations =
          await this.channelManagerRepository.findIntegrationsByHotel(hotelId);

        for (const integration of integrations) {
          if (integration.status !== IntegrationStatus.ACTIVE) continue;

          // Process each day in the range
          for (
            let date = new Date(adjustmentStart);
            date < adjustmentEnd;
            date.setDate(date.getDate() + 1)
          ) {
            const day = new Date(date);
            const availabilities =
              await this.channelManagerRepository.findAvailabilityByDateRange(
                integration.id,
                guest.roomtypeId,
                day,
                day,
              );

            if (availabilities && availabilities.length > 0) {
              const current = availabilities[0];
              const baseTotal =
                current.totalRooms || current.availableRooms || 0;

              // If delta is -1 (CHECK_IN), occupied increases by 1, available decreases by 1
              // If delta is +1 (CHECK_OUT/NO_SHOW), occupied decreases by 1, available increases by 1
              const newOccupied = Math.max(
                0,
                Math.min(baseTotal, (current.occupiedRooms || 0) - delta),
              );
              const newAvailable = Math.max(
                0,
                baseTotal -
                  newOccupied -
                  (current.blockedRooms || 0) -
                  (current.maintenanceRooms || 0),
              );

              const updatedAvail =
                await this.channelManagerRepository.updateAvailability(
                  current.id,
                  {
                    occupiedRooms: newOccupied,
                    availableRooms: newAvailable,
                    status:
                      newAvailable > 0
                        ? AvailabilityStatus.AVAILABLE
                        : AvailabilityStatus.OCCUPIED,
                    updatedAt: new Date(),
                  },
                );

              // 4. Trigger real-time sync if enabled
              if (integration.isRealTimeSync) {
                try {
                  await this.channelSyncEngine.syncAvailabilityToChannel(
                    updatedAvail,
                  );
                } catch (syncError) {
                  this.logger.error(
                    `Real-time sync failed for integration ${integration.id}: ${syncError.message}`,
                  );
                }
              }
            }
          }
        }
      }

      // 5. Notify webhooks
      const webhookEvent =
        eventType === "CHECK_IN"
          ? WebhookEventType.CHECK_IN
          : eventType === "CHECK_OUT"
            ? WebhookEventType.CHECK_OUT
            : WebhookEventType.BOOKING_NO_SHOW;

      await this.webhookService.broadcast(hotelId, webhookEvent, {
        hotelId: hotelId,
        id: guestId,
        bookingCode: guest?.bookingCode || null,
        otaBookingCode: guest?.otaBookingCode || null,
        bookingStatus: guest?.bookingStatus || "NO_SHOW",
        amountPaid: guest?.amountPaid?.toString() || "0.00",
        outstanding: guest?.outstanding?.toString() || "0.00",
        numberOfGuests: guest?.numberOfGuests || 1,
        isCheckedIn: false,
        isCheckedOut: false,
        startTime: "14:00",
        endTime: "12:00",
        startDate: guest?.startDate || new Date().toISOString().split("T")[0],
        endDate: guest?.endDate || new Date().toISOString().split("T")[0],
        phoneNumber: guest?.phoneNumber || "",
        fullName: guest?.fullName || "",
        email: guest?.email || "",
        roomtypeId: guest?.roomtypeId,
        roomNumber: guest?.roomNumber,
        roomId: guest?.roomId,
        roomtype: { id: guest?.roomtypeId, name: null },
        floor: 1,
        propertyReference: `REF-${hotelId}`,
        property: guest?.property || (await this.getPropertyName(hotelId)),
      });

      this.logger.log(
        `Availability updated and webhook broadcasted for guest ${guestId} event: ${eventType}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update availability for guest ${guestId}: ${error.message}`,
      );
    }
  }
}
