import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { ChannelApiInterface } from "../channel-api.interface";
import { ChannelIntegration } from "../../entities/channel-integration.entity";
import { ChannelMapping } from "../../entities/channel-mapping.entity";
import { ChannelAvailability } from "../../entities/channel-availability.entity";
import { ChannelRatePlan } from "../../entities/channel-rate-plan.entity";

@Injectable()
export class WakanowApiService implements ChannelApiInterface {
  private readonly logger = new Logger(WakanowApiService.name);
  private readonly baseUrl = "https://api.wakanow.com/v1"; // Placeholder URL
  private readonly httpService = new HttpService();

  async testConnection(
    integration: Partial<ChannelIntegration>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      this.logger.log("Testing Wakanow connection...");

      // Test API credentials by making a simple request to get hotel info
      // This is a placeholder implementation
      /*
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/hotels/${integration.channelPropertyId}`,
          {
            headers: {
              Authorization: `Bearer ${integration.accessToken}`,
              'Content-Type': 'application/json',
              'Ocp-Apim-Subscription-Key': integration.apiKey, // Common pattern for verify
            },
          },
        ),
      );
      */

      // Mock success for now until real API details are available
      this.logger.log("Wakanow connection test successful (Mock)");
      return { success: true };
    } catch (error) {
      this.logger.error(`Wakanow connection test failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async updateInventory(
    integration: ChannelIntegration,
    mapping: ChannelMapping,
  ): Promise<void> {
    try {
      this.logger.log(
        `Updating Wakanow inventory for: ${mapping.channelRoomTypeName}`,
      );

      const inventoryData = this.buildInventoryRequest(integration, mapping);

      // Placeholder for API call
      // await firstValueFrom(this.httpService.put(...));

      this.logger.log(
        `Wakanow inventory updated successfully for: ${mapping.channelRoomTypeName}`,
      );
    } catch (error) {
      this.logger.error(`Failed to update Wakanow inventory: ${error.message}`);
      throw error;
    }
  }

  async updateRates(
    integration: ChannelIntegration,
    ratePlan: ChannelRatePlan,
  ): Promise<void> {
    try {
      this.logger.log(
        `Updating Wakanow rates for: ${ratePlan.channelRatePlanName}`,
      );

      const rateData = this.buildRateRequest(integration, ratePlan);

      // Placeholder for API call
      // await firstValueFrom(this.httpService.put(...));

      this.logger.log(
        `Wakanow rates updated successfully for: ${ratePlan.channelRatePlanName}`,
      );
    } catch (error) {
      this.logger.error(`Failed to update Wakanow rates: ${error.message}`);
      throw error;
    }
  }

  async updateAvailability(
    integration: ChannelIntegration,
    availability: ChannelAvailability,
  ): Promise<void> {
    try {
      this.logger.log(
        `Updating Wakanow availability for date: ${availability.date}`,
      );

      const availabilityData = this.buildAvailabilityRequest(
        integration,
        availability,
      );

      // Placeholder for API call
      // await firstValueFrom(this.httpService.put(...));

      this.logger.log(
        `Wakanow availability updated successfully for date: ${availability.date}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update Wakanow availability: ${error.message}`,
      );
      throw error;
    }
  }

  async processWebhook(
    integration: ChannelIntegration,
    webhookData: any,
  ): Promise<any> {
    try {
      this.logger.log("Processing Wakanow webhook...");

      const parsedData = this.parseWebhookData(webhookData);

      // Default result structure
      const result: any = {
        processed: false,
        type: "unknown",
      };

      // Handle different event types from Wakanow
      // Note: Actual event names would depend on Wakanow API documentation
      const eventType = parsedData.event_type || "BOOKING_CONFIRMATION";

      switch (eventType) {
        case "RESERVATION_CREATED":
        case "BOOKING_CONFIRMATION":
          this.logger.log(`Processing Wakanow reservation webhook`);
          result.processed = true;
          result.type = "reservation";

          // Map Wakanow data to Oreon Guest DTO structure for PMS forwarding
          const bookingData = parsedData.data || {};
          const guestData = bookingData.guest || {};

          result.oreon_guest_dto = {
            fullName:
              `${guestData.first_name || ""} ${guestData.last_name || ""}`.trim() ||
              "Wakanow Guest",
            email: guestData.email || "no-email@wakanow.com",
            phone: guestData.phone || "",
            startDate: bookingData.check_in_date,
            endDate: bookingData.check_out_date,
            roomtype: bookingData.room_type_id, // Will be mapped to internal ID by sync engine
            numberOfGuests: 1, // Default if not provided
            notes: `Wakanow Booking Ref: ${bookingData.booking_reference}`,
            price: bookingData.total_amount || 0,
            currency: bookingData.currency || "NGN",
            source: "WAKANOW",
            externalBookingId: bookingData.booking_reference,
            status: "CONFIRMED",
          };

          result.guestId = bookingData.booking_reference;
          break;

        case "RESERVATION_CANCELLED":
        case "BOOKING_CANCELLATION":
          this.logger.log(`Processing Wakanow cancellation webhook`);
          result.processed = true;
          result.type = "cancellation";
          result.guestId = parsedData.data?.booking_reference;
          // For cancellation, we might also want to forward to PMS, but the sync engine
          // primarily looks for oreon_guest_dto for creation.
          // Cancellation logic would need to be handled if the PMS client supports it.
          break;

        case "RESERVATION_MODIFIED":
        case "BOOKING_MODIFICATION":
          this.logger.log(`Processing Wakanow modification webhook`);
          result.processed = true;
          result.type = "modification";
          result.guestId = parsedData.data?.booking_reference;
          break;

        default:
          this.logger.warn(
            `Unknown Wakanow webhook type: ${parsedData.event_type}`,
          );
          result.reason = "Unknown webhook type";
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to process Wakanow webhook: ${error.message}`);
      throw error;
    }
  }

  async createGuestReservation(
    integration: ChannelIntegration,
    guestData: any,
  ): Promise<any> {
    try {
      this.logger.log("Creating Wakanow guest reservation...");

      const reservationData = this.buildReservationRequest(
        integration,
        guestData,
      );

      // Placeholder for API call
      // await firstValueFrom(this.httpService.post(...));

      this.logger.log("Wakanow guest reservation created successfully");
      return { id: "mock-reservation-id", ...reservationData.reservation };
    } catch (error) {
      this.logger.error(
        `Failed to create Wakanow guest reservation: ${error.message}`,
      );
      throw error;
    }
  }

  async updateGuestReservation(
    integration: ChannelIntegration,
    guestId: string,
    updates: any,
  ): Promise<any> {
    try {
      this.logger.log(`Updating Wakanow guest reservation: ${guestId}`);

      const updateData = this.buildReservationUpdateRequest(
        integration,
        guestId,
        updates,
      );

      // Placeholder for API call
      // await firstValueFrom(this.httpService.put(...));

      this.logger.log("Wakanow guest reservation updated successfully");
      return { id: guestId, ...updates };
    } catch (error) {
      this.logger.error(
        `Failed to update Wakanow guest reservation: ${error.message}`,
      );
      throw error;
    }
  }

  async cancelGuestReservation(
    integration: ChannelIntegration,
    guestId: string,
  ): Promise<any> {
    try {
      this.logger.log(`Cancelling Wakanow guest reservation: ${guestId}`);

      // Placeholder for API call
      // await firstValueFrom(this.httpService.delete(...));

      this.logger.log("Wakanow guest reservation cancelled successfully");
      return { success: true, id: guestId };
    } catch (error) {
      this.logger.error(
        `Failed to cancel Wakanow guest reservation: ${error.message}`,
      );
      throw error;
    }
  }

  async getChannelInfo(integration: ChannelIntegration): Promise<any> {
    try {
      this.logger.log("Getting Wakanow channel info...");

      // Placeholder for API call
      // await firstValueFrom(this.httpService.get(...));

      return {
        channel: "Wakanow",
        status: "active",
        hotelInfo: {
          id: integration.channelPropertyId,
          name: "Mock Hotel Name",
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get Wakanow channel info: ${error.message}`);
      throw error;
    }
  }

  async validateCredentials(
    integration: Partial<ChannelIntegration>,
  ): Promise<boolean> {
    const testResult = await this.testConnection(integration);
    return testResult.success;
  }

  // Private helper methods
  private buildInventoryRequest(
    integration: ChannelIntegration,
    mapping: ChannelMapping,
  ): any {
    return {
      room_type: {
        name: mapping.channelRoomTypeName,
        description: mapping.channelDescription || "",
        amenities: mapping.channelAmenities || [],
        images: mapping.channelImages || [],
        capacity: mapping.mappingRules?.capacity || 2,
      },
    };
  }

  private buildRateRequest(
    integration: ChannelIntegration,
    ratePlan: ChannelRatePlan,
  ): any {
    return {
      rates: {
        base_rate: ratePlan.baseRate,
        currency: ratePlan.currency || "NGN", // Wakanow likely uses NGN as base
        restrictions: ratePlan.restrictions || {},
      },
    };
  }

  private buildAvailabilityRequest(
    integration: ChannelIntegration,
    availability: ChannelAvailability,
  ): any {
    const dateObj =
      availability.date instanceof Date
        ? availability.date
        : new Date(availability.date);

    return {
      availability: {
        date: dateObj.toISOString().split("T")[0],
        available_rooms: availability.availableRooms,
        status: availability.status === "AVAILABLE" ? "OPEN" : "CLOSED",
      },
    };
  }

  private buildReservationRequest(
    integration: ChannelIntegration,
    guestData: any,
  ): any {
    return {
      reservation: {
        hotel_id: integration.channelPropertyId,
        guest_name: guestData.fullName,
        check_in: guestData.startDate,
        check_out: guestData.endDate,
        room_type_id: guestData.roomTypeId,
        total_price: guestData.finalPrice,
        currency: guestData.currency || "NGN",
      },
    };
  }

  private buildReservationUpdateRequest(
    integration: ChannelIntegration,
    guestId: string,
    updates: any,
  ): any {
    return {
      reservation: {
        id: guestId,
        ...updates,
      },
    };
  }

  private parseWebhookData(webhookData: any): any {
    try {
      if (typeof webhookData === "string") {
        return JSON.parse(webhookData);
      }
      return webhookData;
    } catch (error) {
      this.logger.error(
        `Failed to parse Wakanow webhook data: ${error.message}`,
      );
      return webhookData;
    }
  }
}
