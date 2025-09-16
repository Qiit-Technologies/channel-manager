import { IsString, IsOptional, IsEnum, IsDateString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ApiKeyPermission } from "../entities/api-key.entity";

export class CreateApiKeyDto {
  @ApiProperty({
    description: "Name for this API key",
    example: "Backend Sync",
  })
  @IsString()
  name: string;

  @ApiProperty({ description: "Short description of usage" })
  @IsString()
  description: string;

  @ApiPropertyOptional({ enum: ApiKeyPermission })
  @IsOptional()
  @IsEnum(ApiKeyPermission)
  permission?: ApiKeyPermission;

  @ApiPropertyOptional({
    description: "Expiration date (ISO 8601)",
    example: "2025-12-31",
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: "Comma-separated IPs allowed to use this key",
  })
  @IsOptional()
  @IsString()
  ipWhitelist?: string;

  @ApiPropertyOptional({ description: "Expected User-Agent for requests" })
  @IsOptional()
  @IsString()
  userAgent?: string;
}
