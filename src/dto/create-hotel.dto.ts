import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export enum HotelRegistrationSource {
  DIRECT = "DIRECT",
  WAKANOW = "WAKANOW",
  CHANNEL_MANAGER = "CHANNEL_MANAGER",
  PARTNER = "PARTNER",
  API = "API",
  ADMIN = "ADMIN",
}

export class CreateHotelDto {
  @ApiProperty({ description: "Hotel name", example: "Grand Hotel" })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: "Hotel email address",
    example: "info@grandhotel.com",
  })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({ description: "Hotel address", example: "123 Main Street" })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ description: "Country", example: "United States" })
  @IsNotEmpty()
  @IsString()
  country: string;

  @ApiProperty({ description: "State/Province", example: "New York" })
  @IsNotEmpty()
  @IsString()
  state: string;

  @ApiPropertyOptional({
    description: "Whether the hotel is active",
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: "Registration source for the hotel",
    enum: HotelRegistrationSource,
    default: HotelRegistrationSource.CHANNEL_MANAGER,
    example: HotelRegistrationSource.WAKANOW,
  })
  @IsOptional()
  @IsEnum(HotelRegistrationSource)
  registrationSource?: HotelRegistrationSource;
}
