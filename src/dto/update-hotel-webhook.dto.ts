import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  IsArray,
} from "class-validator";
import { WebhookEventType } from "../services/webhook.service";

export class UpdateHotelWebhookDto {
  @ApiPropertyOptional({
    description: "Webhook destination URL",
    example: "https://your-api.com/webhook",
  })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({
    description: "Shared secret for signing payloads",
    example: "my-webhook-secret",
  })
  @IsOptional()
  @IsString()
  secret?: string;

  @ApiPropertyOptional({
    description: "HTTP method to use (POST, PUT, PATCH, GET)",
    default: "POST",
    example: "POST",
  })
  @IsOptional()
  @IsString()
  verb?: string;

  @ApiPropertyOptional({
    description: "Whether the webhook is active",
    default: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({
    description: "List of events that trigger this webhook",
    enum: WebhookEventType,
    isArray: true,
    example: ["BOOKING_NEW", "BOOKING_CANCEL"],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(WebhookEventType, { each: true })
  events?: WebhookEventType[];
}
