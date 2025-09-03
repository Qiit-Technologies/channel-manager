import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ChannelApiInterface } from "../channel-api.interface";
import { ChannelIntegration } from "../../entities/channel-integration.entity";
import { ChannelAvailability } from "../../entities/channel-availability.entity";
import { ChannelRatePlan } from "../../entities/channel-rate-plan.entity";
import { ChannelMapping } from "../../entities/channel-mapping.entity";
import * as crypto from "crypto";

@Injectable()
export class HotelbedsApiService implements ChannelApiInterface {
  private readonly logger = new Logger(HotelbedsApiService.name);
  private readonly httpService = new HttpService();
  private readonly baseUrl = "https://api.hotelbeds.com";

  async testConnection(
    integration: Partial<ChannelIntegration>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      this.logger.log("Testing Hotelbeds connection...");

      const { signature, timestamp } = this.generateSignature(
        integration.apiKey || "6d6c41d2164b4516d6495374398421e6",
        integration.apiSecret || "8dce1a2dbe"
      );

      const response = await this.httpService.axiosRef.get(
        `${this.baseUrl}/hotel-content-api/1.0/hotels`,
        {
          headers: {
            "Api-Key": integration.apiKey || "6d6c41d2164b4516d6495374398421e6",
            "X-Signature": signature,
            "X-Timestamp": timestamp.toString(),
            Accept: "application/json",
          },
          params: {
            fields: "basic",
            from: 1,
            to: 1,
          },
        }
      );

      this.logger.log("Hotelbeds connection test successful");
      return { success: true };
    } catch (error) {
      this.logger.error(`Hotelbeds connection test failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async getChannelInfo(integration: ChannelIntegration): Promise<any> {
    try {
      const { signature, timestamp } = this.generateSignature(
        integration.apiKey || "6d6c41d2164b4516d6495374398421e6",
        integration.apiSecret || "your-hotelbeds-api-secret"
      );

      const response = await this.httpService.axiosRef.get(
        `${this.baseUrl}/hotel-content-api/1.0/hotels`,
        {
          headers: {
            "Api-Key": integration.apiKey || "6d6c41d2164b4516d6495374398421e6",
            "X-Signature": signature,
            "X-Timestamp": timestamp.toString(),
            Accept: "application/json",
          },
          params: {
            fields: "basic",
            from: 1,
            to: 10,
          },
        }
      );

      return {
        channelType: "HOTELBEDS",
        apiVersion: "1.0",
        baseUrl: this.baseUrl,
        hotelsCount: response.data.total || 0,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get Hotelbeds channel info: ${error.message}`
      );
      throw error;
    }
  }

  async updateInventory(
    integration: ChannelIntegration,
    mapping: ChannelMapping
  ): Promise<void> {
    try {
      this.logger.log("Updating inventory on Hotelbeds...");

      const { signature, timestamp } = this.generateSignature(
        integration.apiKey || "6d6c41d2164b4516d6495374398421e6",
        integration.apiSecret || "your-hotelbeds-api-secret"
      );

      // Hotelbeds inventory update endpoint
      await this.httpService.axiosRef.post(
        `${this.baseUrl}/hotel-api/1.0/inventory`,
        {
          hotel: integration.hotelId,
          room: mapping.roomtypeId,
          available: mapping.isActive,
        },
        {
          headers: {
            "Api-Key": integration.apiKey || "6d6c41d2164b4516d6495374398421e6",
            "X-Signature": signature,
            "X-Timestamp": timestamp.toString(),
            "Content-Type": "application/json",
          },
        }
      );

      this.logger.log("Inventory update successful");
    } catch (error) {
      this.logger.error(`Inventory update failed: ${error.message}`);
      throw error;
    }
  }

  async updateRates(
    integration: ChannelIntegration,
    ratePlan: ChannelRatePlan
  ): Promise<void> {
    try {
      this.logger.log("Updating rates on Hotelbeds...");

      const { signature, timestamp } = this.generateSignature(
        integration.apiKey || "6d6c41d2164b4516d6495374398421e6",
        integration.apiSecret || "your-hotelbeds-api-secret"
      );

      // Hotelbeds rate update endpoint
      await this.httpService.axiosRef.post(
        `${this.baseUrl}/hotel-api/1.0/rates`,
        {
          rate: {
            hotel: integration.hotelId,
            room: ratePlan.roomtypeId,
            board: "RO",
            price: ratePlan.baseRate,
            currency: ratePlan.currency || "USD",
          },
        },
        {
          headers: {
            "Api-Key": integration.apiKey || "6d6c41d2164b4516d6495374398421e6",
            "X-Signature": signature,
            "X-Timestamp": timestamp.toString(),
            "Content-Type": "application/json",
          },
        }
      );

      this.logger.log("Rate update successful");
    } catch (error) {
      this.logger.error(`Rate update failed: ${error.message}`);
      throw error;
    }
  }

  async updateAvailability(
    integration: ChannelIntegration,
    availability: ChannelAvailability
  ): Promise<void> {
    try {
      this.logger.log("Updating availability on Hotelbeds...");

      const { signature, timestamp } = this.generateSignature(
        integration.apiKey || "6d6c41d2164b4516d6495374398421e6",
        integration.apiSecret || "your-hotelbeds-api-secret"
      );

      // Hotelbeds availability update endpoint
      await this.httpService.axiosRef.post(
        `${this.baseUrl}/hotel-api/1.0/availability`,
        {
          hotel: integration.hotelId,
          room: availability.roomtypeId,
          date: availability.date,
          available: availability.status === "AVAILABLE",
          rooms: availability.availableRooms,
        },
        {
          headers: {
            "Api-Key": integration.apiKey || "6d6c41d2164b4516d6495374398421e6",
            "X-Signature": signature,
            "X-Timestamp": timestamp.toString(),
            "Content-Type": "application/json",
          },
        }
      );

      this.logger.log("Availability update successful");
    } catch (error) {
      this.logger.error(`Availability update failed: ${error.message}`);
      throw error;
    }
  }

  async getBookings(
    integration: ChannelIntegration,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<any[]> {
    try {
      const { signature, timestamp } = this.generateSignature(
        integration.apiKey || "6d6c41d2164b4516d6495374398421e6",
        integration.apiSecret || "your-hotelbeds-api-secret"
      );

      const response = await this.httpService.axiosRef.get(
        `${this.baseUrl}/hotel-api/1.0/bookings`,
        {
          headers: {
            "Api-Key": integration.apiKey || "6d6c41d2164b4516d6495374398421e6",
            "X-Signature": signature,
            "X-Timestamp": timestamp.toString(),
            Accept: "application/json",
          },
          params: {
            from: dateFrom?.toISOString().split("T")[0],
            to: dateTo?.toISOString().split("T")[0],
          },
        }
      );

      return response.data.bookings || [];
    } catch (error) {
      this.logger.error(`Failed to get bookings: ${error.message}`);
      return [];
    }
  }

  async updateBooking(
    integration: ChannelIntegration,
    bookingId: string,
    updates: any
  ): Promise<boolean> {
    try {
      const { signature, timestamp } = this.generateSignature(
        integration.apiKey || "6d6c41d2164b4516d6495374398421e6",
        integration.apiSecret || "your-hotelbeds-api-secret"
      );

      const response = await this.httpService.axiosRef.put(
        `${this.baseUrl}/hotel-api/1.0/bookings/${bookingId}`,
        updates,
        {
          headers: {
            "Api-Key": integration.apiKey || "6d6c41d2164b4516d6495374398421e6",
            "X-Signature": signature,
            "X-Timestamp": timestamp.toString(),
            "Content-Type": "application/json",
          },
        }
      );

      return response.status === 200;
    } catch (error) {
      this.logger.error(`Failed to update booking: ${error.message}`);
      return false;
    }
  }

  async processWebhook(
    integration: ChannelIntegration,
    webhookData: any
  ): Promise<any> {
    try {
      this.logger.log("Processing Hotelbeds webhook...");
      // Process webhook data from Hotelbeds
      return { success: true, data: webhookData };
    } catch (error) {
      this.logger.error(`Webhook processing failed: ${error.message}`);
      throw error;
    }
  }

  async createGuestReservation(
    integration: ChannelIntegration,
    guestData: any
  ): Promise<any> {
    try {
      this.logger.log("Creating guest reservation on Hotelbeds...");

      const { signature, timestamp } = this.generateSignature(
        integration.apiKey || "6d6c41d2164b4516d6495374398421e6",
        integration.apiSecret || "your-hotelbeds-api-secret"
      );

      const response = await this.httpService.axiosRef.post(
        `${this.baseUrl}/hotel-api/1.0/bookings`,
        guestData,
        {
          headers: {
            "Api-Key": integration.apiKey || "6d6c41d2164b4516d6495374398421e6",
            "X-Signature": signature,
            "X-Timestamp": timestamp.toString(),
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Guest reservation creation failed: ${error.message}`);
      throw error;
    }
  }

  async updateGuestReservation(
    integration: ChannelIntegration,
    guestId: string,
    updates: any
  ): Promise<any> {
    try {
      this.logger.log("Updating guest reservation on Hotelbeds...");

      const { signature, timestamp } = this.generateSignature(
        integration.apiKey || "6d6c41d2164b4516d6495374398421e6",
        integration.apiSecret || "your-hotelbeds-api-secret"
      );

      const response = await this.httpService.axiosRef.put(
        `${this.baseUrl}/hotel-api/1.0/bookings/${guestId}`,
        updates,
        {
          headers: {
            "Api-Key": integration.apiKey || "6d6c41d2164b4516d6495374398421e6",
            "X-Signature": signature,
            "X-Timestamp": timestamp.toString(),
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Guest reservation update failed: ${error.message}`);
      throw error;
    }
  }

  async cancelGuestReservation(
    integration: ChannelIntegration,
    guestId: string
  ): Promise<any> {
    try {
      this.logger.log("Cancelling guest reservation on Hotelbeds...");

      const { signature, timestamp } = this.generateSignature(
        integration.apiKey || "6d6c41d2164b4516d6495374398421e6",
        integration.apiSecret || "your-hotelbeds-api-secret"
      );

      const response = await this.httpService.axiosRef.delete(
        `${this.baseUrl}/hotel-api/1.0/bookings/${guestId}`,
        {
          headers: {
            "Api-Key": integration.apiKey || "6d6c41d2164b4516d6495374398421e6",
            "X-Signature": signature,
            "X-Timestamp": timestamp.toString(),
          },
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Guest reservation cancellation failed: ${error.message}`
      );
      throw error;
    }
  }

  async validateCredentials(
    integration: Partial<ChannelIntegration>
  ): Promise<boolean> {
    try {
      const result = await this.testConnection(integration);
      return result.success;
    } catch (error) {
      return false;
    }
  }

  async getChannelFeatures(): Promise<string[]> {
    return [
      "AVAILABILITY_SYNC",
      "RATE_SYNC",
      "BOOKING_MANAGEMENT",
      "CONTENT_MANAGEMENT",
      "REAL_TIME_UPDATES",
    ];
  }

  private generateSignature(
    apiKey: string,
    apiSecret: string
  ): { signature: string; timestamp: number } {
    const timestamp = Math.floor(Date.now() / 1000);
    const message = `${apiKey}${apiSecret}${timestamp}`;
    const signature = crypto.createHash("sha256").update(message).digest("hex");

    return { signature, timestamp };
  }

  private buildAvailabilityRequest(availability: ChannelAvailability): any {
    return {
      room: availability.roomtypeId,
      date: availability.date,
      available: availability.status === "AVAILABLE",
      rooms: availability.availableRooms,
    };
  }

  private buildRateRequest(rate: ChannelRatePlan): any {
    return {
      room: rate.roomtypeId,
      board: "RO",
      price: rate.baseRate,
      currency: rate.currency || "USD",
    };
  }
}
