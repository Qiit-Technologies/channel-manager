import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  IsArray,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ChannelType,
  IntegrationStatus,
} from "../entities/channel-integration.entity";

export class CreateChannelIntegrationDto {
  @ApiProperty({ description: "Hotel identifier", example: 123 })
  @IsNotEmpty()
  @IsNumber()
  hotelId: number;

  @ApiProperty({ enum: ChannelType, description: "Channel type (OTA)" })
  @IsNotEmpty()
  @IsEnum(ChannelType)
  channelType: ChannelType;

  @ApiProperty({
    description: "Human readable channel name",
    example: "Booking.com",
  })
  @IsNotEmpty()
  @IsString()
  channelName: string;

  @ApiPropertyOptional({ enum: IntegrationStatus })
  @IsOptional()
  @IsEnum(IntegrationStatus)
  status?: IntegrationStatus;

  @ApiPropertyOptional({ description: "API key for the channel" })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ description: "API secret for the channel" })
  @IsOptional()
  @IsString()
  apiSecret?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accessToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiPropertyOptional({ description: "Property ID used by the channel" })
  @IsOptional()
  @IsString()
  channelPropertyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  channelUsername?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  channelPassword?: string;

  @ApiPropertyOptional({ description: "Webhook URL for channel events" })
  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @ApiPropertyOptional({ description: "Secret used to sign webhooks" })
  @IsOptional()
  @IsString()
  webhookSecret?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isWebhookEnabled?: boolean;

  @ApiPropertyOptional({ description: "Interval in minutes for periodic sync" })
  @IsOptional()
  @IsNumber()
  syncIntervalMinutes?: number;

  @ApiPropertyOptional({ description: "Enable real-time sync if supported" })
  @IsOptional()
  @IsBoolean()
  isRealTimeSync?: boolean;

  @ApiPropertyOptional({ description: "Run integration in test/sandbox mode" })
  @IsOptional()
  @IsBoolean()
  testMode?: boolean;

  @ApiPropertyOptional({ type: "object", additionalProperties: true })
  @IsOptional()
  channelSettings?: Record<string, any>;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  supportedFeatures?: string[];
}
