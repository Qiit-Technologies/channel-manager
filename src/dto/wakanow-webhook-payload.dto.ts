import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNumber,
  IsOptional,
  IsString,
  IsObject,
  IsEmail,
} from "class-validator";

class WakanowGuestDto {
  @ApiPropertyOptional({ description: "Guest full name" })
  @IsString()
  @IsOptional()
  first_name?: string;

  @ApiPropertyOptional({ description: "Guest last name" })
  @IsString()
  @IsOptional()
  last_name?: string;

  @ApiPropertyOptional({ description: "Guest email" })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: "Guest phone" })
  @IsString()
  @IsOptional()
  phone?: string;
}

class WakanowBookingDataDto {
  @ApiPropertyOptional({ description: "Wakanow booking reference" })
  @IsString()
  @IsOptional()
  booking_reference?: string;

  @ApiPropertyOptional({ description: "Hotel ID on Wakanow" })
  @IsString()
  @IsOptional()
  property_id?: string;

  @ApiPropertyOptional({ description: "Room type ID on Wakanow" })
  @IsString()
  @IsOptional()
  room_type_id?: string;

  @ApiPropertyOptional({ description: "Check-in date (YYYY-MM-DD)" })
  @IsString()
  @IsOptional()
  check_in_date?: string;

  @ApiPropertyOptional({ description: "Check-out date (YYYY-MM-DD)" })
  @IsString()
  @IsOptional()
  check_out_date?: string;

  @ApiPropertyOptional({ description: "Number of rooms" })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({ description: "Total amount" })
  @IsNumber()
  @IsOptional()
  total_amount?: number;

  @ApiPropertyOptional({ description: "Currency code" })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: "Guest details" })
  @IsObject()
  @IsOptional()
  guest?: WakanowGuestDto;

  @ApiPropertyOptional({ description: "Booking status" })
  @IsString()
  @IsOptional()
  status?: string;
}

export class WakanowWebhookPayloadDto {
  @ApiProperty({ description: "Hotel ID for which the webhook applies" })
  @IsNumber()
  hotelId: number;

  @ApiPropertyOptional({ description: "Webhook event type" })
  @IsString()
  @IsOptional()
  event_type?: string;

  @ApiPropertyOptional({ description: "Event timestamp" })
  @IsString()
  @IsOptional()
  timestamp?: string;

  @ApiPropertyOptional({ description: "Booking data" })
  @IsObject()
  @IsOptional()
  data?: WakanowBookingDataDto;
}
