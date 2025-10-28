import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { ChannelApiInterface } from "../channel-api.interface";
import { ChannelIntegration } from "../../entities/channel-integration.entity";
import { ChannelMapping } from "../../entities/channel-mapping.entity";
import { ChannelAvailability } from "../../entities/channel-availability.entity";
import { ChannelRatePlan } from "../../entities/channel-rate-plan.entity";

@Injectable()
export class SevenApiService implements ChannelApiInterface {
  private readonly logger = new Logger(SevenApiService.name);
  private readonly baseUrl = "https://api.7even.com/v1"; // Replace with actual 7even API URL
  private readonly httpService = new HttpService();

  // Hotel-specific configuration for 7even integration
  private readonly SUPPORTED_HOTEL_IDS = [1, 2, 3, 14, 20]; // Add specific hotel IDs that support 7even

  async testConnection(
    integration: Partial<ChannelIntegration>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      this.logger.log("Testing 7even connection...");

      // Check if this hotel is supported for 7even integration
      if (!this.isHotelSupported(integration.hotelId)) {
        throw new Error(
          `Hotel ID ${integration.hotelId} is not supported for 7even integration`
        );
      }

      // Test API credentials
      if (!integration.apiKey) {
        throw new Error("API key is required for 7even integration");
      }

      if (!integration.channelPropertyId) {
        throw new Error("Property ID is required for 7even integration");
      }

      // In development or explicit test mode, skip external API call
      const inDevMode = process.env.NODE_ENV === "development";
      const inTestMode = Boolean(integration.testMode);
      if (inDevMode || inTestMode) {
        this.logger.log(
          "Dev/Test mode: skipping external 7even API connectivity check"
        );
        return { success: true };
      }

      // Test actual connection to 7even API
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/properties/${integration.channelPropertyId}/status`,
          {
            headers: {
              Authorization: `Bearer ${integration.apiKey}`,
              "Content-Type": "application/json",
            },
          }
        )
      );

      if (response.status === 200) {
        this.logger.log("7even connection test successful");
        return { success: true };
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      this.logger.error(`7even connection test failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async updateInventory(
    integration: ChannelIntegration,
    mapping: ChannelMapping
  ): Promise<void> {
    try {
      this.logger.log(
        `Updating 7even inventory for room type: ${mapping.channelRoomTypeName}`
      );

      if (!this.isHotelSupported(integration.hotelId)) {
        throw new Error(
          `Hotel ID ${integration.hotelId} is not supported for 7even integration`
        );
      }

      const inventoryData = this.buildInventoryRequest(integration, mapping);

      await firstValueFrom(
        this.httpService.put(
          `${this.baseUrl}/properties/${integration.channelPropertyId}/inventory`,
          inventoryData,
          {
            headers: {
              Authorization: `Bearer ${integration.apiKey}`,
              "Content-Type": "application/json",
            },
          }
        )
      );

      this.logger.log("7even inventory update successful");
    } catch (error) {
      this.logger.error(`7even inventory update failed: ${error.message}`);
      throw error;
    }
  }

  async updateRates(
    integration: ChannelIntegration,
    ratePlan: ChannelRatePlan
  ): Promise<void> {
    try {
      this.logger.log(
        `Updating 7even rates for rate plan: ${ratePlan.channelRatePlanName}`
      );

      if (!this.isHotelSupported(integration.hotelId)) {
        throw new Error(
          `Hotel ID ${integration.hotelId} is not supported for 7even integration`
        );
      }

      const rateData = this.buildRateRequest(integration, ratePlan);

      await firstValueFrom(
        this.httpService.put(
          `${this.baseUrl}/properties/${integration.channelPropertyId}/rates`,
          rateData,
          {
            headers: {
              Authorization: `Bearer ${integration.apiKey}`,
              "Content-Type": "application/json",
            },
          }
        )
      );

      this.logger.log("7even rate update successful");
    } catch (error) {
      this.logger.error(`7even rate update failed: ${error.message}`);
      throw error;
    }
  }

  async updateAvailability(
    integration: ChannelIntegration,
    availability: ChannelAvailability
  ): Promise<void> {
    try {
      this.logger.log(
        `Updating 7even availability for date: ${availability.date}`
      );

      if (!this.isHotelSupported(integration.hotelId)) {
        throw new Error(
          `Hotel ID ${integration.hotelId} is not supported for 7even integration`
        );
      }

      const availabilityData = this.buildAvailabilityRequest(
        integration,
        availability
      );

      await firstValueFrom(
        this.httpService.put(
          `${this.baseUrl}/properties/${integration.channelPropertyId}/availability`,
          availabilityData,
          {
            headers: {
              Authorization: `Bearer ${integration.apiKey}`,
              "Content-Type": "application/json",
            },
          }
        )
      );

      this.logger.log("7even availability update successful");
    } catch (error) {
      this.logger.error(`7even availability update failed: ${error.message}`);
      throw error;
    }
  }

  async processWebhook(
    integration: ChannelIntegration,
    webhookData: any
  ): Promise<any> {
    try {
      this.logger.log("Processing 7even webhook...");

      if (!this.isHotelSupported(integration.hotelId)) {
        throw new Error(
          `Hotel ID ${integration.hotelId} is not supported for 7even integration`
        );
      }

      const parsedData = this.parseWebhookData(webhookData);

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
      this.logger.error(`7even webhook processing failed: ${error.message}`);
      throw error;
    }
  }

  async createGuestReservation(
    integration: ChannelIntegration,
    guestData: any
  ): Promise<any> {
    try {
      this.logger.log("Creating 7even guest reservation...");

      if (!this.isHotelSupported(integration.hotelId)) {
        throw new Error(
          `Hotel ID ${integration.hotelId} is not supported for 7even integration`
        );
      }

      const reservationData = this.buildReservationRequest(
        integration,
        guestData
      );

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/properties/${integration.channelPropertyId}/reservations`,
          reservationData,
          {
            headers: {
              Authorization: `Bearer ${integration.apiKey}`,
              "Content-Type": "application/json",
            },
          }
        )
      );

      this.logger.log("7even guest reservation created successfully");
      return response.data;
    } catch (error) {
      this.logger.error(
        `7even guest reservation creation failed: ${error.message}`
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
      this.logger.log(`Updating 7even guest reservation: ${guestId}`);

      if (!this.isHotelSupported(integration.hotelId)) {
        throw new Error(
          `Hotel ID ${integration.hotelId} is not supported for 7even integration`
        );
      }

      const updateData = this.buildReservationUpdateRequest(
        integration,
        guestId,
        updates
      );

      const response = await firstValueFrom(
        this.httpService.put(
          `${this.baseUrl}/properties/${integration.channelPropertyId}/reservations/${guestId}`,
          updateData,
          {
            headers: {
              Authorization: `Bearer ${integration.apiKey}`,
              "Content-Type": "application/json",
            },
          }
        )
      );

      this.logger.log("7even guest reservation updated successfully");
      return response.data;
    } catch (error) {
      this.logger.error(
        `7even guest reservation update failed: ${error.message}`
      );
      throw error;
    }
  }

  async cancelGuestReservation(
    integration: ChannelIntegration,
    guestId: string
  ): Promise<any> {
    try {
      this.logger.log(`Cancelling 7even guest reservation: ${guestId}`);

      if (!this.isHotelSupported(integration.hotelId)) {
        throw new Error(
          `Hotel ID ${integration.hotelId} is not supported for 7even integration`
        );
      }

      const response = await firstValueFrom(
        this.httpService.delete(
          `${this.baseUrl}/properties/${integration.channelPropertyId}/reservations/${guestId}`,
          {
            headers: {
              Authorization: `Bearer ${integration.apiKey}`,
              "Content-Type": "application/json",
            },
          }
        )
      );

      this.logger.log("7even guest reservation cancelled successfully");
      return response.data;
    } catch (error) {
      this.logger.error(
        `7even guest reservation cancellation failed: ${error.message}`
      );
      throw error;
    }
  }

  async getChannelInfo(integration: ChannelIntegration): Promise<any> {
    try {
      this.logger.log("Getting 7even channel info...");

      if (!this.isHotelSupported(integration.hotelId)) {
        throw new Error(
          `Hotel ID ${integration.hotelId} is not supported for 7even integration`
        );
      }

      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/properties/${integration.channelPropertyId}`,
          {
            headers: {
              Authorization: `Bearer ${integration.apiKey}`,
            },
          }
        )
      );

      return {
        channel: "7even",
        status: "active",
        hotelInfo: response.data,
        supportedHotel: true,
      };
    } catch (error) {
      this.logger.error(`Failed to get 7even channel info: ${error.message}`);
      throw error;
    }
  }

  async validateCredentials(
    integration: Partial<ChannelIntegration>
  ): Promise<boolean> {
    const testResult = await this.testConnection(integration);
    return testResult.success;
  }

  // Hotel-specific validation method
  private isHotelSupported(hotelId: number): boolean {
    return this.SUPPORTED_HOTEL_IDS.includes(hotelId);
  }

  // Private helper methods
  private buildInventoryRequest(
    integration: ChannelIntegration,
    mapping: ChannelMapping
  ): any {
    return {
      propertyId: integration.channelPropertyId,
      roomType: {
        id: mapping.channelRoomTypeId,
        name: mapping.channelRoomTypeName,
        description: mapping.channelDescription || "",
        amenities: mapping.channelAmenities || [],
        images: mapping.channelImages || [],
        capacity: mapping.mappingRules?.capacity || 2,
      },
      hotelSpecific: {
        hotelId: integration.hotelId,
        customSettings: integration.channelSettings || {},
      },
    };
  }

  private buildRateRequest(
    integration: ChannelIntegration,
    ratePlan: ChannelRatePlan
  ): any {
    return {
      propertyId: integration.channelPropertyId,
      ratePlan: {
        id: ratePlan.channelRatePlanId,
        name: ratePlan.channelRatePlanName,
        baseRate: ratePlan.baseRate,
        currency: ratePlan.currency,
      },
      hotelSpecific: {
        hotelId: integration.hotelId,
        customPricing: integration.channelSettings?.pricing || {},
      },
    };
  }

  private buildAvailabilityRequest(
    integration: ChannelIntegration,
    availability: ChannelAvailability
  ): any {
    return {
      propertyId: integration.channelPropertyId,
      date: availability.date,
      roomTypeId: availability.roomtypeId,
      availability: {
        total: availability.totalRooms,
        available: availability.availableRooms,
        occupied: availability.occupiedRooms,
        blocked: availability.blockedRooms,
        status: availability.status,
      },
      hotelSpecific: {
        hotelId: integration.hotelId,
        restrictions: availability.restrictions || {},
      },
    };
  }

  private buildReservationRequest(
    integration: ChannelIntegration,
    guestData: any
  ): any {
    return {
      propertyId: integration.channelPropertyId,
      guest: guestData,
      hotelSpecific: {
        hotelId: integration.hotelId,
        customFields: integration.channelSettings?.guestFields || {},
      },
    };
  }

  private buildReservationUpdateRequest(
    integration: ChannelIntegration,
    guestId: string,
    updates: any
  ): any {
    return {
      propertyId: integration.channelPropertyId,
      guestId: guestId,
      updates: updates,
      hotelSpecific: {
        hotelId: integration.hotelId,
        customFields: integration.channelSettings?.guestFields || {},
      },
    };
  }

  private parseWebhookData(webhookData: any): any {
    return {
      type: webhookData.event_type || "unknown",
      data: webhookData.data || {},
      timestamp: webhookData.timestamp || new Date(),
      propertyId: webhookData.property_id,
    };
  }

  private async processReservationWebhook(
    integration: ChannelIntegration,
    data: any
  ): Promise<any> {
    this.logger.log("Processing 7even reservation webhook");
    // Canonical reservation summary to drive availability updates downstream
    const payload = data?.data ?? {};
    const reservationSummary = {
      channelRoomTypeId: payload.room_type_id,
      checkIn: payload.check_in,
      checkOut: payload.check_out,
      rooms: payload.rooms ?? 1,
    };

    // Build Oreon-compatible CreateGuestDto payload (best-effort mapping)
    const oreonGuestDto = this.buildOreonCreateGuestDto(integration, payload);

    // Standardized public reservation event payload for external consumers (snake_case)
    const standardized = {
      version: "v1",
      channel: "seven",
      event: "reservation",
      hotel_id: integration.hotelId,
      reservation: {
        guest: {
          full_name: oreonGuestDto.fullName,
          email: oreonGuestDto.email,
          phone_number: oreonGuestDto.phoneNumber,
          phoneNumber: oreonGuestDto.phoneNumber,
          address: payload.address || payload.guest_address,
        },
        stay: {
          roomtype_id: oreonGuestDto.roomtype,
          room_number: oreonGuestDto.roomNumber,
          start_date: oreonGuestDto.startDate,
          end_date: oreonGuestDto.endDate,
          number_of_guests: oreonGuestDto.numberOfGuests,
        },
        payment: {
          amount_paid: oreonGuestDto.amountPaid,
          outstanding: oreonGuestDto.outstanding,
          payment_method: oreonGuestDto.paymentMethod,
          receiving_account: oreonGuestDto.receivingAccount,
        },
        meta: {
          created_at: oreonGuestDto.createdAt,
          source_reservation_id:
            payload.reservation_id || payload.booking_id || payload.id,
        },
      },
      oreon_guest_dto: oreonGuestDto,
    };

    return {
      processed: true,
      type: "reservation",
      data,
      reservationSummary,
      ...standardized,
    };
  }

  // --- Oreon mapping helpers ---
  private normalizePhoneNumber(raw?: string): string | undefined {
    if (!raw || typeof raw !== "string") return undefined;
    const trimmed = raw.trim();
    // Remove spaces and dashes
    const digits = trimmed.replace(/[^+\d]/g, "");
    // Ensure starts with + or leading digit
    if (digits.startsWith("+")) return digits;
    // If already looks like E.164 without +, prepend it
    return `+${digits}`;
  }

  private buildOreonCreateGuestDto(
    integration: ChannelIntegration,
    payload: any
  ): any {
    const fullName = payload.guest?.name;
    const email = payload.guest?.email;
    const phone = this.normalizePhoneNumber(
      payload.guest?.phone || payload.guest?.phoneNumber
    );

    const roomtypeRaw = payload.room_type_id;
    const roomtypeNum = Number(roomtypeRaw);
    const roomtype = Number.isFinite(roomtypeNum) ? roomtypeNum : undefined;
    if (roomtype === undefined) {
      this.logger.warn(`[7even] Non-numeric room_type_id: ${roomtypeRaw}`);
    }

    const startDate = payload.check_in;
    const endDate = payload.check_out;
    const roomNumber = payload.room_number ?? payload.roomNumber ?? "";
    const numberOfGuests =
      payload.number_of_guests ??
      payload.numberOfGuests ??
      payload.guests ??
      payload.rooms ??
      1;

    return {
      // Required string fields
      fullName,
      email,
      phoneNumber: phone,
      property: payload.property_id || integration.channelPropertyId,
      roomNumber,
      // Required dates and ints
      createdAt: new Date(),
      roomtype,
      startDate,
      endDate,
      numberOfGuests,
      // Required settlement fields with sensible defaults
      paymentMethod: "CHANNEL_MANAGER",
      receivingAccount: "OTA",
      // Optional financials
      amountPaid: Number(payload.amount_paid ?? 0),
      outstanding: Number(payload.outstanding ?? 0),
      // Source tracking
      reservationSource:
        integration?.channelName || integration?.channelType || "seven",
      sourceReservationId:
        payload?.source_reservation_id ||
        payload?.reservation_id ||
        payload?.booking_id ||
        payload?.id ||
        undefined,
    };
  }

  private async processCancellationWebhook(
    integration: ChannelIntegration,
    data: any
  ): Promise<any> {
    this.logger.log("Processing 7even cancellation webhook");
    return { processed: true, type: "cancellation", data };
  }

  private async processModificationWebhook(
    integration: ChannelIntegration,
    data: any
  ): Promise<any> {
    this.logger.log("Processing 7even modification webhook");
    return { processed: true, type: "modification", data };
  }
}