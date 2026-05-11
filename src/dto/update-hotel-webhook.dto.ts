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
import { ChannelType } from "src/entities/channel-integration.entity";

export class UpdateHotelWebhookDto {
  @ApiPropertyOptional({
    description: "Channel type for which to update the global webhook",
    enum: ChannelType,
    example: "WAKANOW",
  })
  @IsOptional()
  @IsEnum(ChannelType)
  channelType?: ChannelType;

  @ApiPropertyOptional({
    description: "Global webhook destination URL for this channel",
    example: "https://api.wakanow.com/webhook",
  })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({
    description: "Shared secret for signing global payloads",
    example: "whsec_12345",
  })
  @IsOptional()
  @IsString()
  secret?: string;

  @ApiPropertyOptional({
    description: "HTTP method to use (defaults to POST)",
    default: "POST",
    example: "POST",
  })
  @IsOptional()
  @IsString()
  verb?: string;

  @ApiPropertyOptional({
    description: "Whether the global channel webhook is active",
    default: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({
    description: "List of events that trigger this global webhook",
    enum: WebhookEventType,
    isArray: true,
    example: ["BOOKING_NEW", "BOOKING_CANCEL"],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(WebhookEventType, { each: true })
  events?: WebhookEventType[];
}
