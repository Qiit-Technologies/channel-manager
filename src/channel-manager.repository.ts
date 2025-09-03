import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { ChannelIntegration } from "./entities/channel-integration.entity";
import { ChannelMapping } from "./entities/channel-mapping.entity";
import { ChannelSyncLog } from "./entities/channel-sync-log.entity";
import { ChannelRatePlan } from "./entities/channel-rate-plan.entity";
import { ChannelAvailability } from "./entities/channel-availability.entity";
import { IntegrationStatus } from "./entities/channel-integration.entity";
import { SyncStatus } from "./entities/channel-sync-log.entity";
import axios from "axios";

@Injectable()
export class ChannelManagerRepository {
  constructor(
    @InjectRepository(ChannelIntegration)
    private channelIntegrationRepo: Repository<ChannelIntegration>,
    @InjectRepository(ChannelMapping)
    private channelMappingRepo: Repository<ChannelMapping>,
    @InjectRepository(ChannelSyncLog)
    private channelSyncLogRepo: Repository<ChannelSyncLog>,
    @InjectRepository(ChannelRatePlan)
    private channelRatePlanRepo: Repository<ChannelRatePlan>,
    @InjectRepository(ChannelAvailability)
    private channelAvailabilityRepo: Repository<ChannelAvailability>
  ) {}

  // Channel Integration Methods
  async createIntegration(
    integration: Partial<ChannelIntegration>
  ): Promise<ChannelIntegration> {
    const newIntegration = this.channelIntegrationRepo.create(integration);
    return await this.channelIntegrationRepo.save(newIntegration);
  }

  async findIntegrationById(id: number): Promise<ChannelIntegration> {
    return await this.channelIntegrationRepo.findOne({
      where: { id },
      select: {
        id: true,
        hotelId: true,
        channelType: true,
        channelName: true,
        status: true,
        apiKey: true,
        apiSecret: true,
        accessToken: true,
        refreshToken: true,
        channelPropertyId: true,
        channelUsername: true,
        channelPassword: true,
        webhookUrl: true,
        webhookSecret: true,
        isWebhookEnabled: true,
        syncIntervalMinutes: true,
        isRealTimeSync: true,
        lastSyncAt: true,
        lastSuccessfulSync: true,
        testMode: true,
        channelSettings: true,
        supportedFeatures: true,
        createdBy: true,
        updatedBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findIntegrationsByHotel(
    hotelId: number
  ): Promise<ChannelIntegration[]> {
    const response = await axios.get(
      "https://api.test.hotelbeds.com/hotel-api/1.0/hotels",
      {
        headers: {
          "Api-Key": "618ac6b2dcd3aadaf8da4d6ab461cfc2",
          "X-Signature": "908ebfa5de",
          Accept: "application/json",
        },
      }
    );

    console.log(response.data);
    return await this.channelIntegrationRepo.find({
      where: { hotelId },
      select: {
        id: true,
        hotelId: true,
        channelType: true,
        channelName: true,
        status: true,
        channelPropertyId: true,
        isWebhookEnabled: true,
        syncIntervalMinutes: true,
        isRealTimeSync: true,
        lastSyncAt: true,
        lastSuccessfulSync: true,
        testMode: true,
        createdAt: true,
        updatedAt: true,
      },
      order: { createdAt: "DESC" },
    });
  }

  async findIntegrationByHotelAndType(
    hotelId: number,
    channelType: any
  ): Promise<ChannelIntegration | null> {
    return await this.channelIntegrationRepo.findOne({
      where: { hotelId, channelType },
      select: {
        id: true,
        hotelId: true,
        channelType: true,
        channelName: true,
        status: true,
        channelPropertyId: true,
        isWebhookEnabled: true,
        syncIntervalMinutes: true,
        isRealTimeSync: true,
        lastSyncAt: true,
        lastSuccessfulSync: true,
        testMode: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findActiveIntegrations(): Promise<ChannelIntegration[]> {
    return await this.channelIntegrationRepo.find({
      where: { status: IntegrationStatus.ACTIVE },
      select: {
        id: true,
        hotelId: true,
        channelType: true,
        channelName: true,
        status: true,
        channelPropertyId: true,
        isWebhookEnabled: true,
        syncIntervalMinutes: true,
        isRealTimeSync: true,
        lastSyncAt: true,
        lastSuccessfulSync: true,
        testMode: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateIntegration(
    id: number,
    updates: Partial<ChannelIntegration>
  ): Promise<ChannelIntegration> {
    await this.channelIntegrationRepo.update(id, updates);
    return await this.findIntegrationById(id);
  }

  async deleteIntegration(id: number): Promise<void> {
    await this.channelIntegrationRepo.delete(id);
  }

  // Channel Mapping Methods
  async createMapping(
    mapping: Partial<ChannelMapping>
  ): Promise<ChannelMapping> {
    const newMapping = this.channelMappingRepo.create(mapping);
    return await this.channelMappingRepo.save(newMapping);
  }

  async findMappingsByIntegration(
    integrationId: number
  ): Promise<ChannelMapping[]> {
    return await this.channelMappingRepo.find({
      where: { integrationId },
    });
  }

  async findMappingById(id: number): Promise<ChannelMapping> {
    return await this.channelMappingRepo.findOne({
      where: { id },
    });
  }

  async updateMapping(
    id: number,
    updates: Partial<ChannelMapping>
  ): Promise<ChannelMapping> {
    await this.channelMappingRepo.update(id, updates);
    return await this.findMappingById(id);
  }

  async deleteMapping(id: number): Promise<void> {
    await this.channelMappingRepo.delete(id);
  }

  // Channel Rate Plan Methods
  async createRatePlan(
    ratePlan: Partial<ChannelRatePlan>
  ): Promise<ChannelRatePlan> {
    const newRatePlan = this.channelRatePlanRepo.create(ratePlan);
    return await this.channelRatePlanRepo.save(newRatePlan);
  }

  async findRatePlansByIntegration(
    integrationId: number
  ): Promise<ChannelRatePlan[]> {
    return await this.channelRatePlanRepo.find({
      where: { integrationId },
    });
  }

  async updateRatePlan(
    id: number,
    updates: Partial<ChannelRatePlan>
  ): Promise<ChannelRatePlan> {
    await this.channelRatePlanRepo.update(id, updates);
    return await this.channelRatePlanRepo.findOne({ where: { id } });
  }

  // Channel Availability Methods
  async createAvailability(
    availability: Partial<ChannelAvailability>
  ): Promise<ChannelAvailability> {
    const newAvailability = this.channelAvailabilityRepo.create(availability);
    return await this.channelAvailabilityRepo.save(newAvailability);
  }

  async findAvailabilityByDateRange(
    integrationId: number,
    roomtypeId: number,
    startDate: Date,
    endDate: Date
  ): Promise<ChannelAvailability[]> {
    return await this.channelAvailabilityRepo.find({
      where: {
        integrationId,
        roomtypeId,
        date: Between(startDate, endDate),
      },
      order: { date: "ASC" },
    });
  }

  async updateAvailability(
    id: number,
    updates: Partial<ChannelAvailability>
  ): Promise<ChannelAvailability> {
    await this.channelAvailabilityRepo.update(id, updates);
    return await this.channelAvailabilityRepo.findOne({ where: { id } });
  }

  async bulkUpdateAvailability(
    updates: Partial<ChannelAvailability>[]
  ): Promise<void> {
    await this.channelAvailabilityRepo.save(updates);
  }

  // Channel Sync Log Methods
  async createSyncLog(
    syncLog: Partial<ChannelSyncLog>
  ): Promise<ChannelSyncLog> {
    const newSyncLog = this.channelSyncLogRepo.create(syncLog);
    return await this.channelSyncLogRepo.save(newSyncLog);
  }

  async findSyncLogsByIntegration(
    integrationId: number,
    limit: number = 100
  ): Promise<ChannelSyncLog[]> {
    return await this.channelSyncLogRepo.find({
      where: { integrationId },
      order: { createdAt: "DESC" },
      take: limit,
    });
  }

  async findFailedSyncLogs(): Promise<ChannelSyncLog[]> {
    return await this.channelSyncLogRepo.find({
      where: { status: SyncStatus.FAILED },
      order: { createdAt: "DESC" },
    });
  }

  async updateSyncLog(
    id: number,
    updates: Partial<ChannelSyncLog>
  ): Promise<ChannelSyncLog> {
    await this.channelSyncLogRepo.update(id, updates);
    return await this.channelSyncLogRepo.findOne({ where: { id } });
  }

  // Utility Methods
  async findIntegrationsNeedingSync(): Promise<ChannelIntegration[]> {
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    return await this.channelIntegrationRepo
      .createQueryBuilder("integration")
      .where("integration.status = :status", {
        status: IntegrationStatus.ACTIVE,
      })
      .andWhere(
        "(integration.lastSyncAt IS NULL OR integration.lastSyncAt < :fifteenMinutesAgo)",
        { fifteenMinutesAgo }
      )
      .getMany();
  }

  async getSyncStatistics(
    integrationId: number,
    days: number = 7
  ): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.channelSyncLogRepo.find({
      where: {
        integrationId,
        createdAt: Between(startDate, new Date()),
      },
    });

    const total = logs.length;
    const successful = logs.filter(
      (log) => log.status === SyncStatus.SUCCESS
    ).length;
    const failed = logs.filter(
      (log) => log.status === SyncStatus.FAILED
    ).length;
    const pending = logs.filter(
      (log) => log.status === SyncStatus.PENDING
    ).length;

    return {
      total,
      successful,
      failed,
      pending,
      successRate: total > 0 ? (successful / total) * 100 : 0,
    };
  }
}
