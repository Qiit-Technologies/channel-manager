import {
  IsOptional,
  IsInt,
  IsString,
  IsDateString,
  IsEnum,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { BookingStatus } from "../entities/guest.entity";

export class GetBookingsDto {
  @ApiProperty({
    required: false,
    description: "Filter by property/hotel ID",
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  hotelId?: number;

  @ApiProperty({
    required: false,
    description: "Filter by channel integration ID",
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  integrationId?: number;

  @ApiProperty({
    required: false,
    description: "Filter bookings created from this date",
    example: "2024-01-01",
  })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiProperty({
    required: false,
    description: "Filter bookings created until this date",
    example: "2024-12-31",
  })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiProperty({
    required: false,
    description: "Filter bookings with check-in from this date",
    example: "2024-06-01",
  })
  @IsOptional()
  @IsDateString()
  checkInFrom?: string;

  @ApiProperty({
    required: false,
    description: "Filter bookings with check-in until this date",
    example: "2024-06-30",
  })
  @IsOptional()
  @IsDateString()
  checkInTo?: string;

  @ApiProperty({
    required: false,
    description: "Filter by booking source (OTA name)",
    example: "BOOKING_COM",
  })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiProperty({
    required: false,
    enum: BookingStatus,
    description: "Filter by booking status",
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiProperty({
    required: false,
    description: "Search by booking code",
    example: "BK-2024-001",
  })
  @IsOptional()
  @IsString()
  bookingCode?: string;

  @ApiProperty({
    required: false,
    description: "Search by OTA booking code",
    example: "BCOM-12345678",
  })
  @IsOptional()
  @IsString()
  otaBookingCode?: string;

  @ApiProperty({
    required: false,
    description: "Number of results per page",
    example: 100,
    default: 100,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number = 100;

  @ApiProperty({
    required: false,
    description: "Pagination offset",
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  offset?: number = 0;
}
