import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OtaConfiguration } from "../entities/ota-configuration.entity";
import { ChannelType } from "../entities/channel-integration.entity";

@Injectable()
export class OtaConfigurationService {
  private readonly logger = new Logger(OtaConfigurationService.name);

  constructor(
    @InjectRepository(OtaConfiguration)
    private readonly otaConfigRepository: Repository<OtaConfiguration>
  ) {}

  async getConfiguration(channelType: ChannelType): Promise<OtaConfiguration> {
    const config = await this.otaConfigRepository.findOne({
      where: { channelType, isActive: true },
    });

    if (!config) {
      throw new HttpException(
        `No active configuration found for ${channelType}`,
        HttpStatus.NOT_FOUND
      );
    }

    return config;
  }

  async getAllConfigurations(): Promise<OtaConfiguration[]> {
    return await this.otaConfigRepository.find({
      where: { isActive: true },
      order: { channelType: "ASC" },
    });
  }

  async createConfiguration(
    config: Partial<OtaConfiguration>
  ): Promise<OtaConfiguration> {
    const existingConfig = await this.otaConfigRepository.findOne({
      where: { channelType: config.channelType },
    });

    if (existingConfig) {
      throw new HttpException(
        `Configuration already exists for ${config.channelType}`,
        HttpStatus.CONFLICT
      );
    }

    const newConfig = this.otaConfigRepository.create(config);
    return await this.otaConfigRepository.save(newConfig);
  }

  async updateConfiguration(
    channelType: ChannelType,
    updates: Partial<OtaConfiguration>
  ): Promise<OtaConfiguration> {
    const config = await this.getConfiguration(channelType);

    Object.assign(config, updates);
    return await this.otaConfigRepository.save(config);
  }

  async testConfiguration(
    channelType: ChannelType
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const config = await this.getConfiguration(channelType);

      // TODO: Implement actual API test using the configuration
      // For now, just mark as tested
      await this.otaConfigRepository.update(channelType, {
        lastTested: new Date(),
        testStatus: "SUCCESS",
        errorMessage: null,
      });

      return { success: true };
    } catch (error) {
      await this.otaConfigRepository.update(channelType, {
        lastTested: new Date(),
        testStatus: "FAILED",
        errorMessage: error.message,
      });

      return { success: false, error: error.message };
    }
  }

  async isChannelAvailable(channelType: ChannelType): Promise<boolean> {
    try {
      const config = await this.getConfiguration(channelType);
      return config.isActive && config.testStatus === "SUCCESS";
    } catch {
      return false;
    }
  }
}
