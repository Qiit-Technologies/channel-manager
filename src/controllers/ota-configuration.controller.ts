import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiExtraModels,
  getSchemaPath,
} from "@nestjs/swagger";
import { OtaConfigurationService } from "../services/ota-configuration.service";
import { OtaConfiguration } from "../entities/ota-configuration.entity";
import { ChannelType } from "../entities/channel-integration.entity";
import { EnhancedApiKeyGuard } from "../auth/enhanced-api-key.guard";

@ApiTags("OTA Configuration")
@ApiExtraModels(OtaConfiguration)
@Controller("ota-configurations")
@UseGuards(EnhancedApiKeyGuard)
export class OtaConfigurationController {
  constructor(
    private readonly otaConfigurationService: OtaConfigurationService,
  ) {}

  @Get()
  @ApiOperation({
    summary: "Get all OTA configurations",
    description: "Returns all OTA configurations in the system",
  })
  @ApiResponse({
    status: 200,
    description: "List of OTA configurations",
    content: {
      "application/json": {
        schema: {
          type: "array",
          items: { $ref: getSchemaPath(OtaConfiguration) },
        },
        example: [
          {
            id: 1,
            channelType: "BOOKING_COM",
            apiKey: "bk_api_key_12345",
            apiSecret: "bk_secret_67890",
            accessToken: null,
            refreshToken: null,
            baseUrl: "https://api.booking.com",
            isActive: true,
            additionalConfig: {
              rateLimit: 1000,
              timeout: 30000,
            },
            lastTested: "2025-01-15T10:00:00.000Z",
            testStatus: "SUCCESS",
            errorMessage: null,
            createdAt: "2025-01-01T08:00:00.000Z",
            updatedAt: "2025-01-15T10:00:00.000Z",
          },
          {
            id: 2,
            channelType: "EXPEDIA",
            apiKey: "exp_api_key_abc",
            apiSecret: "exp_secret_def",
            accessToken: null,
            refreshToken: null,
            baseUrl: "https://api.expedia.com",
            isActive: true,
            additionalConfig: {
              rateLimit: 500,
              timeout: 30000,
            },
            lastTested: "2025-01-14T09:00:00.000Z",
            testStatus: "SUCCESS",
            errorMessage: null,
            createdAt: "2025-01-02T08:00:00.000Z",
            updatedAt: "2025-01-14T09:00:00.000Z",
          },
        ],
      },
    },
  })
  async getAllConfigurations(): Promise<OtaConfiguration[]> {
    return await this.otaConfigurationService.getAllConfigurations();
  }

  @Get(":channelType")
  @ApiOperation({
    summary: "Get OTA configuration by channel type",
    description: "Returns the configuration for a specific channel type",
  })
  @ApiParam({
    name: "channelType",
    description: "Channel type identifier",
    enum: ChannelType,
    example: ChannelType.BOOKING_COM,
  })
  @ApiResponse({
    status: 200,
    description: "OTA configuration for the channel",
    content: {
      "application/json": {
        schema: { $ref: getSchemaPath(OtaConfiguration) },
        example: {
          id: 1,
          channelType: "BOOKING_COM",
          apiKey: "bk_api_key_12345",
          apiSecret: "bk_secret_67890",
          accessToken: null,
          refreshToken: null,
          baseUrl: "https://api.booking.com",
          isActive: true,
          additionalConfig: {
            rateLimit: 1000,
            timeout: 30000,
          },
          lastTested: "2025-01-15T10:00:00.000Z",
          testStatus: "SUCCESS",
          errorMessage: null,
          createdAt: "2025-01-01T08:00:00.000Z",
          updatedAt: "2025-01-15T10:00:00.000Z",
        },
      },
    },
  })
  async getConfiguration(
    @Param("channelType") channelType: ChannelType,
  ): Promise<OtaConfiguration> {
    return await this.otaConfigurationService.getConfiguration(channelType);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create OTA configuration",
    description: "Creates a new OTA configuration for a channel type",
  })
  @ApiBody({
    description: "OTA configuration data",
    schema: {
      type: "object",
      properties: {
        channelType: {
          type: "string",
          enum: Object.values(ChannelType),
          example: "BOOKING_COM",
        },
        apiKey: { type: "string", example: "your-api-key" },
        apiSecret: { type: "string", example: "your-api-secret" },
        baseUrl: { type: "string", example: "https://api.booking.com" },
        isActive: { type: "boolean", example: true },
        additionalConfig: { type: "object" },
      },
      required: ["channelType"],
    },
    examples: {
      bookingComConfig: {
        summary: "Booking.com configuration",
        value: {
          channelType: "BOOKING_COM",
          apiKey: "your-api-key",
          apiSecret: "your-api-secret",
          baseUrl: "https://api.booking.com",
          isActive: true,
          additionalConfig: {
            rateLimit: 1000,
            timeout: 30000,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "OTA configuration created successfully",
    content: {
      "application/json": {
        schema: { $ref: getSchemaPath(OtaConfiguration) },
        example: {
          id: 1,
          channelType: "BOOKING_COM",
          apiKey: "your-api-key",
          apiSecret: "your-api-secret",
          accessToken: null,
          refreshToken: null,
          baseUrl: "https://api.booking.com",
          isActive: true,
          additionalConfig: {
            rateLimit: 1000,
            timeout: 30000,
          },
          lastTested: null,
          testStatus: null,
          errorMessage: null,
          createdAt: "2025-01-15T10:00:00.000Z",
          updatedAt: "2025-01-15T10:00:00.000Z",
        },
      },
    },
  })
  async createConfiguration(
    @Body() config: Partial<OtaConfiguration>,
  ): Promise<OtaConfiguration> {
    return await this.otaConfigurationService.createConfiguration(config);
  }

  @Put(":channelType")
  @ApiOperation({
    summary: "Update OTA configuration",
    description: "Updates an existing OTA configuration",
  })
  @ApiParam({
    name: "channelType",
    description: "Channel type identifier",
    enum: ChannelType,
    example: ChannelType.BOOKING_COM,
  })
  @ApiBody({
    description: "Fields to update",
    schema: {
      type: "object",
      properties: {
        apiKey: { type: "string" },
        apiSecret: { type: "string" },
        baseUrl: { type: "string" },
        isActive: { type: "boolean" },
        additionalConfig: { type: "object" },
      },
    },
    examples: {
      updateConfig: {
        summary: "Update configuration",
        value: {
          apiKey: "new-api-key",
          apiSecret: "new-api-secret",
          baseUrl: "https://api.booking.com",
          isActive: true,
          additionalConfig: {
            rateLimit: 2000,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "OTA configuration updated successfully",
    content: {
      "application/json": {
        schema: { $ref: getSchemaPath(OtaConfiguration) },
        example: {
          id: 1,
          channelType: "BOOKING_COM",
          apiKey: "bk_api_key_12345",
          apiSecret: "bk_secret_67890",
          accessToken: null,
          refreshToken: null,
          baseUrl: "https://api.booking.com",
          isActive: false,
          additionalConfig: {
            rateLimit: 1000,
            timeout: 30000,
          },
          lastTested: "2025-01-15T10:00:00.000Z",
          testStatus: "SUCCESS",
          errorMessage: null,
          createdAt: "2025-01-01T08:00:00.000Z",
          updatedAt: "2025-01-15T12:00:00.000Z",
        },
      },
    },
  })
  async updateConfiguration(
    @Param("channelType") channelType: ChannelType,
    @Body() updates: Partial<OtaConfiguration>,
  ): Promise<OtaConfiguration> {
    return await this.otaConfigurationService.updateConfiguration(
      channelType,
      updates,
    );
  }

  @Post(":channelType/test")
  @ApiOperation({
    summary: "Test OTA configuration",
    description:
      "Tests the connectivity and credentials for an OTA configuration",
  })
  @ApiParam({
    name: "channelType",
    description: "Channel type identifier",
    enum: ChannelType,
    example: ChannelType.BOOKING_COM,
  })
  @ApiResponse({
    status: 201,
    description: "Test result",
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            error: { type: "string", nullable: true },
          },
        },
        example: {
          success: true,
        },
      },
    },
  })
  async testConfiguration(
    @Param("channelType") channelType: ChannelType,
  ): Promise<{ success: boolean; error?: string }> {
    return await this.otaConfigurationService.testConfiguration(channelType);
  }

  @Delete(":channelType")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteConfiguration(
    @Param("channelType") channelType: ChannelType,
  ): Promise<void> {
    // Soft delete by setting isActive to false
    await this.otaConfigurationService.updateConfiguration(channelType, {
      isActive: false,
    });
  }
}
