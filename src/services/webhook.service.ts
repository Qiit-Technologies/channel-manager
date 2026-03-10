import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import * as crypto from "crypto";
import { ChannelIntegration } from "../entities/channel-integration.entity";

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
  integrationId: number;
  channelType: string;
  eventType: WebhookEventType;
  timestamp: string;
  data: any;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly httpService: HttpService) {}

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
   * Generates HMAC SHA256 signature for the payload
   */
  private generateSignature(payload: string, secret: string): string {
    return crypto.createHmac("sha256", secret).update(payload).digest("hex");
  }
}
