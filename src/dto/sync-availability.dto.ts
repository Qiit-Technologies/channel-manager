import {
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
  IsEnum,
  IsBoolean,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AvailabilityStatus } from "../entities/channel-availability.entity";

export class SyncAvailabilityDto {
  @ApiProperty({ description: "Integration ID", example: 42 })
  @IsNotEmpty()
  @IsNumber()
  integrationId: number;

  @ApiProperty({ description: "Room type ID", example: 101 })
  @IsNotEmpty()
  @IsNumber()
  roomtypeId: number;

  @ApiPropertyOptional({ description: "Specific room ID (optional)" })
  @IsOptional()
  @IsNumber()
  roomId?: number;

  @ApiProperty({
    description: "Date to apply availability to",
    example: "2025-09-20",
  })
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ enum: AvailabilityStatus })
  @IsOptional()
  @IsEnum(AvailabilityStatus)
  status?: AvailabilityStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  availableRooms?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalRooms?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  occupiedRooms?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  blockedRooms?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maintenanceRooms?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  rate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  closeReason?: string;

  @ApiPropertyOptional({ type: "object", additionalProperties: true })
  @IsOptional()
  restrictions?: Record<string, any>;

  @ApiPropertyOptional({ type: "object", additionalProperties: true })
  @IsOptional()
  channelData?: Record<string, any>;
}
