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
import {
  ApiTags,
  ApiParam,
  ApiBody,
  ApiResponse,
  ApiConsumes,
  ApiExtraModels,
  getSchemaPath,
} from "@nestjs/swagger";
import { WebhookPayloadDto } from "./dto/webhook-payload.dto";
import { SevenWebhookPayloadDto } from "./dto/seven-webhook-payload.dto";
import { CreateChannelIntegrationDto } from "./dto/create-channel-integration.dto";
import { CreateChannelMappingDto } from "./dto/create-channel-mapping.dto";
import { SyncAvailabilityDto } from "./dto/sync-availability.dto";
import { GetBookingsDto } from "./dto/get-bookings.dto";
import { ChannelIntegration } from "./entities/channel-integration.entity";
import { ChannelMapping } from "./entities/channel-mapping.entity";
import { ChannelAvailability } from "./entities/channel-availability.entity";
import { ChannelRatePlan } from "./entities/channel-rate-plan.entity";
import { ChannelSyncLog } from "./entities/channel-sync-log.entity";
import { Guest, BookingStatus } from "./entities/guest.entity";
import { SyncOperationType } from "./entities/channel-sync-log.entity";
import { ChannelType } from "./entities/channel-integration.entity";
import { ChannelApiFactory } from "./api/channel-api-factory.service";

@ApiTags("Channel Manager")
@ApiExtraModels(Guest, GetBookingsDto)
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

  @Put("rate-plans/:id")
  @ApiParam({
    name: "id",
    description: "Rate plan ID",
    example: 1,
  })
  @ApiBody({
    description: "Rate plan fields to update (prices and minimum stay)",
    schema: {
      type: "object",
      properties: {
        baseRate: {
          type: "number",
          example: 175.0,
          description: "Base price for the rate plan",
        },
        minStay: {
          type: "number",
          example: 2,
          description: "Minimum stay requirement (nights)",
        },
        maxStay: {
          type: "number",
          example: 30,
          description: "Maximum stay allowed (nights)",
        },
        currency: { type: "string", example: "USD" },
        cancellationPolicy: {
          type: "string",
          example: "Free cancellation 48h before check-in",
        },
        closedToArrival: { type: "boolean" },
        closedToDeparture: { type: "boolean" },
        advanceBookingDays: { type: "number" },
        rateModifier: { type: "number" },
        isActive: { type: "boolean" },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Rate plan updated successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Rate plan not found",
  })
  async updateChannelRatePlan(
    @Param("id") id: number,
    @Body() updates: Partial<ChannelRatePlan>
  ): Promise<ChannelRatePlan> {
    // For testing purposes, use a default user ID
    const userId = 1;
    return await this.channelManagerService.updateChannelRatePlan(
      id,
      updates,
      userId
    );
  }

  // Booking Management Endpoints
  @Get("bookings")
  @ApiResponse({
    status: 200,
    description: "Returns list of bookings with filters",
    schema: {
      type: "object",
      properties: {
        bookings: {
          type: "array",
          items: { $ref: getSchemaPath(Guest) },
        },
        total: {
          type: "number",
          description: "Total number of matching bookings",
        },
      },
    },
  })
  async getBookings(@Query() query: GetBookingsDto): Promise<any> {
    return await this.channelManagerService.getBookings(query);
  }

  @Get("bookings/:bookingCode")
  @ApiParam({
    name: "bookingCode",
    description: "Unique booking code",
    example: "BK-2024-001",
  })
  @ApiResponse({
    status: 200,
    description: "Returns single booking",
  })
  @ApiResponse({
    status: 404,
    description: "Booking not found",
  })
  async getBookingByCode(
    @Param("bookingCode") bookingCode: string
  ): Promise<any> {
    return await this.channelManagerService.getBookingByCode(bookingCode);
  }

  @Post("bookings")
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({
    description: "Booking data",
    schema: {
      type: "object",
      required: [
        "bookingCode",
        "firstName",
        "lastName",
        "email",
        "startDate",
        "endDate",
        "hotelId",
        "roomTypeId",
      ],
      properties: {
        bookingCode: { type: "string", example: "BK-2024-001" },
        otaBookingCode: { type: "string", example: "BCOM-12345678" },
        firstName: { type: "string", example: "John" },
        lastName: { type: "string", example: "Doe" },
        email: { type: "string", example: "john.doe@example.com" },
        phone: { type: "string", example: "+1234567890" },
        startDate: { type: "string", format: "date", example: "2024-06-01" },
        endDate: { type: "string", format: "date", example: "2024-06-05" },
        amount: { type: "number", example: 500.0 },
        currency: { type: "string", example: "USD" },
        source: { type: "string", example: "BOOKING_COM" },
        status: {
          type: "string",
          enum: [
            "PENDING",
            "CONFIRMED",
            "CHECKED_IN",
            "CHECKED_OUT",
            "CANCELED",
            "NO_SHOW",
            "MODIFIED",
          ],
          example: "CONFIRMED",
        },
        hotelId: { type: "number", example: 1 },
        roomTypeId: { type: "number", example: 101 },
        integrationId: { type: "number", example: 1 },
        guestDetails: { type: "object" },
        channelData: { type: "object" },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Booking created successfully",
  })
  async createBooking(@Body() bookingData: any): Promise<any> {
    return await this.channelManagerService.createBooking(bookingData);
  }

  @Put("bookings/:bookingCode")
  @ApiParam({
    name: "bookingCode",
    description: "Unique booking code",
    example: "BK-2024-001",
  })
  @ApiBody({
    description: "Fields to update",
    schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: [
            "PENDING",
            "CONFIRMED",
            "CHECKED_IN",
            "CHECKED_OUT",
            "CANCELED",
            "NO_SHOW",
            "MODIFIED",
          ],
        },
        amount: { type: "number" },
        currency: { type: "string" },
        startDate: { type: "string", format: "date" },
        endDate: { type: "string", format: "date" },
        cancelReason: { type: "string" },
        canceledAt: { type: "string", format: "date-time" },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Booking updated successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Booking not found",
  })
  async updateBooking(
    @Param("bookingCode") bookingCode: string,
    @Body() updates: any
  ): Promise<any> {
    return await this.channelManagerService.updateBooking(bookingCode, updates);
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

  // Inbound Webhook Endpoint for OTA bookings and updates
  @Post("webhooks/:type")
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiParam({
    name: "type",
    description: "Channel type (e.g., booking, expedia, seven)",
    enum: ChannelType,
  })
  @ApiConsumes("application/json")
  @ApiExtraModels(WebhookPayloadDto, SevenWebhookPayloadDto)
  @ApiBody({
    description:
      "Inbound webhook payload. Must include hotelId to resolve integration. For 7even, use SevenWebhookPayloadDto structure.",
    schema: {
      oneOf: [
        { $ref: getSchemaPath(SevenWebhookPayloadDto) },
        { $ref: getSchemaPath(WebhookPayloadDto) },
      ],
    },
    examples: {
      seven_reservation: {
        summary: "7even reservation webhook",
        value: {
          hotelId: 42,
          event_type: "reservation",
          data: {
            room_type_id: "voyager-deluxe-plus",
            check_in: "2025-10-12",
            check_out: "2025-10-15",
            rooms: 1,
            guest: {
              name: "Frank George",
              email: "admin@7evensuites.com",
            },
          },
        },
      },
      seven_cancellation: {
        summary: "7even cancellation webhook",
        value: {
          hotelId: 42,
          event_type: "cancellation",
          data: {
            room_type_id: "voyager-deluxe-plus",
            check_in: "2025-10-12",
            check_out: "2025-10-15",
            rooms: 1,
            guest: {
              name: "Frank George",
              email: "admin@7evensuites.com",
            },
          },
        },
      },
      seven_modification: {
        summary: "7even modification webhook",
        value: {
          hotelId: 42,
          event_type: "modification",
          data: {
            room_type_id: "voyager-deluxe-plus",
            check_in: "2025-10-12",
            check_out: "2025-10-16",
            rooms: 2,
            guest: {
              name: "Frank George",
              email: "admin@7evensuites.com",
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 202, description: "Webhook accepted for processing" })
  async handleChannelWebhook(
    @Param("type") type: ChannelType,
    @Body() body: WebhookPayloadDto
  ): Promise<{ status: string; message: string }> {
    // Expect hotelId in payload to resolve the correct integration
    const hotelId = body?.hotelId;
    if (!hotelId) {
      throw new Error("hotelId is required in webhook payload");
    }

    this.logger.log(`[Webhook] Received type=${type} hotelId=${hotelId}`);

    await this.channelManagerService.handleIncomingWebhookByHotelAndType(
      hotelId,
      type,
      body
    );

    this.logger.log(`[Webhook] Accepted type=${type} hotelId=${hotelId}`);
    return { status: "accepted", message: "Webhook processed successfully" };
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
