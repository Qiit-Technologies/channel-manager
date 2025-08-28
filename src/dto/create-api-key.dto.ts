import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiKeyPermission } from '../entities/api-key.entity';

export class CreateApiKeyDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(ApiKeyPermission)
  permission?: ApiKeyPermission;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsString()
  ipWhitelist?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
} 