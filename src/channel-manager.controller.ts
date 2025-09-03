import { Injectable, Logger } from "@nestjs/common";
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from "@nestjs/common";
import { ChannelManagerService } from "./channel-manager.service";
import { CreateChannelIntegrationDto } from "./dto/create-channel-integration.dto";
import { CreateChannelMappingDto } from "./dto/create-channel-mapping.dto";
import { SyncAvailabilityDto } from "./dto/sync-availability.dto";
import { ChannelIntegration } from "./entities/channel-integration.entity";
import { ChannelMapping } from "./entities/channel-mapping.entity";
import { ChannelAvailability } from "./entities/channel-availability.entity";
import { ChannelRatePlan } from "./entities/channel-rate-plan.entity";
import { ChannelSyncLog } from "./entities/channel-sync-log.entity";
import { SyncOperationType } from "./entities/channel-sync-log.entity";
import { ChannelType } from "./entities/channel-integration.entity";
import { ChannelApiFactory } from "./api/channel-api-factory.service";

@Controller("channel-manager")
export class ChannelManagerController {
  private readonly logger = new Logger(ChannelManagerController.name);

  constructor(
    private readonly channelManagerService: ChannelManagerService,
    private readonly channelApiFactory: ChannelApiFactory
  ) {}

  // Channel Integration Endpoints
  @Post("integrations")
  @HttpCode(HttpStatus.CREATED)
  async createChannelIntegration(
    @Body() dto: CreateChannelIntegrationDto
  ): Promise<ChannelIntegration> {
    // For testing purposes, use a default user ID
    const userId = 1;
    return await this.channelManagerService.createChannelIntegration(
      dto,
      userId
    );
  }

  @Get("integrations")
  async getChannelIntegrations(
    @Query("hotelId") hotelId?: number
  ): Promise<ChannelIntegration[]> {
    if (hotelId) {
      return await this.channelManagerService.getChannelIntegrations(hotelId);
    } else {
      // If no hotelId provided, return all integrations
      return await this.channelManagerService.getAllIntegrations();
    }
  }

  @Get("integrations/:id")
  async getChannelIntegration(
    @Param("id") id: number
  ): Promise<ChannelIntegration> {
    return await this.channelManagerService.getChannelIntegration(id);
  }

  @Put("integrations/:id")
  async updateChannelIntegration(
    @Param("id") id: number,
    @Body() updates: Partial<ChannelIntegration>
  ): Promise<ChannelIntegration> {
    // For testing purposes, use a default user ID
    const userId = 1;
    return await this.channelManagerService.updateChannelIntegration(
      id,
      updates,
      userId
    );
  }

  @Delete("integrations/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteChannelIntegration(@Param("id") id: number): Promise<void> {
    await this.channelManagerService.deleteChannelIntegration(id);
  }

  @Get("integrations/available-types/:hotelId")
  async getAvailableIntegrationTypes(
    @Param("hotelId") hotelId: number
  ): Promise<ChannelType[]> {
    return await this.channelManagerService.getAvailableIntegrationTypes(
      hotelId
    );
  }

  // Channel Mapping Endpoints
  @Post("mappings")
  @HttpCode(HttpStatus.CREATED)
  async createChannelMapping(
    @Body() dto: CreateChannelMappingDto
  ): Promise<ChannelMapping> {
    // For testing purposes, use a default user ID
    const userId = 1;
    return await this.channelManagerService.createChannelMapping(dto, userId);
  }

  @Get("integrations/:integrationId/mappings")
  async getChannelMappings(
    @Param("integrationId") integrationId: number
  ): Promise<ChannelMapping[]> {
    return await this.channelManagerService.getChannelMappings(integrationId);
  }

  @Put("mappings/:id")
  async updateChannelMapping(
    @Param("id") id: number,
    @Body() updates: Partial<ChannelMapping>
  ): Promise<ChannelMapping> {
    // For testing purposes, use a default user ID
    const userId = 1;
    return await this.channelManagerService.updateChannelMapping(
      id,
      updates,
      userId
    );
  }

  // Availability Management Endpoints
  @Post("availability/sync")
  async syncAvailability(
    @Body() dto: SyncAvailabilityDto
  ): Promise<ChannelAvailability> {
    return await this.channelManagerService.syncAvailability(dto);
  }

  @Get("availability")
  async getAvailabilityByDateRange(
    @Query("integrationId") integrationId: number,
    @Query("roomtypeId") roomtypeId: number,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string
  ): Promise<ChannelAvailability[]> {
    return await this.channelManagerService.getAvailabilityByDateRange(
      integrationId,
      roomtypeId,
      new Date(startDate),
      new Date(endDate)
    );
  }

  // Rate Plan Endpoints
  @Post("rate-plans")
  @HttpCode(HttpStatus.CREATED)
  async createChannelRatePlan(@Body() ratePlan: any): Promise<any> {
    // For testing purposes, use a default user ID
    const userId = 1;
    return await this.channelManagerService.createChannelRatePlan(
      ratePlan,
      userId
    );
  }

  @Get("integrations/:integrationId/rate-plans")
  async getChannelRatePlans(
    @Param("integrationId") integrationId: number
  ): Promise<any[]> {
    return await this.channelManagerService.getChannelRatePlans(integrationId);
  }

  // Sync Management Endpoints
  @Post("integrations/:id/sync")
  async triggerManualSync(
    @Param("id") id: number,
    @Body() body: { operationType: SyncOperationType }
  ): Promise<void> {
    await this.channelManagerService.triggerManualSync(id, body.operationType);
  }

  @Get("integrations/:id/sync-logs")
  async getSyncLogs(
    @Param("id") id: number,
    @Query("limit") limit: number = 100
  ): Promise<ChannelSyncLog[]> {
    return await this.channelManagerService.getSyncLogs(id, limit);
  }

  @Get("integrations/:id/sync-statistics")
  async getSyncStatistics(
    @Param("id") id: number,
    @Query("days") days: number = 7
  ): Promise<any> {
    return await this.channelManagerService.getSyncStatistics(id, days);
  }

  // Testing and Validation Endpoints
  @Post("integrations/:id/test")
  async testChannelIntegration(
    @Param("id") id: number
  ): Promise<{ success: boolean; error?: string }> {
    const integration =
      await this.channelManagerService.getChannelIntegration(id);
    return await this.channelManagerService.testChannelIntegration(integration);
  }

  // Channel Information Endpoints
  @Get("channels/supported")
  async getSupportedChannels(): Promise<ChannelType[]> {
    // This would come from the ChannelApiFactory
    return Object.values(ChannelType);
  }

  @Get("channels/:type/features")
  async getChannelFeatures(
    @Param("type") type: ChannelType
  ): Promise<string[]> {
    try {
      return this.channelApiFactory.getChannelFeatures(type);
    } catch (error) {
      this.logger.error(
        `Failed to get features for channel ${type}: ${error.message}`
      );
      return ["Basic integration support"];
    }
  }

  // Guest Integration Endpoints (instead of bookings)
  @Post("guests/:guestId/check-in")
  async handleGuestCheckIn(@Param("guestId") guestId: number): Promise<void> {
    await this.channelManagerService.handleGuestCheckIn(guestId);
  }

  @Post("guests/:guestId/check-out")
  async handleGuestCheckOut(@Param("guestId") guestId: number): Promise<void> {
    await this.channelManagerService.handleGuestCheckOut(guestId);
  }

  // Dashboard and Analytics Endpoints
  @Get("dashboard/summary")
  async getDashboardSummary(@Query("hotelId") hotelId: number): Promise<any> {
    const integrations =
      await this.channelManagerService.getChannelIntegrations(hotelId);

    const summary = {
      totalIntegrations: integrations.length,
      activeIntegrations: integrations.filter((i) => i.status === "ACTIVE")
        .length,
      pendingIntegrations: integrations.filter((i) => i.status === "PENDING")
        .length,
      errorIntegrations: integrations.filter((i) => i.status === "ERROR")
        .length,
      channels: integrations.map((i) => ({
        id: i.id,
        name: i.channelName,
        type: i.channelType,
        status: i.status,
        lastSync: i.lastSyncAt,
      })),
    };

    return summary;
  }

  @Get("dashboard/performance")
  async getPerformanceMetrics(
    @Query("hotelId") hotelId: number,
    @Query("days") days: number = 30
  ): Promise<any> {
    const integrations =
      await this.channelManagerService.getChannelIntegrations(hotelId);

    const performanceData = await Promise.all(
      integrations.map(async (integration) => {
        const stats = await this.channelManagerService.getSyncStatistics(
          integration.id,
          days
        );
        return {
          integrationId: integration.id,
          channelName: integration.channelName,
          channelType: integration.channelType,
          ...stats,
        };
      })
    );

    return performanceData;
  }
}
