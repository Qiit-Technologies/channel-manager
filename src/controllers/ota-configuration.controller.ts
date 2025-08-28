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
import { OtaConfigurationService } from "../services/ota-configuration.service";
import { OtaConfiguration } from "../entities/ota-configuration.entity";
import { ChannelType } from "../entities/channel-integration.entity";
import { EnhancedApiKeyGuard } from "../auth/enhanced-api-key.guard";

@Controller("ota-configurations")
@UseGuards(EnhancedApiKeyGuard)
export class OtaConfigurationController {
  constructor(
    private readonly otaConfigurationService: OtaConfigurationService
  ) {}

  @Get()
  async getAllConfigurations(): Promise<OtaConfiguration[]> {
    return await this.otaConfigurationService.getAllConfigurations();
  }

  @Get(":channelType")
  async getConfiguration(
    @Param("channelType") channelType: ChannelType
  ): Promise<OtaConfiguration> {
    return await this.otaConfigurationService.getConfiguration(channelType);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createConfiguration(
    @Body() config: Partial<OtaConfiguration>
  ): Promise<OtaConfiguration> {
    return await this.otaConfigurationService.createConfiguration(config);
  }

  @Put(":channelType")
  async updateConfiguration(
    @Param("channelType") channelType: ChannelType,
    @Body() updates: Partial<OtaConfiguration>
  ): Promise<OtaConfiguration> {
    return await this.otaConfigurationService.updateConfiguration(
      channelType,
      updates
    );
  }

  @Post(":channelType/test")
  async testConfiguration(
    @Param("channelType") channelType: ChannelType
  ): Promise<{ success: boolean; error?: string }> {
    return await this.otaConfigurationService.testConfiguration(channelType);
  }

  @Delete(":channelType")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteConfiguration(
    @Param("channelType") channelType: ChannelType
  ): Promise<void> {
    // Soft delete by setting isActive to false
    await this.otaConfigurationService.updateConfiguration(channelType, {
      isActive: false,
    });
  }
}
