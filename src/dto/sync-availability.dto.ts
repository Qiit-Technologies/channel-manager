import {
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { AvailabilityStatus } from '../entities/channel-availability.entity';

export class SyncAvailabilityDto {
  @IsNotEmpty()
  @IsNumber()
  integrationId: number;

  @IsNotEmpty()
  @IsNumber()
  roomtypeId: number;

  @IsOptional()
  @IsNumber()
  roomId?: number;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsOptional()
  @IsEnum(AvailabilityStatus)
  status?: AvailabilityStatus;

  @IsOptional()
  @IsNumber()
  availableRooms?: number;

  @IsOptional()
  @IsNumber()
  totalRooms?: number;

  @IsOptional()
  @IsNumber()
  occupiedRooms?: number;

  @IsOptional()
  @IsNumber()
  blockedRooms?: number;

  @IsOptional()
  @IsNumber()
  maintenanceRooms?: number;

  @IsOptional()
  @IsNumber()
  rate?: number;

  @IsOptional()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;

  @IsOptional()
  closeReason?: string;

  @IsOptional()
  restrictions?: Record<string, any>;

  @IsOptional()
  channelData?: Record<string, any>;
}
