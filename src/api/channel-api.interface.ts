import { ChannelIntegration } from '../entities/channel-integration.entity';
import { ChannelMapping } from '../entities/channel-mapping.entity';
import { ChannelAvailability } from '../entities/channel-availability.entity';
import { ChannelRatePlan } from '../entities/channel-rate-plan.entity';

export interface ChannelApiInterface {
  // Connection testing
  testConnection(
    integration: Partial<ChannelIntegration>,
  ): Promise<{ success: boolean; error?: string }>;

  // Inventory management
  updateInventory(
    integration: ChannelIntegration,
    mapping: ChannelMapping,
  ): Promise<void>;

  // Rate management
  updateRates(
    integration: ChannelIntegration,
    ratePlan: ChannelRatePlan,
  ): Promise<void>;

  // Availability management
  updateAvailability(
    integration: ChannelIntegration,
    availability: ChannelAvailability,
  ): Promise<void>;

  // Webhook processing
  processWebhook(
    integration: ChannelIntegration,
    webhookData: any,
  ): Promise<any>;

  // Guest/Booking management (using guests instead of bookings)
  createGuestReservation(
    integration: ChannelIntegration,
    guestData: any,
  ): Promise<any>;
  updateGuestReservation(
    integration: ChannelIntegration,
    guestId: string,
    updates: any,
  ): Promise<any>;
  cancelGuestReservation(
    integration: ChannelIntegration,
    guestId: string,
  ): Promise<any>;

  // Utility methods
  getChannelInfo(integration: ChannelIntegration): Promise<any>;
  validateCredentials(
    integration: Partial<ChannelIntegration>,
  ): Promise<boolean>;
}
