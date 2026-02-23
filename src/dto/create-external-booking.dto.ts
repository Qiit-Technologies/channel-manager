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
  @ApiPropertyOptional({
    description: "Guest Full Name (if sending joined name)",
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ description: "Guest First Name" })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ description: "Guest Last Name" })
  @IsString()
  @IsOptional()
  lastName?: string;

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

  @ApiProperty({ description: "Number of rooms", default: 1 })
  @IsNumber()
  @IsOptional()
  quantity?: number = 1;

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

  @ApiProperty({
    description: "Source Channel Name (e.g. WAKANOW)",
    example: "WAKANOW",
  })
  @IsString()
  @IsNotEmpty()
  source: string;
}
