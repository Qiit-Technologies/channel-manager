import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import * as crypto from "crypto";
import {
  ChannelIntegration,
  IntegrationStatus,
} from "../entities/channel-integration.entity";
import { HotelWebhook } from "../entities/hotel-webhook.entity";
import { OtaConfiguration } from "../entities/ota-configuration.entity";
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
  event: string;
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
   * Broadcasts a notification to all relevant webhooks (integrations, channel-level, and hotel-level)
   */
  async broadcast(
    hotelId: number,
    eventType: WebhookEventType,
    data: any,
  ): Promise<void> {
    try {
      const notifications: Promise<void>[] = [];

      // 1. Notify Channel-type webhooks (Global config per channel)
      // Fetch all integrations for this hotel to find which channels to notify
      const integrations =
        await this.channelManagerRepository.findIntegrationsByHotel(hotelId);

      for (const integration of integrations) {
        if (integration.status !== IntegrationStatus.ACTIVE) {
          continue;
        }

        // Fetch the Global Channel-type webhook configuration
        const otaConfig =
          await this.channelManagerRepository.findOtaConfigurationByChannelType(
            integration.channelType,
          );

        if (otaConfig && otaConfig.isWebhookEnabled && otaConfig.webhookUrl) {
          // Check if this event type is allowed for this channel webhook
          if (
            !otaConfig.webhookEvents ||
            otaConfig.webhookEvents.includes(eventType)
          ) {
            notifications.push(
              this.notifyChannel(otaConfig, hotelId, eventType, data),
            );
          }
        }
      }

      // Fire and forget notifications concurrently so we don't block main thread
      if (notifications.length > 0) {
        this.logger.log(
          `Broadcasting ${eventType} for hotel ${hotelId} to ${notifications.length} webhooks`,
        );
        Promise.allSettled(notifications).catch((error) => {
          this.logger.error(
            `Webhook broadcast background task failed: ${error.message}`,
          );
        });
      }
    } catch (error: any) {
      this.logger.error(`Webhook broadcast setup failed: ${error.message}`);
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
      event: eventType,
      timestamp: new Date().toISOString(),
      data,
    };

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Webhook-Event": eventType,
        "X-Webhook-Timestamp": payload.timestamp,
        "User-Agent": "Orion-ChannelManager-Webhook/1.0",
      };

      // Sign payload if secret is configured
      if (integration.webhookSecret) {
        const signature = this.generateSignature(
          JSON.stringify(payload),
          integration.webhookSecret,
        );
        headers["X-Webhook-Signature"] = signature;
        headers["X-Secret-Key"] = integration.webhookSecret;
      }

      this.logger.log(
        `Sending integration webhook ${eventType} to ${integration.webhookUrl} for hotel ${integration.hotelId}`,
      );

      await firstValueFrom(
        this.httpService.post(integration.webhookUrl, payload, {
          headers,
          timeout: 60000,
        }),
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to send integration webhook ${eventType} to ${integration.webhookUrl}: ${error.message}`,
      );
    }
  }

  /**
   * Sends a channel-type level webhook notification (Global for all hotels on this channel)
   */
  async notifyChannel(
    otaConfig: OtaConfiguration,
    hotelId: number,
    eventType: WebhookEventType,
    data: any,
  ): Promise<void> {
    const payload: WebhookPayload = {
      hotelId,
      channelType: otaConfig.channelType,
      eventType,
      event: eventType,
      timestamp: new Date().toISOString(),
      data,
    };

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Webhook-Event": eventType,
        "X-Webhook-Timestamp": payload.timestamp,
        "X-Channel-Type": otaConfig.channelType,
        "X-Secret-Key": otaConfig.webhookSecret,
        "User-Agent": "Orion-ChannelManager-Webhook/1.0",
      };

      if (otaConfig.webhookSecret) {
        const signature = this.generateSignature(
          JSON.stringify(payload),
          otaConfig.webhookSecret,
        );
        headers["X-Webhook-Signature"] = signature;
      }

      const verb = (otaConfig.webhookVerb || "POST").toUpperCase();
      this.logger.log(
        `Sending channel-type webhook ${eventType} to ${otaConfig.webhookUrl} for hotel ${hotelId} (${otaConfig.channelType}) using ${verb}`,
      );

      await firstValueFrom(
        this.httpService.request({
          method: verb as any,
          url: otaConfig.webhookUrl,
          data: payload,
          headers,
          timeout: 60000,
        }),
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to send channel-type webhook ${eventType} to ${otaConfig.webhookUrl}: ${error.message}`,
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
      event: eventType,
      timestamp: new Date().toISOString(),
      data,
    };

    try {
      const verb = (webhookConfig.verb || "POST").toUpperCase();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Webhook-Event": eventType,
        "X-Webhook-Timestamp": payload.timestamp,
        "User-Agent": "Orion-ChannelManager-Webhook/1.0",
      };

      if (webhookConfig.secret) {
        const signature = this.generateSignature(
          JSON.stringify(payload),
          webhookConfig.secret,
        );
        headers["X-Webhook-Signature"] = signature;
        headers["X-Secret-Key"] = webhookConfig.secret;
      }

      this.logger.log(
        `Sending hotel-level webhook ${eventType} (${verb}) to ${webhookConfig.url} for hotel ${webhookConfig.hotelId}`,
      );

      const requestConfig = {
        headers,
        timeout: 60000,
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
    } catch (error: any) {
      this.logger.error(
        `Failed to send hotel-level webhook ${eventType} to ${webhookConfig.url}: ${error.message}`,
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
