import { Injectable, Logger, UseGuards } from "@nestjs/common";
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
} from "@nestjs/common";
import { ApiKeyGuard } from "./auth/api-key.guard";
import { ChannelManagerService } from "./channel-manager.service";
import {
  ApiTags,
  ApiParam,
  ApiBody,
  ApiResponse,
  ApiConsumes,
  ApiExtraModels,
  ApiOperation,
  ApiQuery,
  ApiSecurity,
  getSchemaPath,
} from "@nestjs/swagger";
import { WebhookPayloadDto } from "./dto/webhook-payload.dto";
import { SevenWebhookPayloadDto } from "./dto/seven-webhook-payload.dto";
import { WakanowWebhookPayloadDto } from "./dto/wakanow-webhook-payload.dto";
import { CreateExternalBookingDto } from "./dto/create-external-booking.dto";
import { CreateChannelIntegrationDto } from "./dto/create-channel-integration.dto";
import { CreateChannelMappingDto } from "./dto/create-channel-mapping.dto";
import { SyncAvailabilityDto } from "./dto/sync-availability.dto";
import { CreateRoomTypeDto } from "./dto/create-roomtype.dto";
import { CreateRoomDto } from "./dto/create-room.dto";
import { GetBookingsDto } from "./dto/get-bookings.dto";
import {
  ChannelIntegration,
  ChannelType,
} from "./entities/channel-integration.entity";
import { ChannelMapping } from "./entities/channel-mapping.entity";
import { ChannelAvailability } from "./entities/channel-availability.entity";
import { ChannelRatePlan } from "./entities/channel-rate-plan.entity";
import {
  ChannelSyncLog,
  SyncOperationType,
} from "./entities/channel-sync-log.entity";
import { Guest, BookingStatus } from "./entities/guest.entity";
import { ChannelApiFactory } from "./api/channel-api-factory.service";
import { WebhookEventType } from "./services/webhook.service";
import {
  sampleChannelIntegrations,
  sampleChannelMappings,
  sampleAvailability,
  sampleRatePlans,
  sampleBookings,
  sampleSyncLogs,
  sampleDashboard,
  sampleChannelInfo,
  sampleTesting,
  sampleWebhooks,
  sampleGuestOperations,
} from "./sample-data";
import { createSwaggerExample } from "./swagger-helpers";

@ApiTags("Channel Manager")
@ApiSecurity("ApiKeyAuth")
@ApiExtraModels(
  Guest,
  GetBookingsDto,
  ChannelIntegration,
  ChannelMapping,
  ChannelAvailability,
  ChannelRatePlan,
  ChannelSyncLog,
)
@Controller("channel-manager")
export class ChannelManagerController {
  private readonly logger = new Logger(ChannelManagerController.name);

  constructor(
    private readonly channelManagerService: ChannelManagerService,
    private readonly channelApiFactory: ChannelApiFactory,
  ) {}

  // Hotel Management Endpoints
  @Get("hotels")
  @UseGuards(ApiKeyGuard)
  @ApiOperation({
    summary: "Get hotels by registration source",
    description:
      "Fetches hotels from Oreon PMS filtered by registration source, excluding DIRECT registrations. If no source is specified, returns all hotels except those registered DIRECT.",
  })
  @ApiQuery({
    name: "registrationSource",
    required: false,
    enum: ["WAKANOW", "CHANNEL_MANAGER", "PARTNER", "API", "ADMIN"],
    description: "Filter by specific registration source (optional)",
    example: "CHANNEL_MANAGER",
  })
  @ApiResponse({
    status: 200,
    description: "List of hotels retrieved successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - invalid API key",
  })
  async getHotelsByRegistrationSource(
    @Query("registrationSource") registrationSource?: string,
  ) {
    return this.channelManagerService.getHotelsByRegistrationSource(
      registrationSource,
    );
  }

  @Get("hotels/search")
  @ApiOperation({ summary: "Search hotels by name or email" })
  @ApiQuery({ name: "name", required: false, type: String })
  @ApiQuery({ name: "email", required: false, type: String })
  @ApiResponse({ status: 200, description: "Found matching hotels" })
  searchHotels(@Query("name") name?: string, @Query("email") email?: string) {
    return this.channelManagerService.searchHotels(name, email);
  }

  @Post("roomtypes")
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create room type for a hotel",
    description:
      "Creates a new room type for a hotel in Oreon PMS. Used to set up hotel inventory.",
  })
  @ApiBody({
    type: CreateRoomTypeDto,
    description: "Room type creation data",
  })
  @ApiResponse({
    status: 201,
    description: "Room type created successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Bad request",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - invalid API key",
  })
  @ApiResponse({
    status: 404,
    description: "Hotel not found",
  })
  async createRoomType(@Body() payload: CreateRoomTypeDto) {
    return this.channelManagerService.createRoomType(payload);
  }

  @Post("rooms")
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create room for a hotel",
    description:
      "Creates a new room for a hotel in Oreon PMS. Requires an existing room type.",
  })
  @ApiBody({
    type: CreateRoomDto,
    description: "Room creation data",
  })
  @ApiResponse({
    status: 201,
    description: "Room created successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - room type does not belong to hotel",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - invalid API key",
  })
  @ApiResponse({
    status: 404,
    description: "Hotel or room type not found",
  })
  async createRoom(@Body() payload: CreateRoomDto) {
    return this.channelManagerService.createRoom(payload);
  }

  @Get("hotels/:hotelId/roomtypes")
  @UseGuards(ApiKeyGuard)
  @ApiOperation({
    summary: "Get hotel room types with rooms",
    description:
      "Fetches all room types for a hotel along with their associated rooms from Oreon PMS.",
  })
  @ApiParam({
    name: "hotelId",
    description: "Hotel ID",
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "Room types with rooms retrieved successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - invalid API key",
  })
  @ApiResponse({
    status: 404,
    description: "Hotel not found",
  })
  async getHotelRoomTypes(@Param("hotelId") hotelId: number) {
    return this.channelManagerService.getHotelRoomTypes(hotelId);
  }

  // Channel Type Endpoints
  @Get("channel-types")
  @ApiOperation({
    summary: "Get all available channel types",
    description:
      "Returns a list of all supported channel/OTA types in the system.",
  })
  @ApiResponse({
    status: 200,
    description: "List of channel types",
    schema: {
      type: "array",
      items: {
        type: "string",
        enum: Object.values(ChannelType),
      },
    },
  })
  async getChannelTypes(): Promise<string[]> {
    return Object.values(ChannelType);
  }

  // Channel Integration Endpoints
  @Post("integrations")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create channel integration",
    description:
      "Registers a new channel integration for a hotel and returns the created integration record.",
  })
  @ApiBody({
    description:
      "Payload for creating a channel integration. Can include hotelId for existing hotels, or hotel object for onboarding new hotels.",
    type: CreateChannelIntegrationDto,
    examples: {
      bookingCom: {
        summary: "Booking.com integration (existing hotel)",
        value: sampleChannelIntegrations.createRequest,
      },
      bookingComWithOnboarding: {
        summary: "Booking.com integration with hotel onboarding",
        value: sampleChannelIntegrations.createRequestWithHotelOnboarding,
      },
      expedia: {
        summary: "Expedia integration",
        value: {
          hotelId: 1,
          channelType: "EXPEDIA",
          channelName: "Expedia Partner Integration",
          apiKey: "exp_api_key_67890",
          apiSecret: "exp_secret_xyz",
          channelPropertyId: "EXP-PROP-12345",
          isWebhookEnabled: true,
          syncIntervalMinutes: 30,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Channel integration created successfully",
    content: {
      "application/json": {
        schema: { $ref: getSchemaPath(ChannelIntegration) },
        example: createSwaggerExample(sampleChannelIntegrations.single),
      },
    },
  })
  async createChannelIntegration(
    @Body() dto: CreateChannelIntegrationDto,
  ): Promise<ChannelIntegration> {
    // For testing purposes, use a default user ID
    const userId = 1;
    return await this.channelManagerService.createChannelIntegration(
      dto,
      userId,
    );
  }

  @Get("integrations")
  @ApiOperation({
    summary: "List channel integrations",
    description:
      "Returns channel integrations for a hotel when `hotelId` is provided; otherwise, returns all integrations in the system.",
  })
  @ApiQuery({
    name: "hotelId",
    required: false,
    type: Number,
    description: "Filter integrations belonging to a specific hotel",
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "List of channel integrations",
    type: ChannelIntegration,
    isArray: true,
    content: {
      "application/json": {
        schema: {
          type: "array",
          items: { $ref: getSchemaPath(ChannelIntegration) },
        },
        example: createSwaggerExample(sampleChannelIntegrations.list),
      },
    },
  })
  async getChannelIntegrations(
    @Query("hotelId") hotelId?: number,
  ): Promise<ChannelIntegration[]> {
    if (hotelId) {
      return await this.channelManagerService.getChannelIntegrations(hotelId);
    } else {
      // If no hotelId provided, return all integrations
      return await this.channelManagerService.getAllIntegrations();
    }
  }

  @Get("integrations/:id")
  @ApiOperation({
    summary: "Get channel integration",
    description: "Retrieves a channel integration by its unique identifier.",
  })
  @ApiParam({
    name: "id",
    description: "Channel integration identifier",
    example: 42,
  })
  @ApiResponse({
    status: 200,
    description: "Channel integration details",
    type: ChannelIntegration,
    content: {
      "application/json": {
        schema: { $ref: getSchemaPath(ChannelIntegration) },
        example: createSwaggerExample(sampleChannelIntegrations.single),
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Channel integration not found",
  })
  async getChannelIntegration(
    @Param("id") id: number,
  ): Promise<ChannelIntegration> {
    return await this.channelManagerService.getChannelIntegration(id);
  }

  @Put("integrations/:id")
  @ApiOperation({
    summary: "Update channel integration",
    description:
      "Applies partial updates to an existing channel integration and returns the updated record.",
  })
  @ApiParam({
    name: "id",
    description: "Channel integration identifier",
    example: 42,
  })
  @ApiBody({
    description: "Fields of the channel integration to update",
    schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          example: "ACTIVE",
          description: "Lifecycle status of the integration",
        },
        credentials: {
          type: "object",
          example: { apiKey: "updated-secret-key" },
          description: "Provider credentials required for syncing",
        },
        settings: {
          type: "object",
          example: { autoSync: false, locale: "en-GB" },
          description: "Optional settings for the integration",
        },
        lastSyncAt: {
          type: "string",
          format: "date-time",
          example: "2025-01-02T09:45:00.000Z",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Channel integration updated successfully",
    type: ChannelIntegration,
    content: {
      "application/json": {
        schema: { $ref: getSchemaPath(ChannelIntegration) },
        example: createSwaggerExample(sampleChannelIntegrations.single),
      },
    },
  })
  async updateChannelIntegration(
    @Param("id") id: number,
    @Body() updates: Partial<ChannelIntegration>,
  ): Promise<ChannelIntegration> {
    // For testing purposes, use a default user ID
    const userId = 1;
    return await this.channelManagerService.updateChannelIntegration(
      id,
      updates,
      userId,
    );
  }

  @Delete("integrations/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete channel integration",
    description:
      "Removes a channel integration. Existing channel mappings using the integration must be handled separately.",
  })
  @ApiParam({
    name: "id",
    description: "Channel integration identifier",
    example: 42,
  })
  @ApiResponse({
    status: 204,
    description: "Channel integration deleted",
  })
  async deleteChannelIntegration(@Param("id") id: number): Promise<void> {
    await this.channelManagerService.deleteChannelIntegration(id);
  }

  @Get("integrations/available-types/:hotelId")
  @ApiOperation({
    summary: "List available integration types",
    description:
      "Provides a list of channel types that are not yet connected for the specified hotel.",
  })
  @ApiParam({
    name: "hotelId",
    description: "Hotel identifier to check availability for",
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "Available channel types for the hotel",
    schema: {
      type: "array",
      items: {
        type: "string",
        enum: Object.values(ChannelType),
      },
    },
    content: {
      "application/json": {
        schema: {
          type: "array",
          items: {
            type: "string",
            enum: Object.values(ChannelType),
          },
        },
        example: sampleChannelIntegrations.availableTypes,
      },
    },
  })
  async getAvailableIntegrationTypes(
    @Param("hotelId") hotelId: number,
  ): Promise<ChannelType[]> {
    return await this.channelManagerService.getAvailableIntegrationTypes(
      hotelId,
    );
  }

  // Channel Mapping Endpoints
  @Post("mappings")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create channel mapping",
    description:
      "Creates a mapping between hotel inventory and channel content so rates and availability can be synced.",
  })
  @ApiBody({
    description: "Payload for creating channel mappings",
    type: CreateChannelMappingDto,
    examples: {
      standardRoom: {
        summary: "Standard room mapping",
        value: createSwaggerExample(sampleChannelMappings.createRequest),
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Channel mapping created successfully",
    type: ChannelMapping,
    content: {
      "application/json": {
        schema: { $ref: getSchemaPath(ChannelMapping) },
        example: createSwaggerExample(sampleChannelMappings.list[0]),
      },
    },
  })
  async createChannelMapping(
    @Body() dto: CreateChannelMappingDto,
  ): Promise<ChannelMapping> {
    // For testing purposes, use a default user ID
    const userId = 1;
    return await this.channelManagerService.createChannelMapping(dto, userId);
  }

  @Get("integrations/:integrationId/mappings")
  @ApiOperation({
    summary: "List channel mappings",
    description:
      "Retrieves all mappings associated with a specific channel integration.",
  })
  @ApiParam({
    name: "integrationId",
    description: "Channel integration identifier",
    example: 42,
  })
  @ApiResponse({
    status: 200,
    description: "Channel mappings for the integration",
    type: ChannelMapping,
    isArray: true,
    content: {
      "application/json": {
        schema: {
          type: "array",
          items: { $ref: getSchemaPath(ChannelMapping) },
        },
        example: createSwaggerExample(sampleChannelMappings.list),
      },
    },
  })
  async getChannelMappings(
    @Param("integrationId") integrationId: number,
  ): Promise<ChannelMapping[]> {
    return await this.channelManagerService.getChannelMappings(integrationId);
  }

  @Put("mappings/:id")
  @ApiOperation({
    summary: "Update channel mapping",
    description:
      "Updates a channel mapping to reflect changes in linked inventory or rate plan information.",
  })
  @ApiParam({
    name: "id",
    description: "Channel mapping identifier",
    example: 99,
  })
  @ApiBody({
    description: "Fields of the channel mapping to update",
    schema: {
      type: "object",
      properties: {
        channelRoomIdentifier: {
          type: "string",
          example: "DLX-SUITE",
          description: "Identifier used by the channel for the mapped room",
        },
        channelRatePlanIdentifier: {
          type: "string",
          example: "FLEX-NRB",
          description: "Identifier used by the channel for the rate plan",
        },
        restrictions: {
          type: "object",
          example: { minStay: 2, maxStay: 7 },
          description: "Optional stay restrictions applied to the mapping",
        },
        isActive: {
          type: "boolean",
          example: true,
          description: "Whether the mapping is enabled for syncing",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Channel mapping updated successfully",
    type: ChannelMapping,
    content: {
      "application/json": {
        schema: { $ref: getSchemaPath(ChannelMapping) },
        example: createSwaggerExample(sampleChannelMappings.list[0]),
      },
    },
  })
  async updateChannelMapping(
    @Param("id") id: number,
    @Body() updates: Partial<ChannelMapping>,
  ): Promise<ChannelMapping> {
    // For testing purposes, use a default user ID
    const userId = 1;
    return await this.channelManagerService.updateChannelMapping(
      id,
      updates,
      userId,
    );
  }

  // Availability Management Endpoints
  @Post("availability/sync")
  @ApiOperation({
    summary: "Sync availability",
    description:
      "Pushes availability updates from the PMS to the connected channel for the specified room types and dates.",
  })
  @ApiBody({
    description: "Payload describing availability sync request",
    type: SyncAvailabilityDto,
    examples: {
      nightlyAvailability: {
        summary: "Nightly availability update",
        value: createSwaggerExample(sampleAvailability.syncRequest),
      },
      singleDate: {
        summary: "Single date availability update",
        value: createSwaggerExample(sampleAvailability.syncRequestSingle),
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Availability sync queued/executed",
    type: ChannelAvailability,
    content: {
      "application/json": {
        schema: { $ref: getSchemaPath(ChannelAvailability) },
        example: createSwaggerExample(sampleAvailability.list[0]),
      },
    },
  })
  async syncAvailability(@Body() dto: SyncAvailabilityDto): Promise<any> {
    return await this.channelManagerService.syncAvailability(dto);
  }

  @Get("availability")
  @ApiOperation({
    summary: "Get availability by date range",
    description:
      "Returns channel availability records for a specific integration, room type, and date range.",
  })
  @ApiQuery({
    name: "integrationId",
    type: Number,
    description: "Channel integration identifier",
    example: 42,
  })
  @ApiQuery({
    name: "roomtypeId",
    type: Number,
    description: "Mapped room type identifier",
    example: 301,
  })
  @ApiQuery({
    name: "startDate",
    type: String,
    description: "Start date of the range (inclusive, YYYY-MM-DD)",
    example: "2025-02-01",
  })
  @ApiQuery({
    name: "endDate",
    type: String,
    description: "End date of the range (inclusive, YYYY-MM-DD)",
    example: "2025-02-07",
  })
  @ApiResponse({
    status: 200,
    description: "Channel availability records for the time range",
    type: ChannelAvailability,
    isArray: true,
    content: {
      "application/json": {
        schema: {
          type: "array",
          items: { $ref: getSchemaPath(ChannelAvailability) },
        },
        example: createSwaggerExample(sampleAvailability.list),
      },
    },
  })
  async getAvailabilityByDateRange(
    @Query("integrationId") integrationId: number,
    @Query("roomtypeId") roomtypeId: number,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ): Promise<ChannelAvailability[]> {
    return await this.channelManagerService.getAvailabilityByDateRange(
      integrationId,
      roomtypeId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  // Rate Plan Endpoints
  @Post("rate-plans")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create channel rate plan",
    description:
      "Creates a new rate plan on the PMS side and associates it with a channel integration.",
  })
  @ApiBody({
    description: "Payload describing the rate plan to create",
    schema: {
      type: "object",
      required: ["integrationId", "name", "baseRate", "currency"],
      properties: {
        integrationId: {
          type: "number",
          example: 42,
          description: "Channel integration identifier",
        },
        name: {
          type: "string",
          example: "Standard Flexible",
          description: "Display name of the rate plan",
        },
        baseRate: {
          type: "number",
          example: 180,
          description: "Base nightly rate",
        },
        currency: {
          type: "string",
          example: "USD",
          description: "Currency code for the rate",
        },
        restrictions: {
          type: "object",
          example: { minStay: 1, maxStay: 21 },
          description: "Optional stay restrictions",
        },
        cancellationPolicy: {
          type: "string",
          example: "Free cancellation up to 48 hours before arrival",
        },
        channelRatePlanIdentifier: {
          type: "string",
          example: "FLEX-REFUNDABLE",
        },
      },
    },
    examples: {
      standardFlexible: {
        summary: "Standard Flexible Rate Plan",
        value: sampleRatePlans.createRequest,
      },
      nonRefundable: {
        summary: "Non-Refundable Discount Rate",
        value: {
          integrationId: 1,
          name: "Non-Refundable Discount",
          baseRate: 120,
          currency: "USD",
          restrictions: { minStay: 2, maxStay: 14 },
          cancellationPolicy: "Non-refundable. No cancellation allowed.",
          channelRatePlanIdentifier: "NON-REFUNDABLE",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Rate plan created successfully",
    content: {
      "application/json": {
        schema: { $ref: getSchemaPath(ChannelRatePlan) },
        example: createSwaggerExample(sampleRatePlans.list[0]),
      },
    },
  })
  async createChannelRatePlan(@Body() ratePlan: any): Promise<any> {
    // For testing purposes, use a default user ID
    const userId = 1;
    return await this.channelManagerService.createChannelRatePlan(
      ratePlan,
      userId,
    );
  }

  @Get("integrations/:integrationId/rate-plans")
  @ApiOperation({
    summary: "List channel rate plans",
    description: "Fetches all rate plans linked to the specified integration.",
  })
  @ApiParam({
    name: "integrationId",
    description: "Channel integration identifier",
    example: 42,
  })
  @ApiResponse({
    status: 200,
    description: "Rate plans linked to the integration",
    type: ChannelRatePlan,
    isArray: true,
    content: {
      "application/json": {
        schema: {
          type: "array",
          items: { $ref: getSchemaPath(ChannelRatePlan) },
        },
        example: createSwaggerExample(sampleRatePlans.list),
      },
    },
  })
  async getChannelRatePlans(
    @Param("integrationId") integrationId: number,
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
    content: {
      "application/json": {
        schema: { $ref: getSchemaPath(ChannelRatePlan) },
        example: createSwaggerExample(sampleRatePlans.list[0]),
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Rate plan not found",
  })
  async updateChannelRatePlan(
    @Param("id") id: number,
    @Body() updates: Partial<ChannelRatePlan>,
  ): Promise<ChannelRatePlan> {
    // For testing purposes, use a default user ID
    const userId = 1;
    return await this.channelManagerService.updateChannelRatePlan(
      id,
      updates,
      userId,
    );
  }

  // Booking Management Endpoints
  @Get("bookings")
  @ApiOperation({
    summary: "List bookings",
    description:
      "Retrieves bookings filtered by optional criteria such as date range, status, or channel.",
  })
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
    content: {
      "application/json": {
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
        example: createSwaggerExample(sampleBookings.list),
      },
    },
  })
  async getBookings(@Query() query: GetBookingsDto): Promise<any> {
    return await this.channelManagerService.getBookings(query);
  }

  @Get("bookings/:bookingCode")
  @ApiOperation({
    summary: "Get booking by code",
    description: "Retrieves a single booking using its unique booking code.",
  })
  @ApiParam({
    name: "bookingCode",
    description: "Unique booking code",
    example: "BK-2024-001",
  })
  @ApiResponse({
    status: 200,
    description: "Returns single booking",
    content: {
      "application/json": {
        schema: { $ref: getSchemaPath(Guest) },
        example: createSwaggerExample(sampleBookings.single),
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Booking not found",
  })
  async getBookingByCode(
    @Param("bookingCode") bookingCode: string,
  ): Promise<any> {
    return await this.channelManagerService.getBookingByCode(bookingCode);
  }

  @Post("bookings")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create booking",
    description:
      "Creates a booking record, typically used for manual reservations or inbound OTA pushes.",
  })
  @ApiBody({
    description: "Booking data",
    schema: {
      type: "object",
      required: [
        "bookingCode",
        "fullName",
        "email",
        "startDate",
        "endDate",
        "hotelId",
        "roomTypeId",
      ],
      properties: {
        bookingCode: { type: "string", example: "BK-2024-001" },
        otaBookingCode: { type: "string", example: "BCOM-12345678" },
        fullName: { type: "string", example: "John Doe" },
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
        roomTypeId: { type: "number", example: 14 },
        integrationId: { type: "number", example: 1 },
        guestDetails: { type: "object" },
        channelData: { type: "object" },
      },
    },
    examples: {
      bookingCom: {
        summary: "Booking.com booking",
        value: sampleBookings.createRequest,
      },
      expedia: {
        summary: "Expedia booking",
        value: {
          bookingCode: "BK-2024-002",
          otaBookingCode: "EXP-98765432",
          fullName: "Jane Smith",
          email: "jane.smith@example.com",
          phone: "+0987654321",
          startDate: "2024-06-10",
          endDate: "2024-06-12",
          amount: 300.0,
          currency: "USD",
          source: "EXPEDIA",
          status: "CONFIRMED",
          hotelId: 1,
          roomTypeId: 15,
          integrationId: 2,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Booking created successfully",
    content: {
      "application/json": {
        schema: { $ref: getSchemaPath(Guest) },
        example: createSwaggerExample(sampleBookings.single),
      },
    },
  })
  async createBooking(@Body() bookingData: any): Promise<any> {
    return await this.channelManagerService.createBooking(bookingData);
  }

  @Put("bookings/:bookingCode")
  @ApiOperation({
    summary: "Update booking",
    description:
      "Updates booking information such as status, stay dates, amount, or cancellation details.",
  })
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
    content: {
      "application/json": {
        schema: { $ref: getSchemaPath(Guest) },
        example: createSwaggerExample(sampleBookings.single),
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Booking not found",
  })
  async updateBooking(
    @Param("bookingCode") bookingCode: string,
    @Body() updates: any,
  ): Promise<any> {
    return await this.channelManagerService.updateBooking(bookingCode, updates);
  }

  // Sync Management Endpoints
  @Post("integrations/:id/sync")
  @ApiOperation({
    summary: "Trigger manual sync",
    description:
      "Manually triggers a specific sync operation (e.g., availability, rates, reservations) for an integration.",
  })
  @ApiParam({
    name: "id",
    description: "Channel integration identifier",
    example: 42,
  })
  @ApiBody({
    description: "Sync operation to trigger",
    schema: {
      type: "object",
      required: ["operationType"],
      properties: {
        operationType: {
          type: "string",
          enum: Object.values(SyncOperationType),
          example: "AVAILABILITY",
        },
      },
    },
    examples: {
      fullSync: {
        summary: "Full sync operation",
        value: sampleSyncLogs.triggerSyncRequest,
      },
      availabilitySync: {
        summary: "Availability sync only",
        value: {
          operationType: "AVAILABILITY_UPDATE",
        },
      },
      rateSync: {
        summary: "Rate sync only",
        value: {
          operationType: "RATE_UPDATE",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Sync job queued successfully",
  })
  async triggerManualSync(
    @Param("id") id: number,
    @Body() body: { operationType: SyncOperationType },
  ): Promise<void> {
    await this.channelManagerService.triggerManualSync(id, body.operationType);
  }

  @Get("integrations/:id/sync-logs")
  @ApiOperation({
    summary: "List sync logs",
    description:
      "Returns the most recent sync logs for an integration, ordered from newest to oldest.",
  })
  @ApiParam({
    name: "id",
    description: "Channel integration identifier",
    example: 42,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Number of records to return (defaults to 100)",
    example: 50,
  })
  @ApiResponse({
    status: 200,
    description: "Sync logs for the integration",
    type: ChannelSyncLog,
    isArray: true,
    content: {
      "application/json": {
        schema: {
          type: "array",
          items: { $ref: getSchemaPath(ChannelSyncLog) },
        },
        example: createSwaggerExample(sampleSyncLogs.list),
      },
    },
  })
  async getSyncLogs(
    @Param("id") id: number,
    @Query("limit") limit: number = 100,
  ): Promise<ChannelSyncLog[]> {
    return await this.channelManagerService.getSyncLogs(id, limit);
  }

  @Get("integrations/:id/sync-statistics")
  @ApiOperation({
    summary: "Get sync statistics",
    description:
      "Provides aggregated statistics (success rate, failure rate, totals) for sync jobs over a given number of days.",
  })
  @ApiParam({
    name: "id",
    description: "Channel integration identifier",
    example: 42,
  })
  @ApiQuery({
    name: "days",
    required: false,
    type: Number,
    description: "Lookback window in days (defaults to 7)",
    example: 14,
  })
  @ApiResponse({
    status: 200,
    description: "Aggregated sync statistics",
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            totalSyncs: { type: "number" },
            successfulSyncs: { type: "number" },
            failedSyncs: { type: "number" },
            successRate: { type: "number" },
          },
        },
        example: createSwaggerExample(sampleSyncLogs.statistics),
      },
    },
  })
  async getSyncStatistics(
    @Param("id") id: number,
    @Query("days") days: number = 7,
  ): Promise<any> {
    return await this.channelManagerService.getSyncStatistics(id, days);
  }

  // Testing and Validation Endpoints
  @Post("integrations/:id/test")
  @ApiOperation({
    summary: "Test channel integration",
    description:
      "Performs a connectivity test using the stored credentials for the integration and returns the result.",
  })
  @ApiParam({
    name: "id",
    description: "Channel integration identifier",
    example: 42,
  })
  @ApiResponse({
    status: 200,
    description: "Result of the integration test",
    schema: {
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        error: {
          type: "string",
          example: "Invalid credentials",
          nullable: true,
        },
      },
    },
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            error: { type: "string", nullable: true },
          },
        },
        examples: {
          success: {
            summary: "Successful test",
            value: sampleTesting.testResponse,
          },
          failure: {
            summary: "Failed test",
            value: sampleTesting.testResponseFailure,
          },
        },
      },
    },
  })
  async testChannelIntegration(
    @Param("id") id: number,
  ): Promise<{ success: boolean; error?: string }> {
    const integration =
      await this.channelManagerService.getChannelIntegration(id);
    return await this.channelManagerService.testChannelIntegration(integration);
  }

  // Channel Information Endpoints
  @Get("channels/supported")
  @ApiOperation({
    summary: "List supported channels",
    description:
      "Returns all channel types supported by the channel manager integration layer.",
  })
  @ApiResponse({
    status: 200,
    description: "Supported channel types",
    schema: {
      type: "array",
      items: {
        type: "string",
        enum: Object.values(ChannelType),
      },
    },
    content: {
      "application/json": {
        schema: {
          type: "array",
          items: {
            type: "string",
            enum: Object.values(ChannelType),
          },
        },
        example: sampleChannelInfo.supportedChannels,
      },
    },
  })
  async getSupportedChannels(): Promise<ChannelType[]> {
    // This would come from the ChannelApiFactory
    return Object.values(ChannelType);
  }

  @Get("channels/:type/features")
  @ApiOperation({
    summary: "Get channel features",
    description:
      "Provides a feature matrix describing the capabilities supported by the specified channel integration.",
  })
  @ApiParam({
    name: "type",
    description: "Channel type identifier",
    enum: ChannelType,
    example: ChannelType.BOOKING_COM,
  })
  @ApiResponse({
    status: 200,
    description: "List of features supported by the channel",
    type: String,
    isArray: true,
    content: {
      "application/json": {
        schema: {
          type: "array",
          items: { type: "string" },
        },
        example: sampleChannelInfo.features[ChannelType.BOOKING_COM],
      },
    },
  })
  async getChannelFeatures(
    @Param("type") type: ChannelType,
  ): Promise<string[]> {
    try {
      return this.channelApiFactory.getChannelFeatures(type);
    } catch (error) {
      this.logger.error(
        `Failed to get features for channel ${type}: ${error.message}`,
      );
      return ["Basic integration support"];
    }
  }

  // Guest Integration Endpoints (instead of bookings)
  @Post("guests/:guestId/check-in")
  @ApiOperation({
    summary: "Tag guest as checked-in",
    description:
      "Marks a guest as checked-in and triggers downstream actions such as sync updates or notifications.",
  })
  @ApiParam({
    name: "guestId",
    description: "Guest identifier",
    example: 555,
  })
  @ApiResponse({
    status: 200,
    description: "Guest check-in processed",
  })
  async handleGuestCheckIn(@Param("guestId") guestId: number): Promise<void> {
    await this.channelManagerService.handleGuestCheckIn(guestId);
  }

  @Post("guests/:guestId/check-out")
  @ApiOperation({
    summary: "Tag guest as checked-out",
    description:
      "Marks a guest as checked-out for reporting purposes and potential channel updates.",
  })
  @ApiParam({
    name: "guestId",
    description: "Guest identifier",
    example: 555,
  })
  @ApiResponse({
    status: 200,
    description: "Guest check-out processed",
  })
  async handleGuestCheckOut(@Param("guestId") guestId: number): Promise<void> {
    await this.channelManagerService.handleGuestCheckOut(guestId);
  }

  @Post("guests/:guestId/no-show")
  @ApiOperation({
    summary: "Tag guest as no-show",
    description:
      "Marks a guest as no-show and triggers downstream actions such as sync updates or notifications.",
  })
  @ApiParam({
    name: "guestId",
    description: "Guest identifier",
    example: 555,
  })
  @ApiResponse({
    status: 200,
    description: "Guest no-show processed",
  })
  async handleGuestNoShow(@Param("guestId") guestId: number): Promise<void> {
    await this.channelManagerService.handleGuestNoShow(guestId);
  }

  @Post("bookings")
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create external booking (OTA/Partner)",
    description:
      "Allows external partners (like Wakanow) to create a reservation directly in the PMS.",
  })
  @ApiBody({ type: CreateExternalBookingDto })
  @ApiResponse({
    status: 201,
    description: "Booking created successfully",
  })
  async createExternalBooking(@Body() dto: CreateExternalBookingDto) {
    return this.channelManagerService.createExternalBooking(dto);
  }

  // Inbound Webhook Endpoint for OTA bookings and updates
  @Post("webhooks/:type")
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: "Handle inbound channel webhook",
    description:
      "Receives reservation, modification, or cancellation payloads from OTAs or channel providers and queues them for processing.",
  })
  @ApiParam({
    name: "type",
    description: "Channel type (e.g., booking, expedia, seven)",
    enum: ChannelType,
  })
  @ApiConsumes("application/json")
  @ApiExtraModels(
    WebhookPayloadDto,
    SevenWebhookPayloadDto,
    WakanowWebhookPayloadDto,
  )
  @ApiBody({
    description:
      "Inbound webhook payload. Must include hotelId to resolve integration. For 7even, use SevenWebhookPayloadDto structure.",
    schema: {
      oneOf: [
        { $ref: getSchemaPath(SevenWebhookPayloadDto) },
        { $ref: getSchemaPath(WakanowWebhookPayloadDto) },
        { $ref: getSchemaPath(WebhookPayloadDto) },
      ],
    },
    examples: {
      seven_reservation: {
        summary: "7even reservation webhook",
        value: sampleWebhooks.sevenReservation,
      },
      wakanow_reservation: {
        summary: "Wakanow booking confirmation",
        value: {
          hotelId: 1,
          event_type: "BOOKING_CONFIRMATION",
          timestamp: "2024-05-20T10:30:00Z",
          data: {
            booking_reference: "WKN-987654321",
            property_id: "H1W123",
            room_type_id: "WKN_DLX",
            check_in_date: "2024-06-01",
            check_out_date: "2024-06-05",
            quantity: 1,
            total_amount: 150000,
            currency: "NGN",
            guest: {
              first_name: "Chinedu",
              last_name: "Okafor",
              email: "chinedu@example.com",
              phone: "+2348012345678",
            },
            status: "CONFIRMED",
          },
        },
      },
      seven_cancellation: {
        summary: "7even cancellation webhook",
        value: sampleWebhooks.sevenCancellation,
      },
      seven_modification: {
        summary: "7even modification webhook",
        value: sampleWebhooks.sevenModification,
      },
      corniche_reservation: {
        summary: "Corniche reservation webhook",
        value: sampleWebhooks.cornicheReservation,
      },
      corniche_cancellation: {
        summary: "Corniche cancellation webhook",
        value: {
          hotelId: 1,
          event_type: "cancellation",
          data: {
            room_type_id: "14",
            check_in: "2025-10-12",
            check_out: "2025-10-15",
            rooms: 1,
            guest: {
              name: "John Doe",
              email: "john.doe@example.com",
            },
          },
        },
      },
      corniche_modification: {
        summary: "Corniche modification webhook",
        value: {
          hotelId: 1,
          event_type: "modification",
          data: {
            room_type_id: "14",
            check_in: "2025-10-12",
            check_out: "2025-10-16",
            rooms: 2,
            guest: {
              name: "John Doe",
              email: "john.doe@example.com",
            },
          },
        },
      },
      booking_com: {
        summary: "Booking.com webhook",
        value: sampleWebhooks.bookingComWebhook,
      },
    },
  })
  @ApiResponse({ status: 202, description: "Webhook accepted for processing" })
  async handleChannelWebhook(
    @Param("type") type: ChannelType,
    @Body() body: WebhookPayloadDto,
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
      body,
    );

    this.logger.log(`[Webhook] Accepted type=${type} hotelId=${hotelId}`);
    return { status: "accepted", message: "Webhook processed successfully" };
  }

  // Dashboard and Analytics Endpoints
  @Get("dashboard/summary")
  @ApiOperation({
    summary: "Get dashboard summary",
    description:
      "Returns aggregated information about a hotel's integrations, including counts by status and recent sync details.",
  })
  @ApiQuery({
    name: "hotelId",
    type: Number,
    description: "Hotel identifier",
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "Dashboard summary metrics",
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            totalIntegrations: { type: "number" },
            activeIntegrations: { type: "number" },
            pendingIntegrations: { type: "number" },
            errorIntegrations: { type: "number" },
            channels: { type: "array" },
          },
        },
        example: createSwaggerExample(sampleDashboard.summary),
      },
    },
  })
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

  // Hotel Webhook Configuration
  @Get("hotels/:hotelId/webhook-config")
  @ApiOperation({
    summary: "Get hotel webhook configuration",
    description: "Returns the global webhook settings for a specific hotel.",
  })
  @ApiParam({ name: "hotelId", type: Number })
  async getHotelWebhook(@Param("hotelId") hotelId: number) {
    return await this.channelManagerService.getHotelWebhook(hotelId);
  }

  @Post("hotels/:hotelId/webhook-config")
  @ApiOperation({
    summary: "Update hotel webhook configuration",
    description:
      "Updates or creates the global webhook settings for a specific hotel.",
  })
  @ApiParam({ name: "hotelId", type: Number })
  async updateHotelWebhook(
    @Param("hotelId") hotelId: number,
    @Body() updates: any,
  ) {
    return await this.channelManagerService.updateHotelWebhook(
      hotelId,
      updates,
    );
  }

  @Post("hotels/:hotelId/webhook-test")
  @ApiOperation({
    summary: "Trigger test webhook",
    description:
      "Sends a test notification to the configured hotel webhook URL to verify the connection.",
  })
  @ApiParam({ name: "hotelId", type: Number })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        eventType: {
          type: "string",
          enum: Object.values(WebhookEventType),
          example: "BOOKING_NEW",
        },
      },
    },
  })
  async triggerWebhookTest(
    @Param("hotelId") hotelId: number,
    @Body("eventType") eventType: WebhookEventType = WebhookEventType.TEST,
  ) {
    return await this.channelManagerService.triggerWebhookTest(
      hotelId,
      eventType,
    );
  }

  @Get("dashboard/performance")
  @ApiOperation({
    summary: "Get performance metrics",
    description:
      "Returns KPI metrics for each integration over a specified lookback window, including sync performance and booking stats.",
  })
  @ApiQuery({
    name: "hotelId",
    type: Number,
    description: "Hotel identifier",
    example: 1,
  })
  @ApiQuery({
    name: "days",
    required: false,
    type: Number,
    description: "Lookback window in days (defaults to 30)",
    example: 60,
  })
  @ApiResponse({
    status: 200,
    description: "Performance metrics per integration",
    content: {
      "application/json": {
        schema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              integrationId: { type: "number" },
              channelName: { type: "string" },
              channelType: { type: "string" },
              totalSyncs: { type: "number" },
              successRate: { type: "number" },
            },
          },
        },
        example: createSwaggerExample(sampleDashboard.performance),
      },
    },
  })
  async getPerformanceMetrics(
    @Query("hotelId") hotelId: number,
    @Query("days") days: number = 30,
  ): Promise<any> {
    const integrations =
      await this.channelManagerService.getChannelIntegrations(hotelId);

    const performanceData = await Promise.all(
      integrations.map(async (integration) => {
        const stats = await this.channelManagerService.getSyncStatistics(
          integration.id,
          days,
        );
        return {
          integrationId: integration.id,
          channelName: integration.channelName,
          channelType: integration.channelType,
          ...stats,
        };
      }),
    );

    return performanceData;
  }
}
