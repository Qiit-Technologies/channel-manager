import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  IsArray,
} from 'class-validator';
import {
  ChannelType,
  IntegrationStatus,
} from '../entities/channel-integration.entity';

export class CreateChannelIntegrationDto {
  @IsNotEmpty()
  @IsNumber()
  hotelId: number;

  @IsNotEmpty()
  @IsEnum(ChannelType)
  channelType: ChannelType;

  @IsNotEmpty()
  @IsString()
  channelName: string;

  @IsOptional()
  @IsEnum(IntegrationStatus)
  status?: IntegrationStatus;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  apiSecret?: string;

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  @IsString()
  channelPropertyId?: string;

  @IsOptional()
  @IsString()
  channelUsername?: string;

  @IsOptional()
  @IsString()
  channelPassword?: string;

  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @IsOptional()
  @IsString()
  webhookSecret?: string;

  @IsOptional()
  @IsBoolean()
  isWebhookEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  syncIntervalMinutes?: number;

  @IsOptional()
  @IsBoolean()
  isRealTimeSync?: boolean;

  @IsOptional()
  @IsBoolean()
  testMode?: boolean;

  @IsOptional()
  channelSettings?: Record<string, any>;

  @IsOptional()
  @IsArray()
  supportedFeatures?: string[];
}
