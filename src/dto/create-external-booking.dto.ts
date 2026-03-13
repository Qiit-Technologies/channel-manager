import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class ExternalGuestDto {
  @ApiProperty({
    description: "Guest Full Name",
    example: "John Doe",
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ description: "Guest Email" })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: "Guest Phone" })
  @IsString()
  @IsOptional()
  phoneNumber?: string;
}

export class CreateExternalBookingDto {
  @ApiProperty({ description: "Hotel ID for the booking" })
  @IsNumber()
  hotelId: number;

  @ApiProperty({
    description: "Room Type ID (Channel mapping code or Internal ID)",
  })
  @IsString()
  @IsNotEmpty()
  roomTypeId: string;

  @ApiProperty({ description: "Check-in Date (YYYY-MM-DD)" })
  @IsDateString()
  checkInDate: string;

  @ApiProperty({ description: "Check-out Date (YYYY-MM-DD)" })
  @IsDateString()
  checkOutDate: string;

  @ApiPropertyOptional({
    description: "Specific Room Number to book",
    type: String,
  })
  @IsString()
  @IsOptional()
  roomNumber?: string;

  @ApiProperty({ description: "Guest details" })
  @ValidateNested()
  @Type(() => ExternalGuestDto)
  guest: ExternalGuestDto;

  @ApiProperty({ description: "Total Price" })
  @IsNumber()
  totalPrice: number;

  @ApiProperty({ description: "Currency", default: "NGN" })
  @IsString()
  @IsOptional()
  currency?: string = "NGN";

  @ApiProperty({ description: "External Booking Reference (OTA Booking ID)" })
  @IsString()
  @IsNotEmpty()
  externalConfirmId: string;

  @ApiPropertyOptional({ description: "Internal Booking Code" })
  @IsString()
  @IsOptional()
  bookingCode?: string;

  @ApiPropertyOptional({
    description: "OTA Booking Code (alias for externalConfirmId)",
  })
  @IsString()
  @IsOptional()
  otaBookingCode?: string;

  @ApiPropertyOptional({
    description: "Booking Status",
    enum: [
      "PENDING",
      "CONFIRMED",
      "CHECKED_IN",
      "CHECKED_OUT",
      "CANCELED",
      "NO_SHOW",
      "MODIFIED",
    ],
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: "Number of guests", default: 1 })
  @IsNumber()
  @IsOptional()
  numberOfGuests?: number = 1;

  @ApiProperty({
    description: "Source Channel Name (e.g. WAKANOW)",
    example: "WAKANOW",
  })
  @IsString()
  @IsNotEmpty()
  source: string;
}
