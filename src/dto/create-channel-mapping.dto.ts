import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
  IsNumber,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateChannelMappingDto {
  @ApiProperty({ description: "Related integration ID", example: 42 })
  @IsNotEmpty()
  @IsNumber()
  integrationId: number;

  @ApiProperty({ description: "Internal room type ID", example: 101 })
  @IsNotEmpty()
  @IsNumber()
  roomtypeId: number;

  @ApiProperty({
    description: "Channel room type identifier",
    example: "DLX-1",
  })
  @IsNotEmpty()
  @IsString()
  channelRoomTypeId: string;

  @ApiProperty({
    description: "Channel room type name",
    example: "Deluxe Double",
  })
  @IsNotEmpty()
  @IsString()
  channelRoomTypeName: string;

  @ApiPropertyOptional({ description: "Channel rate plan identifier" })
  @IsOptional()
  @IsString()
  channelRatePlanId?: string;

  @ApiPropertyOptional({ description: "Channel rate plan name" })
  @IsOptional()
  @IsString()
  channelRatePlanName?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  channelAmenities?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  channelDescription?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  channelImages?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: "object", additionalProperties: true })
  @IsOptional()
  mappingRules?: Record<string, any>;

  @ApiPropertyOptional({ type: "object", additionalProperties: true })
  @IsOptional()
  customFields?: Record<string, any>;
}
