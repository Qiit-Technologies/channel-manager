import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { ChannelApiInterface } from "../channel-api.interface";
import { ChannelIntegration } from "../../entities/channel-integration.entity";
import { ChannelMapping } from "../../entities/channel-mapping.entity";
import { ChannelAvailability } from "../../entities/channel-availability.entity";
import { ChannelRatePlan } from "../../entities/channel-rate-plan.entity";

@Injectable()
export class BookingComApiService implements ChannelApiInterface {
  private readonly logger = new Logger(BookingComApiService.name);
  private readonly baseUrl = "https://distribution-xml.booking.com/2.4";
  private readonly httpService = new HttpService();

  async testConnection(
    integration: Partial<ChannelIntegration>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      this.logger.log("Testing Booking.com connection...");

      // Test API credentials by validating they exist
      if (!integration.apiKey) {
        throw new Error("API key is required for Booking.com integration");
      }

      if (!integration.apiSecret) {
        throw new Error("API secret is required for Booking.com integration");
      }

      // For now, just validate that credentials exist without making actual API calls
      // TODO: Implement actual API endpoint testing when correct endpoints are identified
      this.logger.log("Booking.com credentials validation successful");
      return { success: true };
    } catch (error) {
      this.logger.error(`Booking.com connection test failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async updateInventory(
    integration: ChannelIntegration,
    mapping: ChannelMapping
  ): Promise<void> {
    try {
      this.logger.log(
        `Updating inventory for room type: ${mapping.channelRoomTypeName}`
      );

      if (!integration.apiKey) {
        throw new Error("API key is required for Booking.com integration");
      }

      const inventoryData = this.buildInventoryRequest(integration, mapping);

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/v1/inventory`, inventoryData, {
          headers: {
            Authorization: `Bearer ${integration.apiKey}`,
            "Content-Type": "application/json",
          },
        })
      );

      if (response.status !== 200) {
        throw new Error(`Failed to update inventory: ${response.statusText}`);
      }

      this.logger.log(
        `Inventory updated successfully for: ${mapping.channelRoomTypeName}`
      );
    } catch (error) {
      this.logger.error(`Failed to update inventory: ${error.message}`);
      throw error;
    }
  }

  async updateRates(
    integration: ChannelIntegration,
    ratePlan: ChannelRatePlan
  ): Promise<void> {
    try {
      this.logger.log(
        `Updating rates for rate plan: ${ratePlan.channelRatePlanName}`
      );

      if (!integration.apiKey) {
        throw new Error("API key is required for Booking.com integration");
      }

      const rateData = this.buildRateRequest(integration, ratePlan);

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/v1/rates`, rateData, {
          headers: {
            Authorization: `Bearer ${integration.apiKey}`,
            "Content-Type": "application/json",
          },
        })
      );

      if (response.status !== 200) {
        throw new Error(`Failed to update rates: ${response.statusText}`);
      }

      this.logger.log(
        `Rates updated successfully for: ${ratePlan.channelRatePlanName}`
      );
    } catch (error) {
      this.logger.error(`Failed to update rates: ${error.message}`);
      throw error;
    }
  }

  async updateAvailability(
    integration: ChannelIntegration,
    availability: ChannelAvailability
  ): Promise<void> {
    try {
      this.logger.log(`Updating availability for date: ${availability.date}`);

      if (!integration.apiKey) {
        throw new Error("API key is required for Booking.com integration");
      }

      const availabilityData = this.buildAvailabilityRequest(
        integration,
        availability
      );

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/v1/availability`,
          availabilityData,
          {
            headers: {
              Authorization: `Bearer ${integration.apiKey}`,
              "Content-Type": "application/json",
            },
          }
        )
      );

      if (response.status !== 200) {
        throw new Error(
          `Failed to update availability: ${response.statusText}`
        );
      }

      this.logger.log(
        `Availability updated successfully for date: ${availability.date}`
      );
    } catch (error) {
      this.logger.error(`Failed to update availability: ${error.message}`);
      throw error;
    }
  }

  async processWebhook(
    integration: ChannelIntegration,
    webhookData: any
  ): Promise<any> {
    try {
      this.logger.log("Processing Booking.com webhook...");

      // Parse webhook data based on Booking.com format
      const parsedData = this.parseWebhookData(webhookData);

      // Process the webhook based on type
      switch (parsedData.type) {
        case "reservation":
          return await this.processReservationWebhook(integration, parsedData);
        case "cancellation":
          return await this.processCancellationWebhook(integration, parsedData);
        case "modification":
          return await this.processModificationWebhook(integration, parsedData);
        default:
          this.logger.warn(`Unknown webhook type: ${parsedData.type}`);
          return { processed: false, reason: "Unknown webhook type" };
      }
    } catch (error) {
      this.logger.error(`Failed to process webhook: ${error.message}`);
      throw error;
    }
  }

  async createGuestReservation(
    integration: ChannelIntegration,
    guestData: any
  ): Promise<any> {
    try {
      this.logger.log("Creating guest reservation in Booking.com...");

      if (!integration.apiKey) {
        throw new Error("API key is required for Booking.com integration");
      }

      const reservationData = this.buildReservationRequest(
        integration,
        guestData
      );

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/v1/reservations`,
          reservationData,
          {
            headers: {
              Authorization: `Bearer ${integration.apiKey}`,
              "Content-Type": "application/json",
            },
          }
        )
      );

      if (response.status !== 200) {
        throw new Error(`Failed to create reservation: ${response.statusText}`);
      }

      this.logger.log("Guest reservation created successfully");
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to create guest reservation: ${error.message}`);
      throw error;
    }
  }

  async updateGuestReservation(
    integration: ChannelIntegration,
    guestId: string,
    updates: any
  ): Promise<any> {
    try {
      this.logger.log(`Updating guest reservation: ${guestId}`);

      if (!integration.apiKey) {
        throw new Error("API key is required for Booking.com integration");
      }

      const updateData = this.buildReservationUpdateRequest(
        integration,
        guestId,
        updates
      );

      const response = await firstValueFrom(
        this.httpService.put(
          `${this.baseUrl}/v1/reservations/${guestId}`,
          updateData,
          {
            headers: {
              Authorization: `Bearer ${integration.apiKey}`,
              "Content-Type": "application/json",
            },
          }
        )
      );

      if (response.status !== 200) {
        throw new Error(`Failed to update reservation: ${response.statusText}`);
      }

      this.logger.log("Guest reservation updated successfully");
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to update guest reservation: ${error.message}`);
      throw error;
    }
  }

  async cancelGuestReservation(
    integration: ChannelIntegration,
    guestId: string
  ): Promise<any> {
    try {
      this.logger.log(`Cancelling guest reservation: ${guestId}`);

      if (!integration.apiKey) {
        throw new Error("API key is required for Booking.com integration");
      }

      const response = await firstValueFrom(
        this.httpService.delete(`${this.baseUrl}/v1/reservations/${guestId}`, {
          headers: {
            Authorization: `Bearer ${integration.apiKey}`,
          },
        })
      );

      if (response.status !== 200) {
        throw new Error(`Failed to cancel reservation: ${response.statusText}`);
      }

      this.logger.log("Guest reservation cancelled successfully");
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to cancel guest reservation: ${error.message}`);
      throw error;
    }
  }

  async getChannelInfo(integration: ChannelIntegration): Promise<any> {
    try {
      if (!integration.apiKey) {
        throw new Error("API key is required for Booking.com integration");
      }

      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/v1/hotels/${integration.channelPropertyId}`,
          {
            headers: {
              Authorization: `Bearer ${integration.apiKey}`,
            },
          }
        )
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get channel info: ${error.message}`);
      throw error;
    }
  }

  async validateCredentials(
    integration: Partial<ChannelIntegration>
  ): Promise<boolean> {
    const testResult = await this.testConnection(integration);
    return testResult.success;
  }

  // Private helper methods
  private getAuthHeader(integration: Partial<ChannelIntegration>): string {
    const credentials = `${integration.apiKey}:${integration.apiSecret}`;
    return Buffer.from(credentials).toString("base64");
  }

  private buildInventoryRequest(
    integration: ChannelIntegration,
    mapping: ChannelMapping
  ): any {
    // Build JSON request for inventory update
    return {
      hotel_id: integration.channelPropertyId,
      room_type_id: mapping.channelRoomTypeId,
      action: "update",
      inventory: {
        room_type: mapping.channelRoomTypeName,
        description: mapping.channelDescription || "",
      },
    };
  }

  private buildRateRequest(
    integration: ChannelIntegration,
    ratePlan: ChannelRatePlan
  ): any {
    // Build JSON request for rate update
    return {
      hotel_id: integration.channelPropertyId,
      rate_plan_id: ratePlan.channelRatePlanId,
      action: "update",
      rates: {
        base_rate: ratePlan.baseRate,
        currency: ratePlan.currency || "USD",
      },
    };
  }

  private buildAvailabilityRequest(
    integration: ChannelIntegration,
    availability: ChannelAvailability
  ): any {
    // Build JSON request for availability update
    return {
      hotel_id: integration.channelPropertyId,
      date: availability.date.toISOString().split("T")[0],
      action: "update",
      availability: {
        available_rooms: availability.availableRooms,
        total_rooms: availability.totalRooms,
      },
    };
  }

  private buildReservationRequest(
    integration: ChannelIntegration,
    guestData: any
  ): any {
    // Build JSON request for reservation creation
    return {
      hotel_id: integration.channelPropertyId,
      action: "create",
      reservation: {
        guest_name: guestData.fullName,
        check_in: guestData.startDate,
        check_out: guestData.endDate,
        room_type_id: guestData.roomTypeId,
      },
    };
  }

  private buildReservationUpdateRequest(
    integration: ChannelIntegration,
    guestId: string,
    updates: any
  ): any {
    // Build JSON request for reservation update
    return {
      hotel_id: integration.channelPropertyId,
      reservation_id: guestId,
      action: "update",
      updates: updates,
    };
  }

  private parseWebhookData(webhookData: any): any {
    // Parse Booking.com webhook data format
    try {
      if (typeof webhookData === "string") {
        return JSON.parse(webhookData);
      }
      return webhookData;
    } catch (error) {
      this.logger.error(`Failed to parse webhook data: ${error.message}`);
      return webhookData;
    }
  }

  private async processReservationWebhook(
    integration: ChannelIntegration,
    data: any
  ): Promise<any> {
    // Process new reservation webhook
    this.logger.log(
      `Processing reservation webhook for guest: ${data.guestName}`
    );
    return { processed: true, type: "reservation", guestId: data.guestId };
  }

  private async processCancellationWebhook(
    integration: ChannelIntegration,
    data: any
  ): Promise<any> {
    // Process cancellation webhook
    this.logger.log(
      `Processing cancellation webhook for guest: ${data.guestId}`
    );
    return { processed: true, type: "cancellation", guestId: data.guestId };
  }

  private async processModificationWebhook(
    integration: ChannelIntegration,
    data: any
  ): Promise<any> {
    // Process modification webhook
    this.logger.log(
      `Processing modification webhook for guest: ${data.guestId}`
    );
    return { processed: true, type: "modification", guestId: data.guestId };
  }
}
