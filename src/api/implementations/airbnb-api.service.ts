import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ChannelApiInterface } from '../channel-api.interface';
import { ChannelIntegration } from '../../entities/channel-integration.entity';
import { ChannelMapping } from '../../entities/channel-mapping.entity';
import { ChannelAvailability } from '../../entities/channel-availability.entity';
import { ChannelRatePlan } from '../../entities/channel-rate-plan.entity';

@Injectable()
export class AirbnbApiService implements ChannelApiInterface {
  private readonly logger = new Logger(AirbnbApiService.name);
  private readonly baseUrl = 'https://api.airbnb.com/v2';
  private readonly httpService = new HttpService();

  async testConnection(
    integration: Partial<ChannelIntegration>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      this.logger.log('Testing Airbnb connection...');

      // Test API credentials by making a simple request to get listing info
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/listings/${integration.channelPropertyId}`,
          {
            headers: {
              'X-Airbnb-API-Key': integration.apiKey,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      if (response.status === 200) {
        this.logger.log('Airbnb connection test successful');
        return { success: true };
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      this.logger.error(`Airbnb connection test failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async updateInventory(
    integration: ChannelIntegration,
    mapping: ChannelMapping,
  ): Promise<void> {
    try {
      this.logger.log(
        `Updating Airbnb inventory for: ${mapping.channelRoomTypeName}`,
      );

      // Airbnb inventory update through listing update
      const inventoryData = this.buildInventoryRequest(integration, mapping);

      const response = await firstValueFrom(
        this.httpService.put(
          `${this.baseUrl}/listings/${integration.channelPropertyId}`,
          inventoryData,
          {
            headers: {
              'X-Airbnb-API-Key': integration.apiKey,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      if (response.status !== 200) {
        throw new Error(
          `Failed to update Airbnb inventory: ${response.statusText}`,
        );
      }

      this.logger.log(
        `Airbnb inventory updated successfully for: ${mapping.channelRoomTypeName}`,
      );
    } catch (error) {
      this.logger.error(`Failed to update Airbnb inventory: ${error.message}`);
      throw error;
    }
  }

  async updateRates(
    integration: ChannelIntegration,
    ratePlan: ChannelRatePlan,
  ): Promise<void> {
    try {
      this.logger.log(
        `Updating Airbnb rates for: ${ratePlan.channelRatePlanName}`,
      );

      // Airbnb pricing update
      const pricingData = this.buildPricingRequest(integration, ratePlan);

      const response = await firstValueFrom(
        this.httpService.put(
          `${this.baseUrl}/listings/${integration.channelPropertyId}/pricing`,
          pricingData,
          {
            headers: {
              'X-Airbnb-API-Key': integration.apiKey,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      if (response.status !== 200) {
        throw new Error(
          `Failed to update Airbnb rates: ${response.statusText}`,
        );
      }

      this.logger.log(
        `Airbnb rates updated successfully for: ${ratePlan.channelRatePlanName}`,
      );
    } catch (error) {
      this.logger.error(`Failed to update Airbnb rates: ${error.message}`);
      throw error;
    }
  }

  async updateAvailability(
    integration: ChannelIntegration,
    availability: ChannelAvailability,
  ): Promise<void> {
    try {
      this.logger.log(
        `Updating Airbnb availability for date: ${availability.date}`,
      );

      // Airbnb calendar update
      const calendarData = this.buildCalendarRequest(integration, availability);

      const response = await firstValueFrom(
        this.httpService.put(
          `${this.baseUrl}/listings/${integration.channelPropertyId}/calendar`,
          calendarData,
          {
            headers: {
              'X-Airbnb-API-Key': integration.apiKey,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      if (response.status !== 200) {
        throw new Error(
          `Failed to update Airbnb availability: ${response.statusText}`,
        );
      }

      this.logger.log(
        `Airbnb availability updated successfully for date: ${availability.date}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update Airbnb availability: ${error.message}`,
      );
      throw error;
    }
  }

  async processWebhook(
    integration: ChannelIntegration,
    webhookData: any,
  ): Promise<any> {
    try {
      this.logger.log('Processing Airbnb webhook...');

      // Parse Airbnb webhook data
      const parsedData = this.parseWebhookData(webhookData);

      // Process based on webhook type
      switch (parsedData.type) {
        case 'reservation_created':
          return await this.processReservationWebhook(integration, parsedData);
        case 'reservation_cancelled':
          return await this.processCancellationWebhook(integration, parsedData);
        case 'reservation_updated':
          return await this.processModificationWebhook(integration, parsedData);
        default:
          this.logger.warn(`Unknown Airbnb webhook type: ${parsedData.type}`);
          return { processed: false, reason: 'Unknown webhook type' };
      }
    } catch (error) {
      this.logger.error(`Failed to process Airbnb webhook: ${error.message}`);
      throw error;
    }
  }

  async createGuestReservation(
    integration: ChannelIntegration,
    guestData: any,
  ): Promise<any> {
    try {
      this.logger.log('Creating Airbnb guest reservation...');

      const reservationData = this.buildReservationRequest(
        integration,
        guestData,
      );

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/reservations`, reservationData, {
          headers: {
            'X-Airbnb-API-Key': integration.apiKey,
            'Content-Type': 'application/json',
          },
        }),
      );

      if (response.status !== 201) {
        throw new Error(
          `Failed to create Airbnb reservation: ${response.statusText}`,
        );
      }

      this.logger.log('Airbnb guest reservation created successfully');
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to create Airbnb guest reservation: ${error.message}`,
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
      this.logger.log(`Updating Airbnb guest reservation: ${guestId}`);

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
              'X-Airbnb-API-Key': integration.apiKey,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      if (response.status !== 200) {
        throw new Error(
          `Failed to update Airbnb reservation: ${response.statusText}`,
        );
      }

      this.logger.log('Airbnb guest reservation updated successfully');
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to update Airbnb guest reservation: ${error.message}`,
      );
      throw error;
    }
  }

  async cancelGuestReservation(
    integration: ChannelIntegration,
    guestId: string,
  ): Promise<any> {
    try {
      this.logger.log(`Cancelling Airbnb guest reservation: ${guestId}`);

      const response = await firstValueFrom(
        this.httpService.delete(`${this.baseUrl}/reservations/${guestId}`, {
          headers: {
            'X-Airbnb-API-Key': integration.apiKey,
          },
        }),
      );

      if (response.status !== 200) {
        throw new Error(
          `Failed to cancel Airbnb reservation: ${response.statusText}`,
        );
      }

      this.logger.log('Airbnb guest reservation cancelled successfully');
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to cancel Airbnb guest reservation: ${error.message}`,
      );
      throw error;
    }
  }

  async getChannelInfo(integration: ChannelIntegration): Promise<any> {
    try {
      this.logger.log('Getting Airbnb channel info...');

      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/listings/${integration.channelPropertyId}`,
          {
            headers: {
              'X-Airbnb-API-Key': integration.apiKey,
            },
          },
        ),
      );

      return {
        channel: 'Airbnb',
        status: 'active',
        listingInfo: response.data,
      };
    } catch (error) {
      this.logger.error(`Failed to get Airbnb channel info: ${error.message}`);
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
      listing: {
        room_type: mapping.channelRoomTypeName,
        description: mapping.channelDescription || '',
        amenities: mapping.channelAmenities || [],
        images: mapping.channelImages || [],
      },
    };
  }

  private buildPricingRequest(
    integration: ChannelIntegration,
    ratePlan: ChannelRatePlan,
  ): any {
    return {
      pricing: {
        base_price: ratePlan.baseRate,
        currency: ratePlan.currency || 'USD',
        seasonal_pricing: ratePlan.seasonalRates || {},
        weekend_pricing: ratePlan.dayOfWeekRates || {},
        special_dates: ratePlan.specialDates || {},
      },
    };
  }

  private buildCalendarRequest(
    integration: ChannelIntegration,
    availability: ChannelAvailability,
  ): any {
    return {
      calendar: {
        date: availability.date.toISOString().split('T')[0],
        available: availability.status === 'AVAILABLE',
        min_nights: availability.restrictions?.minStay || 1,
        max_nights: availability.restrictions?.maxStay || 30,
        price: availability.rate,
        currency: availability.currency || 'USD',
      },
    };
  }

  private buildReservationRequest(
    integration: ChannelIntegration,
    guestData: any,
  ): any {
    return {
      reservation: {
        listing_id: integration.channelPropertyId,
        guest_name: guestData.fullName,
        check_in: guestData.startDate,
        check_out: guestData.endDate,
        number_of_guests: guestData.numberOfGuests || 1,
        total_price: guestData.finalPrice,
        currency: guestData.currency || 'USD',
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
      this.logger.error(
        `Failed to parse Airbnb webhook data: ${error.message}`,
      );
      return webhookData;
    }
  }

  private async processReservationWebhook(
    integration: ChannelIntegration,
    data: any,
  ): Promise<any> {
    this.logger.log(
      `Processing Airbnb reservation webhook for guest: ${data.guest_name}`,
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
      `Processing Airbnb cancellation webhook for reservation: ${data.reservation_id}`,
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
      `Processing Airbnb modification webhook for reservation: ${data.reservation_id}`,
    );
    return {
      processed: true,
      type: 'modification',
      guestId: data.reservation_id,
    };
  }
}
