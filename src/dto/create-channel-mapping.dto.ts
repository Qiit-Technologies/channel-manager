import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
  IsNumber,
} from 'class-validator';

export class CreateChannelMappingDto {
  @IsNotEmpty()
  @IsNumber()
  integrationId: number;

  @IsNotEmpty()
  @IsNumber()
  roomtypeId: number;

  @IsNotEmpty()
  @IsString()
  channelRoomTypeId: string;

  @IsNotEmpty()
  @IsString()
  channelRoomTypeName: string;

  @IsOptional()
  @IsString()
  channelRatePlanId?: string;

  @IsOptional()
  @IsString()
  channelRatePlanName?: string;

  @IsOptional()
  @IsArray()
  channelAmenities?: string[];

  @IsOptional()
  @IsString()
  channelDescription?: string;

  @IsOptional()
  @IsArray()
  channelImages?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  mappingRules?: Record<string, any>;

  @IsOptional()
  customFields?: Record<string, any>;
}
