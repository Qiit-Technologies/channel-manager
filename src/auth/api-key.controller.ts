import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';
import { RequireApiKey } from './api-key.decorator';
import { EnhancedApiKeyGuard } from './enhanced-api-key.guard';

@Controller('api-keys')
@UseGuards(EnhancedApiKeyGuard)
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post()
  @RequireApiKey()
  async createApiKey(@Body() createApiKeyDto: CreateApiKeyDto) {
    try {
      const apiKey = this.apiKeyService.generateApiKey();
      const keyHash = this.apiKeyService.hashApiKey(apiKey);

      // Here you would typically save the API key to the database
      // For now, we'll just return the generated key
      
      return {
        message: 'API key created successfully',
        apiKey,
        keyHash,
        ...createApiKeyDto,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to create API key',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('generate')
  @RequireApiKey()
  async generateApiKey() {
    try {
      const apiKey = this.apiKeyService.generateApiKey();
      const keyHash = this.apiKeyService.hashApiKey(apiKey);

      return {
        message: 'API key generated successfully',
        apiKey,
        keyHash,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      };
    } catch (error) {
      throw new HttpException(
        'Failed to generate API key',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('validate/:apiKey')
  async validateApiKey(@Param('apiKey') apiKey: string) {
    try {
      const isValid = this.apiKeyService.validateApiKeyFormat(apiKey);
      const parsed = this.apiKeyService.parseApiKey(apiKey);
      const isExpired = this.apiKeyService.isApiKeyExpired(apiKey);

      return {
        isValid,
        parsed,
        isExpired,
        message: isValid ? 'API key format is valid' : 'Invalid API key format',
      };
    } catch (error) {
      throw new HttpException(
        'Failed to validate API key',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('info')
  @RequireApiKey()
  async getApiKeyInfo() {
    return {
      message: 'API key is valid',
      timestamp: new Date().toISOString(),
      endpoints: {
        'POST /api-keys': 'Create new API key (requires authentication)',
        'GET /api-keys/generate': 'Generate new API key (requires authentication)',
        'GET /api-keys/validate/:apiKey': 'Validate API key format (public)',
        'GET /api-keys/info': 'Get API key information (requires authentication)',
      },
    };
  }
} 