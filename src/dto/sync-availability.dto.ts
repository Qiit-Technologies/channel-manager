import {
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsArray,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { AvailabilityStatus } from "../entities/channel-availability.entity";

export class SingleAvailabilityUpdateDto {
  @ApiPropertyOptional({ description: "Room type ID", example: 101 })
  @IsOptional()
  @IsNumber()
  roomtypeId?: number;

  @ApiPropertyOptional({ description: "Alias for roomtypeId", example: 101 })
  @IsOptional()
  @IsNumber()
  roomTypeId?: number;

  @ApiPropertyOptional({ description: "Specific room ID (optional)" })
  @IsOptional()
  @IsNumber()
  roomId?: number;

  @ApiPropertyOptional({
    description: "Date to apply availability to",
    example: "2025-09-20",
  })
  @IsOptional()
  @IsDateString()
  date?: string;

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

export class SyncAvailabilityDto {
  @ApiProperty({ description: "Integration ID", example: 42 })
  @IsNotEmpty()
  @IsNumber()
  integrationId: number;

  @ApiPropertyOptional({
    description: "Bulk updates",
    type: [SingleAvailabilityUpdateDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SingleAvailabilityUpdateDto)
  updates?: SingleAvailabilityUpdateDto[];

  @ApiPropertyOptional({ description: "Room type ID", example: 101 })
  @IsOptional()
  @IsNumber()
  roomtypeId?: number;

  @ApiPropertyOptional({ description: "Alias for roomtypeId", example: 101 })
  @IsOptional()
  @IsNumber()
  roomTypeId?: number;

  @ApiPropertyOptional({ description: "Specific room ID (optional)" })
  @IsOptional()
  @IsNumber()
  roomId?: number;

  @ApiPropertyOptional({
    description: "Date to apply availability to",
    example: "2025-09-20",
  })
  @IsOptional()
  @IsDateString()
  date?: string;

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
