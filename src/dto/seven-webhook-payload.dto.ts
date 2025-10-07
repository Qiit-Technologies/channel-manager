import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNumber,
  IsOptional,
  IsString,
  IsObject,
} from "class-validator";

export class SevenReservationDataDto {
  @ApiPropertyOptional({
    description: "Channel room type identifier",
    example: "DELUXE-KING",
  })
  @IsOptional()
  @IsString()
  channel_room_type_id?: string;

  @ApiPropertyOptional({
    description: "Alternate room type identifier",
    example: "DLX-K",
  })
  @IsOptional()
  @IsString()
  room_type_id?: string;

  @ApiPropertyOptional({
    description: "Alternate camelCase room type identifier",
    example: "DELUXE_KING",
  })
  @IsOptional()
  @IsString()
  roomTypeId?: string;

  @ApiPropertyOptional({
    description: "Alternate code style for room type",
    example: "DK",
  })
  @IsOptional()
  @IsString()
  room_type_code?: string;

  @ApiPropertyOptional({
    description: "Check-in date (YYYY-MM-DD)",
    example: "2025-10-12",
  })
  @IsOptional()
  @IsString()
  check_in?: string;

  @ApiPropertyOptional({
    description: "Check-in date (camelCase)",
    example: "2025-10-12",
  })
  @IsOptional()
  @IsString()
  checkIn?: string;

  @ApiPropertyOptional({ description: "Start date", example: "2025-10-12" })
  @IsOptional()
  @IsString()
  start_date?: string;

  @ApiPropertyOptional({
    description: "Alternate arrival date",
    example: "2025-10-12",
  })
  @IsOptional()
  @IsString()
  arrival_date?: string;

  @ApiPropertyOptional({
    description: "Check-out date (YYYY-MM-DD)",
    example: "2025-10-15",
  })
  @IsOptional()
  @IsString()
  check_out?: string;

  @ApiPropertyOptional({
    description: "Check-out date (camelCase)",
    example: "2025-10-15",
  })
  @IsOptional()
  @IsString()
  checkOut?: string;

  @ApiPropertyOptional({ description: "End date", example: "2025-10-15" })
  @IsOptional()
  @IsString()
  end_date?: string;

  @ApiPropertyOptional({
    description: "Alternate departure date",
    example: "2025-10-15",
  })
  @IsOptional()
  @IsString()
  departure_date?: string;

  @ApiPropertyOptional({ description: "Number of rooms", example: 2 })
  @IsOptional()
  rooms?: number;

  @ApiPropertyOptional({ description: "Alternate number of rooms", example: 2 })
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({ description: "Alternate number of rooms", example: 2 })
  @IsOptional()
  number_of_rooms?: number;

  @ApiPropertyOptional({ description: "Alternate number of rooms", example: 2 })
  @IsOptional()
  num_rooms?: number;

  @ApiPropertyOptional({
    description: "Guest info object",
    example: { name: "Jane Doe", email: "jane@example.com" },
  })
  @IsOptional()
  @IsObject()
  guest?: Record<string, any>;
}

export class SevenWebhookPayloadDto {
  @ApiProperty({
    description: "Hotel ID for which the webhook applies",
    example: 42,
  })
  @IsNumber()
  hotelId: number;

  @ApiPropertyOptional({ description: "Webhook event type", example: "reservation" })
  @IsOptional()
  @IsString()
  event_type?: string;

  @ApiPropertyOptional({
    description: "Channel-specific property identifier",
    example: "SEVEN-12345",
  })
  @IsOptional()
  @IsString()
  property_id?: string;

  @ApiPropertyOptional({ description: "Event timestamp", example: "2025-10-07T12:34:56Z" })
  @IsOptional()
  @IsString()
  timestamp?: string;

  @ApiPropertyOptional({
    description: "Channel-specific payload",
    type: SevenReservationDataDto,
  })
  @IsOptional()
  @IsObject()
  data?: SevenReservationDataDto | Record<string, any>;
}