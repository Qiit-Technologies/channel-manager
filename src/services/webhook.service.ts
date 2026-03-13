import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import * as crypto from "crypto";
import {
  ChannelIntegration,
  IntegrationStatus,
} from "../entities/channel-integration.entity";
import { HotelWebhook } from "../entities/hotel-webhook.entity";
import { ChannelManagerRepository } from "../channel-manager.repository";

export enum WebhookEventType {
  AVAILABILITY_CHANGE = "AVAILABILITY_CHANGE",
  RATE_CHANGE = "RATE_CHANGE",
  BOOKING_NEW = "BOOKING_NEW",
  BOOKING_CANCEL = "BOOKING_CANCEL",
  BOOKING_NO_SHOW = "BOOKING_NO_SHOW",
  BOOKING_MODIFY = "BOOKING_MODIFY",
  CHECK_IN = "CHECK_IN",
  CHECK_OUT = "CHECK_OUT",
  TEST = "TEST",
}

export interface WebhookPayload {
  hotelId: number;
  integrationId?: number;
  channelType?: string;
  eventType: WebhookEventType;
  timestamp: string;
  data: any;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly channelManagerRepository: ChannelManagerRepository,
  ) {}

  /**
   * Broadcasts a notification to all relevant webhooks (integrations and hotel-level)
   */
  async broadcast(
    hotelId: number,
    eventType: WebhookEventType,
    data: any,
  ): Promise<void> {
    try {
      // 1. Notify Integration-level webhooks (legacy/per-channel)
      const integrations =
        await this.channelManagerRepository.findIntegrationsByHotel(hotelId);
      for (const integration of integrations) {
        if (
          integration.status === IntegrationStatus.ACTIVE &&
          integration.isWebhookEnabled &&
          integration.webhookUrl
        ) {
          await this.notify(integration, eventType, data);
        }
      }

      // 2. Notify Hotel-level webhook (new/preferred)
      const hotelWebhook =
        await this.channelManagerRepository.findHotelWebhook(hotelId);
      if (hotelWebhook && hotelWebhook.isEnabled && hotelWebhook.url) {
        await this.notifyHotel(hotelWebhook, eventType, data);
      }
    } catch (error) {
      this.logger.error(`Webhook broadcast failed: ${error.message}`);
    }
  }

  /**
   * Sends a webhook notification if enabled for the integration
   */
  async notify(
    integration: ChannelIntegration,
    eventType: WebhookEventType,
    data: any,
  ): Promise<void> {
    if (!integration.isWebhookEnabled || !integration.webhookUrl) {
      return;
    }

    const payload: WebhookPayload = {
      hotelId: integration.hotelId,
      integrationId: integration.id,
      channelType: integration.channelType,
      eventType,
      timestamp: new Date().toISOString(),
      data,
    };

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Webhook-Event": eventType,
        "X-Webhook-Timestamp": payload.timestamp,
      };

      // Sign payload if secret is configured
      if (integration.webhookSecret) {
        const signature = this.generateSignature(
          JSON.stringify(payload),
          integration.webhookSecret,
        );
        headers["X-Webhook-Signature"] = signature;
      }

      this.logger.log(
        `Sending webhook ${eventType} to ${integration.webhookUrl} for hotel ${integration.hotelId}`,
      );

      await firstValueFrom(
        this.httpService.post(integration.webhookUrl, payload, {
          headers,
          timeout: 5000, // 5 second timeout
        }),
      );
    } catch (error) {
      this.logger.error(
        `Failed to send webhook ${eventType} to ${integration.webhookUrl}: ${error.message}`,
      );
    }
  }

  /**
   * Sends a hotel-level webhook notification
   */
  async notifyHotel(
    webhookConfig: HotelWebhook,
    eventType: WebhookEventType,
    data: any,
  ): Promise<void> {
    if (
      !webhookConfig.isEnabled ||
      !webhookConfig.url ||
      (webhookConfig.events && !webhookConfig.events.includes(eventType))
    ) {
      return;
    }

    const payload: WebhookPayload = {
      hotelId: webhookConfig.hotelId,
      eventType,
      timestamp: new Date().toISOString(),
      data,
    };

    try {
      const verb = (webhookConfig.verb || "POST").toUpperCase();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Webhook-Event": eventType,
        "X-Webhook-Timestamp": payload.timestamp,
      };

      if (webhookConfig.secret) {
        const signature = this.generateSignature(
          JSON.stringify(payload),
          webhookConfig.secret,
        );
        headers["X-Webhook-Signature"] = signature;
      }

      this.logger.log(
        `Sending hotel webhook ${eventType} (${verb}) to ${webhookConfig.url} for hotel ${webhookConfig.hotelId}`,
      );

      const requestConfig = {
        headers,
        timeout: 5000,
      };

      if (verb === "GET") {
        await firstValueFrom(
          this.httpService.get(webhookConfig.url, {
            ...requestConfig,
            params: payload,
          }),
        );
      } else if (verb === "PUT") {
        await firstValueFrom(
          this.httpService.put(webhookConfig.url, payload, requestConfig),
        );
      } else if (verb === "PATCH") {
        await firstValueFrom(
          this.httpService.patch(webhookConfig.url, payload, requestConfig),
        );
      } else {
        // Default to POST
        await firstValueFrom(
          this.httpService.post(webhookConfig.url, payload, requestConfig),
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to send hotel webhook ${eventType} to ${webhookConfig.url}: ${error.message}`,
      );
    }
  }

  /**
   * Generates HMAC SHA256 signature for the payload
   */
  private generateSignature(payload: string, secret: string): string {
    return crypto.createHmac("sha256", secret).update(payload).digest("hex");
  }
}
