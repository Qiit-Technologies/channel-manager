import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { ChannelApiInterface } from "../channel-api.interface";
import { ChannelIntegration } from "../../entities/channel-integration.entity";
import { ChannelMapping } from "../../entities/channel-mapping.entity";
import { ChannelAvailability } from "../../entities/channel-availability.entity";
import { ChannelRatePlan } from "../../entities/channel-rate-plan.entity";

@Injectable()
export class CustomApiService implements ChannelApiInterface {
  private readonly logger = new Logger(CustomApiService.name);
  private readonly httpService = new HttpService();

  async testConnection(
    integration: Partial<ChannelIntegration>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      this.logger.log("Testing Custom API connection...");

      // Test API credentials by making a simple request to get property info
      const apiEndpoint =
        integration.channelSettings?.apiEndpoint || integration.webhookUrl;
      if (!apiEndpoint) {
        return { success: false, error: "No API endpoint configured" };
      }

      const response = await firstValueFrom(
        this.httpService.get(`${apiEndpoint}/health`, {
          headers: {
            Authorization: `Bearer ${integration.accessToken}`,
            "Content-Type": "application/json",
          },
        })
      );

      if (response.status === 200) {
        this.logger.log("Custom API connection test successful");
        return { success: true };
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      this.logger.error(`Custom API connection test failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async updateInventory(
    integration: ChannelIntegration,
    mapping: ChannelMapping
  ): Promise<void> {
    try {
      this.logger.log(
        `Updating Custom API inventory for: ${mapping.channelRoomTypeName}`
      );

      // Custom API inventory update
      const inventoryData = this.buildInventoryRequest(integration, mapping);
      const apiEndpoint =
        integration.channelSettings?.apiEndpoint || integration.webhookUrl;

      const response = await firstValueFrom(
        this.httpService.put(
          `${apiEndpoint}/inventory/${mapping.channelRoomTypeId}`,
          inventoryData,
          {
            headers: {
              Authorization: `Bearer ${integration.accessToken}`,
              "Content-Type": "application/json",
            },
          }
        )
      );

      if (response.status !== 200) {
        throw new Error(
          `Failed to update Custom API inventory: ${response.statusText}`
        );
      }

      this.logger.log(
        `Custom API inventory updated successfully for: ${mapping.channelRoomTypeName}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to update Custom API inventory: ${error.message}`
      );
      throw error;
    }
  }

  async updateRates(
    integration: ChannelIntegration,
    ratePlan: ChannelRatePlan
  ): Promise<void> {
    try {
      this.logger.log(
        `Updating Custom API rates for: ${ratePlan.channelRatePlanName}`
      );

      // Custom API rate update
      const rateData = this.buildRateRequest(integration, ratePlan);

      const response = await firstValueFrom(
        this.httpService.put(
          `${this.getApiEndpoint(integration)}/rates/${ratePlan.channelRatePlanId}`,
          rateData,
          {
            headers: {
              Authorization: `Bearer ${integration.accessToken}`,
              "Content-Type": "application/json",
            },
          }
        )
      );

      if (response.status !== 200) {
        throw new Error(
          `Failed to update Custom API rates: ${response.statusText}`
        );
      }

      this.logger.log(
        `Custom API rates updated successfully for: ${ratePlan.channelRatePlanName}`
      );
    } catch (error) {
      this.logger.error(`Failed to update Custom API rates: ${error.message}`);
      throw error;
    }
  }

  async updateAvailability(
    integration: ChannelIntegration,
    availability: ChannelAvailability
  ): Promise<void> {
    try {
      this.logger.log(
        `Updating Custom API availability for date: ${availability.date}`
      );

      // Custom API availability update
      const availabilityData = this.buildAvailabilityRequest(
        integration,
        availability
      );

      const response = await firstValueFrom(
        this.httpService.put(
          `${this.getApiEndpoint(integration)}/availability`,
          availabilityData,
          {
            headers: {
              Authorization: `Bearer ${integration.accessToken}`,
              "Content-Type": "application/json",
            },
          }
        )
      );

      if (response.status !== 200) {
        throw new Error(
          `Failed to update Custom API availability: ${response.statusText}`
        );
      }

      this.logger.log(
        `Custom API availability updated successfully for date: ${availability.date}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to update Custom API availability: ${error.message}`
      );
      throw error;
    }
  }

  async processWebhook(
    integration: ChannelIntegration,
    webhookData: any
  ): Promise<any> {
    try {
      this.logger.log("Processing Custom API webhook...");

      // Parse Custom API webhook data
      const parsedData = this.parseWebhookData(webhookData);

      // Process based on webhook type
      switch (parsedData.event_type) {
        case "RESERVATION_CREATED":
          return await this.processReservationWebhook(integration, parsedData);
        case "RESERVATION_CANCELLED":
          return await this.processCancellationWebhook(integration, parsedData);
        case "RESERVATION_MODIFIED":
          return await this.processModificationWebhook(integration, parsedData);
        case "INVENTORY_UPDATED":
          return await this.processInventoryWebhook(integration, parsedData);
        default:
          this.logger.warn(
            `Unknown Custom API webhook type: ${parsedData.event_type}`
          );
          return { processed: false, reason: "Unknown webhook type" };
      }
    } catch (error) {
      this.logger.error(
        `Failed to process Custom API webhook: ${error.message}`
      );
      throw error;
    }
  }

  async createGuestReservation(
    integration: ChannelIntegration,
    guestData: any
  ): Promise<any> {
    try {
      this.logger.log("Creating Custom API guest reservation...");

      const reservationData = this.buildReservationRequest(
        integration,
        guestData
      );

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.getApiEndpoint(integration)}/reservations`,
          reservationData,
          {
            headers: {
              Authorization: `Bearer ${integration.accessToken}`,
              "Content-Type": "application/json",
            },
          }
        )
      );

      if (response.status !== 201) {
        throw new Error(
          `Failed to create Custom API reservation: ${response.statusText}`
        );
      }

      this.logger.log("Custom API guest reservation created successfully");
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to create Custom API guest reservation: ${error.message}`
      );
      throw error;
    }
  }

  async updateGuestReservation(
    integration: ChannelIntegration,
    guestId: string,
    updates: any
  ): Promise<any> {
    try {
      this.logger.log(`Updating Custom API guest reservation: ${guestId}`);

      const updateData = this.buildReservationUpdateRequest(
        integration,
        guestId,
        updates
      );

      const response = await firstValueFrom(
        this.httpService.put(
          `${this.getApiEndpoint(integration)}/reservations/${guestId}`,
          updateData,
          {
            headers: {
              Authorization: `Bearer ${integration.accessToken}`,
              "Content-Type": "application/json",
            },
          }
        )
      );

      if (response.status !== 200) {
        throw new Error(
          `Failed to update Custom API reservation: ${response.statusText}`
        );
      }

      this.logger.log("Custom API guest reservation updated successfully");
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to update Custom API guest reservation: ${error.message}`
      );
      throw error;
    }
  }

  async cancelGuestReservation(
    integration: ChannelIntegration,
    guestId: string
  ): Promise<any> {
    try {
      this.logger.log(`Cancelling Custom API guest reservation: ${guestId}`);

      const response = await firstValueFrom(
        this.httpService.delete(
          `${this.getApiEndpoint(integration)}/reservations/${guestId}`,
          {
            headers: {
              Authorization: `Bearer ${integration.accessToken}`,
            },
          }
        )
      );

      if (response.status !== 200) {
        throw new Error(
          `Failed to cancel Custom API reservation: ${response.statusText}`
        );
      }

      this.logger.log("Custom API guest reservation cancelled successfully");
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to cancel Custom API guest reservation: ${error.message}`
      );
      throw error;
    }
  }

  async getChannelInfo(integration: ChannelIntegration): Promise<any> {
    try {
      this.logger.log("Getting Custom API channel info...");

      const response = await firstValueFrom(
        this.httpService.get(`${this.getApiEndpoint(integration)}/info`, {
          headers: {
            Authorization: `Bearer ${integration.accessToken}`,
          },
        })
      );

      return {
        channel: "Custom API",
        status: "active",
        apiInfo: response.data,
        endpoint: this.getApiEndpoint(integration),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get Custom API channel info: ${error.message}`
      );
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
  private getApiEndpoint(integration: Partial<ChannelIntegration>): string {
    const endpoint =
      integration.channelSettings?.apiEndpoint || integration.webhookUrl;
    if (!endpoint) {
      throw new Error("No API endpoint configured");
    }
    return endpoint;
  }

  private buildInventoryRequest(
    integration: ChannelIntegration,
    mapping: ChannelMapping
  ): any {
    return {
      room_type: {
        id: mapping.channelRoomTypeId,
        name: mapping.channelRoomTypeName,
        description: mapping.channelDescription || "",
        amenities: mapping.channelAmenities || [],
        images: mapping.channelImages || [],
        capacity: mapping.mappingRules?.capacity || 2,
        custom_fields: mapping.mappingRules?.customFields || {},
      },
    };
  }

  private buildRateRequest(
    integration: ChannelIntegration,
    ratePlan: ChannelRatePlan
  ): any {
    return {
      rate_plan: {
        id: ratePlan.channelRatePlanId,
        name: ratePlan.channelRatePlanName,
        base_rate: ratePlan.baseRate,
        currency: ratePlan.currency || "USD",
        seasonal_rates: ratePlan.seasonalRates || {},
        day_of_week_rates: ratePlan.dayOfWeekRates || {},
        special_dates: ratePlan.specialDates || {},
        restrictions: ratePlan.restrictions || {},
        custom_fields: {},
      },
    };
  }

  private buildAvailabilityRequest(
    integration: ChannelIntegration,
    availability: ChannelAvailability
  ): any {
    return {
      availability: {
        date: availability.date.toISOString().split("T")[0],
        room_type_id: availability.roomtypeId || "",
        available_rooms: availability.availableRooms,
        total_rooms: availability.totalRooms,
        status: availability.status === "AVAILABLE" ? "OPEN" : "CLOSED",
        restrictions: availability.restrictions || {},
        custom_fields: {},
      },
    };
  }

  private buildReservationRequest(
    integration: ChannelIntegration,
    guestData: any
  ): any {
    return {
      reservation: {
        hotel_id: integration.channelPropertyId,
        guest_name: guestData.fullName,
        check_in: guestData.startDate,
        check_out: guestData.endDate,
        room_type_id: guestData.roomTypeId,
        number_of_guests: guestData.numberOfGuests || 1,
        total_price: guestData.finalPrice,
        currency: guestData.currency || "USD",
        custom_fields: guestData.customFields || {},
      },
    };
  }

  private buildReservationUpdateRequest(
    integration: ChannelIntegration,
    guestId: string,
    updates: any
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
        `Failed to parse Custom API webhook data: ${error.message}`
      );
      return webhookData;
    }
  }

  private async processReservationWebhook(
    integration: ChannelIntegration,
    data: any
  ): Promise<any> {
    this.logger.log(
      `Processing Custom API reservation webhook for guest: ${data.guest_name}`
    );
    return {
      processed: true,
      type: "reservation",
      guestId: data.reservation_id,
    };
  }

  private async processCancellationWebhook(
    integration: ChannelIntegration,
    data: any
  ): Promise<any> {
    this.logger.log(
      `Processing Custom API cancellation webhook for reservation: ${data.reservation_id}`
    );
    return {
      processed: true,
      type: "cancellation",
      guestId: data.reservation_id,
    };
  }

  private async processModificationWebhook(
    integration: ChannelIntegration,
    data: any
  ): Promise<any> {
    this.logger.log(
      `Processing Custom API modification webhook for reservation: ${data.reservation_id}`
    );
    return {
      processed: true,
      type: "modification",
      guestId: data.reservation_id,
    };
  }

  private async processInventoryWebhook(
    integration: ChannelIntegration,
    data: any
  ): Promise<any> {
    this.logger.log(
      `Processing Custom API inventory webhook for room type: ${data.room_type_id}`
    );
    return {
      processed: true,
      type: "inventory",
      roomTypeId: data.room_type_id,
    };
  }
}
