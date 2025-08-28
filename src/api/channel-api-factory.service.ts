import { Injectable, Logger } from '@nestjs/common';
import { ChannelType } from '../entities/channel-integration.entity';
import { ChannelApiInterface } from './channel-api.interface';
import { BookingComApiService } from './implementations/booking-com-api.service';
import { ExpediaApiService } from './implementations/expedia-api.service';
import { AirbnbApiService } from './implementations/airbnb-api.service';
import { HotelsComApiService } from './implementations/hotels-com-api.service';
import { TripAdvisorApiService } from './implementations/tripadvisor-api.service';
import { AgodaApiService } from './implementations/agoda-api.service';
import { CustomApiService } from './implementations/custom-api.service';

@Injectable()
export class ChannelApiFactory {
  private readonly logger = new Logger(ChannelApiFactory.name);

  createChannelApi(channelType: ChannelType): ChannelApiInterface {
    this.logger.log(`Creating API service for channel type: ${channelType}`);

    switch (channelType) {
      case ChannelType.BOOKING_COM:
        return new BookingComApiService();

      case ChannelType.EXPEDIA:
        return new ExpediaApiService();

      case ChannelType.AIRBNB:
        return new AirbnbApiService();

      case ChannelType.HOTELS_COM:
        return new HotelsComApiService();

      case ChannelType.TRIPADVISOR:
        return new TripAdvisorApiService();

      case ChannelType.AGODA:
        return new AgodaApiService();

      case ChannelType.CUSTOM:
        return new CustomApiService();

      default:
        throw new Error(`Unsupported channel type: ${channelType}`);
    }
  }

  getSupportedChannels(): ChannelType[] {
    return Object.values(ChannelType);
  }

  getChannelDisplayName(channelType: ChannelType): string {
    switch (channelType) {
      case ChannelType.BOOKING_COM:
        return 'Booking.com';
      case ChannelType.EXPEDIA:
        return 'Expedia';
      case ChannelType.AIRBNB:
        return 'Airbnb';
      case ChannelType.HOTELS_COM:
        return 'Hotels.com';
      case ChannelType.TRIPADVISOR:
        return 'TripAdvisor';
      case ChannelType.AGODA:
        return 'Agoda';
      case ChannelType.CUSTOM:
        return 'Custom Integration';
      default:
        return channelType;
    }
  }

  getChannelFeatures(channelType: ChannelType): string[] {
    switch (channelType) {
      case ChannelType.BOOKING_COM:
        return [
          'Real-time availability sync',
          'Rate management',
          'Webhook support',
          'Multi-currency support',
          'Room type mapping',
          'Guest reservation management',
        ];

      case ChannelType.EXPEDIA:
        return [
          'Inventory sync',
          'Rate updates',
          'XML API integration',
          'Multi-property support',
          'Guest management',
        ];

      case ChannelType.AIRBNB:
        return [
          'Calendar sync',
          'Pricing updates',
          'Instant booking',
          'Guest communication',
          'Property listing management',
        ];

      case ChannelType.HOTELS_COM:
        return [
          'Availability updates',
          'Rate synchronization',
          'Guest reservation sync',
          'Property information management',
        ];

      case ChannelType.TRIPADVISOR:
        return [
          'Property listing sync',
          'Guest review management',
          'Availability updates',
          'Rate synchronization',
        ];

      case ChannelType.AGODA:
        return [
          'Inventory management',
          'Rate updates',
          'Guest reservation sync',
          'Multi-language support',
        ];

      case ChannelType.CUSTOM:
        return [
          'Custom API integration',
          'Flexible data mapping',
          'Webhook support',
          'Custom authentication',
        ];

      default:
        return [];
    }
  }
}
