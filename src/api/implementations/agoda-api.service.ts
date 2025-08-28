import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ChannelApiInterface } from '../channel-api.interface';
import { ChannelIntegration } from '../../entities/channel-integration.entity';
import { ChannelMapping } from '../../entities/channel-mapping.entity';
import { ChannelAvailability } from '../../entities/channel-availability.entity';
import { ChannelRatePlan } from '../../entities/channel-rate-plan.entity';

@Injectable()
export class AgodaApiService implements ChannelApiInterface {
  private readonly logger = new Logger(AgodaApiService.name);
  private readonly baseUrl = 'https://api.agoda.com/v1';
  private readonly httpService = new HttpService();

  async testConnection(
    integration: Partial<ChannelIntegration>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      this.logger.log('Testing Agoda connection...');

      // Test API credentials by making a simple request to get hotel info
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/hotels/${integration.channelPropertyId}`,
          {
            headers: {
              Authorization: `Bearer ${integration.accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      if (response.status === 200) {
        this.logger.log('Agoda connection test successful');
        return { success: true };
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      this.logger.error(`Agoda connection test failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async updateInventory(
    integration: ChannelIntegration,
    mapping: ChannelMapping,
  ): Promise<void> {
    try {
      this.logger.log(
        `Updating Agoda inventory for: ${mapping.channelRoomTypeName}`,
      );

      // Agoda inventory update
      const inventoryData = this.buildInventoryRequest(integration, mapping);

      const response = await firstValueFrom(
        this.httpService.put(
          `${this.baseUrl}/hotels/${integration.channelPropertyId}/room-types/${mapping.channelRoomTypeId}`,
          inventoryData,
          {
            headers: {
              Authorization: `Bearer ${integration.accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      if (response.status !== 200) {
        throw new Error(
          `Failed to update Agoda inventory: ${response.statusText}`,
        );
      }

      this.logger.log(
        `Agoda inventory updated successfully for: ${mapping.channelRoomTypeName}`,
      );
    } catch (error) {
      this.logger.error(`Failed to update Agoda inventory: ${error.message}`);
      throw error;
    }
  }

  async updateRates(
    integration: ChannelIntegration,
    ratePlan: ChannelRatePlan,
  ): Promise<void> {
    try {
      this.logger.log(
        `Updating Agoda rates for: ${ratePlan.channelRatePlanName}`,
      );

      // Agoda rate update
      const rateData = this.buildRateRequest(integration, ratePlan);

      const response = await firstValueFrom(
        this.httpService.put(
          `${this.baseUrl}/hotels/${integration.channelPropertyId}/rates`,
          rateData,
          {
            headers: {
              Authorization: `Bearer ${integration.accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      if (response.status !== 200) {
        throw new Error(`Failed to update Agoda rates: ${response.statusText}`);
      }

      this.logger.log(
        `Agoda rates updated successfully for: ${ratePlan.channelRatePlanName}`,
      );
    } catch (error) {
      this.logger.error(`Failed to update Agoda rates: ${error.message}`);
      throw error;
    }
  }

  async updateAvailability(
    integration: ChannelIntegration,
    availability: ChannelAvailability,
  ): Promise<void> {
    try {
      this.logger.log(
        `Updating Agoda availability for date: ${availability.date}`,
      );

      // Agoda availability update
      const availabilityData = this.buildAvailabilityRequest(
        integration,
        availability,
      );

      const response = await firstValueFrom(
        this.httpService.put(
          `${this.baseUrl}/hotels/${integration.channelPropertyId}/availability`,
          availabilityData,
          {
            headers: {
              Authorization: `Bearer ${integration.accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      if (response.status !== 200) {
        throw new Error(
          `Failed to update Agoda availability: ${response.statusText}`,
        );
      }

      this.logger.log(
        `Agoda availability updated successfully for date: ${availability.date}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update Agoda availability: ${error.message}`,
      );
      throw error;
    }
  }

  async processWebhook(
    integration: ChannelIntegration,
    webhookData: any,
  ): Promise<any> {
    try {
      this.logger.log('Processing Agoda webhook...');

      // Parse Agoda webhook data
      const parsedData = this.parseWebhookData(webhookData);

      // Process based on webhook type
      switch (parsedData.event_type) {
        case 'RESERVATION_CREATED':
          return await this.processReservationWebhook(integration, parsedData);
        case 'RESERVATION_CANCELLED':
          return await this.processCancellationWebhook(integration, parsedData);
        case 'RESERVATION_MODIFIED':
          return await this.processModificationWebhook(integration, parsedData);
        default:
          this.logger.warn(
            `Unknown Agoda webhook type: ${parsedData.event_type}`,
          );
          return { processed: false, reason: 'Unknown webhook type' };
      }
    } catch (error) {
      this.logger.error(`Failed to process Agoda webhook: ${error.message}`);
      throw error;
    }
  }

  async createGuestReservation(
    integration: ChannelIntegration,
    guestData: any,
  ): Promise<any> {
    try {
      this.logger.log('Creating Agoda guest reservation...');

      const reservationData = this.buildReservationRequest(
        integration,
        guestData,
      );

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/reservations`, reservationData, {
          headers: {
            Authorization: `Bearer ${integration.accessToken}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      if (response.status !== 201) {
        throw new Error(
          `Failed to create Agoda reservation: ${response.statusText}`,
        );
      }

      this.logger.log('Agoda guest reservation created successfully');
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to create Agoda guest reservation: ${error.message}`,
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
      this.logger.log(`Updating Agoda guest reservation: ${guestId}`);

      const updateData = this.buildReservationUpdateRequest(
        integration,
        guestId,
        updates,
      );

      const response = await firstValueFrom(
        this.httpService.put(
          `${this.baseUrl}/reservations/${guestId}`,
          updateData,
          {
            headers: {
              Authorization: `Bearer ${integration.accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      if (response.status !== 200) {
        throw new Error(
          `Failed to update Agoda reservation: ${response.statusText}`,
        );
      }

      this.logger.log('Agoda guest reservation updated successfully');
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to update Agoda guest reservation: ${error.message}`,
      );
      throw error;
    }
  }

  async cancelGuestReservation(
    integration: ChannelIntegration,
    guestId: string,
  ): Promise<any> {
    try {
      this.logger.log(`Cancelling Agoda guest reservation: ${guestId}`);

      const response = await firstValueFrom(
        this.httpService.delete(`${this.baseUrl}/reservations/${guestId}`, {
          headers: {
            Authorization: `Bearer ${integration.accessToken}`,
          },
        }),
      );

      if (response.status !== 200) {
        throw new Error(
          `Failed to cancel Agoda reservation: ${response.statusText}`,
        );
      }

      this.logger.log('Agoda guest reservation cancelled successfully');
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to cancel Agoda guest reservation: ${error.message}`,
      );
      throw error;
    }
  }

  async getChannelInfo(integration: ChannelIntegration): Promise<any> {
    try {
      this.logger.log('Getting Agoda channel info...');

      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/hotels/${integration.channelPropertyId}`,
          {
            headers: {
              Authorization: `Bearer ${integration.accessToken}`,
            },
          },
        ),
      );

      return {
        channel: 'Agoda',
        status: 'active',
        hotelInfo: response.data,
      };
    } catch (error) {
      this.logger.error(`Failed to get Agoda channel info: ${error.message}`);
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
        description: mapping.channelDescription || '',
        amenities: mapping.channelAmenities || [],
        images: mapping.channelImages || [],
        capacity: mapping.mappingRules?.capacity || 2,
        languages: ['en', 'zh', 'ja', 'ko'], // Agoda supports multiple languages
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
        currency: ratePlan.currency || 'USD',
        seasonal_rates: ratePlan.seasonalRates || {},
        day_of_week_rates: ratePlan.dayOfWeekRates || {},
        special_dates: ratePlan.specialDates || {},
        restrictions: ratePlan.restrictions || {},
        languages: ['en', 'zh', 'ja', 'ko'], // Multi-language support
      },
    };
  }

  private buildAvailabilityRequest(
    integration: ChannelIntegration,
    availability: ChannelAvailability,
  ): any {
    return {
      availability: {
        date: availability.date.toISOString().split('T')[0],
        available_rooms: availability.availableRooms,
        total_rooms: availability.totalRooms,
        status: availability.status === 'AVAILABLE' ? 'OPEN' : 'CLOSED',
        restrictions: availability.restrictions || {},
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
        number_of_guests: guestData.numberOfGuests || 1,
        total_price: guestData.finalPrice,
        currency: guestData.currency || 'USD',
        language: guestData.language || 'en',
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
      if (typeof webhookData === 'string') {
        return JSON.parse(webhookData);
      }
      return webhookData;
    } catch (error) {
      this.logger.error(`Failed to parse Agoda webhook data: ${error.message}`);
      return webhookData;
    }
  }

  private async processReservationWebhook(
    integration: ChannelIntegration,
    data: any,
  ): Promise<any> {
    this.logger.log(
      `Processing Agoda reservation webhook for guest: ${data.guest_name}`,
    );
    return {
      processed: true,
      type: 'reservation',
      guestId: data.reservation_id,
    };
  }

  private async processCancellationWebhook(
    integration: ChannelIntegration,
    data: any,
  ): Promise<any> {
    this.logger.log(
      `Processing Agoda cancellation webhook for reservation: ${data.reservation_id}`,
    );
    return {
      processed: true,
      type: 'cancellation',
      guestId: data.reservation_id,
    };
  }

  private async processModificationWebhook(
    integration: ChannelIntegration,
    data: any,
  ): Promise<any> {
    this.logger.log(
      `Processing Agoda modification webhook for reservation: ${data.reservation_id}`,
    );
    return {
      processed: true,
      type: 'modification',
      guestId: data.reservation_id,
    };
  }
}
