import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Request, Response } from "express";
import { ApiKeyGuard } from "../auth/api-key.guard";
import { IcalService } from "./ical.service";
import { IcalPollService } from "./ical-poll.service";

/**
 * Base URL for feed links. The app serves everything under the global
 * `api/v1` prefix (see src/main.ts), so feed URLs must include it —
 * otherwise the returned links 404. A configured ICAL_PUBLIC_BASE_URL
 * without the prefix gets it appended automatically.
 */
function apiBaseUrl(req: Request): string {
  const configured = (process.env.ICAL_PUBLIC_BASE_URL || "")
    .trim()
    .replace(/\/+$/, "");
  if (configured) {
    return configured.endsWith("/api/v1")
      ? configured
      : `${configured}/api/v1`;
  }
  return `${req.protocol}://${req.get("host")}/api/v1`;
}

@Controller("ical")
export class IcalController {
  constructor(
    private readonly icalService: IcalService,
    private readonly icalPollService: IcalPollService,
  ) {}

  /**
   * Public export feed — intentionally NOT behind ApiKeyGuard. The 64-hex-char
   * token in the URL is the credential (same model Airbnb/Booking.com use for
   * their own iCal URLs). Rotate the token if it ever leaks.
   */
  @Get(":token/calendar.ics")
  async exportCalendar(
    @Param("token") token: string,
    @Res() res: Response,
  ): Promise<void> {
    const { ics, roomNumber } = await this.icalService.generateCalendar(token);
    res.set({
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="anli-room-${roomNumber}.ics"`,
      "Cache-Control": "no-cache",
    });
    res.send(ics);
  }

  // ------------------------------------------------------------ feeds

  @UseGuards(ApiKeyGuard)
  @Post("feeds")
  async createFeed(
    @Req() req: Request,
    @Body()
    body: {
      hotelId: number;
      roomId: number;
      roomNumber?: string;
      label?: string;
    },
  ) {
    const feed = await this.icalService.createFeed(
      Number(body.hotelId),
      Number(body.roomId),
      body.roomNumber,
      body.label,
    );
    const base = apiBaseUrl(req);
    return {
      id: feed.id,
      token: feed.token,
      url: `${base}/ical/${feed.token}/calendar.ics`,
      roomNumber: feed.roomNumber,
      label: feed.label,
    };
  }

  @UseGuards(ApiKeyGuard)
  @Get("feeds")
  async listFeeds(@Query("hotelId") hotelId?: string) {
    const feeds = await this.icalService.listFeeds(
      hotelId ? Number(hotelId) : undefined,
    );
    return feeds.map((feed) => ({
      id: feed.id,
      hotelId: feed.hotelId,
      roomId: feed.roomId,
      roomNumber: feed.roomNumber,
      label: feed.label,
      isActive: feed.isActive,
      createdAt: feed.createdAt,
      // Token/URL intentionally omitted from the list response; the create
      // and rotate responses return them once.
    }));
  }

  @UseGuards(ApiKeyGuard)
  @Post("feeds/:id/rotate")
  async rotateFeed(@Req() req: Request, @Param("id", ParseIntPipe) id: number) {
    const feed = await this.icalService.rotateFeed(id);
    const base = apiBaseUrl(req);
    return {
      id: feed.id,
      token: feed.token,
      url: `${base}/ical/${feed.token}/calendar.ics`,
    };
  }

  @UseGuards(ApiKeyGuard)
  @Delete("feeds/:id")
  async deleteFeed(@Param("id", ParseIntPipe) id: number) {
    await this.icalService.deleteFeed(id);
    return { deleted: true };
  }

  /**
   * Creates one feed per room in a single call. Rooms that already have an
   * active feed are skipped and reported in `skippedRoomIds`.
   */
  @UseGuards(ApiKeyGuard)
  @Post("feeds/bulk")
  async createBulkFeeds(
    @Req() req: Request,
    @Body()
    body: {
      hotelId: number;
      rooms: Array<{ roomId: number; roomNumber: string }>;
    },
  ) {
    const hotelId = Number(body.hotelId);
    if (!Number.isInteger(hotelId)) {
      throw new BadRequestException("hotelId must be an integer");
    }
    const rooms = Array.isArray(body.rooms) ? body.rooms : [];
    if (rooms.length === 0) {
      throw new BadRequestException("rooms must be a non-empty array");
    }
    if (rooms.length > 500) {
      throw new BadRequestException("rooms is capped at 500 per request");
    }
    const normalized = rooms.map((r) => {
      const roomId = Number(r?.roomId);
      const roomNumber = String(r?.roomNumber ?? "").trim();
      if (!Number.isInteger(roomId) || !roomNumber) {
        throw new BadRequestException(
          "each room needs roomId (int) and roomNumber",
        );
      }
      return { roomId, roomNumber };
    });
    const { created, skippedRoomIds } =
      await this.icalService.createBulkFeeds(hotelId, normalized);
    const base = apiBaseUrl(req);
    return {
      created: created.map((feed) => ({
        id: feed.id,
        token: feed.token,
        url: `${base}/ical/${feed.token}/calendar.ics`,
        roomNumber: feed.roomNumber,
        label: feed.label,
      })),
      skippedRoomIds,
    };
  }

  /**
   * Idempotent whole-property feed (roomId null): one URL with every room's
   * busy nights, for calendar subscriptions / owner overviews. NOT for OTA
   * import — Airbnb/Booking.com need one URL per listing.
   */
  @UseGuards(ApiKeyGuard)
  @Post("feeds/property")
  async createPropertyFeed(
    @Req() req: Request,
    @Body() body: { hotelId: number; label?: string },
  ) {
    const hotelId = Number(body.hotelId);
    if (!Number.isInteger(hotelId)) {
      throw new BadRequestException("hotelId must be an integer");
    }
    const { feed, alreadyExisted } =
      await this.icalService.createPropertyFeed(hotelId, body.label);
    if (alreadyExisted) {
      // Never re-expose a token that wasn't just created.
      return { id: feed.id, alreadyExisted: true };
    }
    const base = apiBaseUrl(req);
    return {
      id: feed.id,
      token: feed.token,
      url: `${base}/ical/${feed.token}/calendar.ics`,
      alreadyExisted: false,
    };
  }

  // ------------------------------------------------------------ import sources

  @UseGuards(ApiKeyGuard)
  @Post("import-sources")
  async createImportSource(
    @Body()
    body: {
      hotelId: number;
      roomId: number;
      roomNumber?: string;
      sourceName: string;
      sourceUrl: string;
    },
  ) {
    return this.icalService.createImportSource(
      Number(body.hotelId),
      Number(body.roomId),
      body.sourceName,
      body.sourceUrl,
      body.roomNumber,
    );
  }

  @UseGuards(ApiKeyGuard)
  @Get("import-sources")
  async listImportSources(@Query("hotelId") hotelId?: string) {
    return this.icalService.listImportSources(
      hotelId ? Number(hotelId) : undefined,
    );
  }

  @UseGuards(ApiKeyGuard)
  @Post("import-sources/:id/sync")
  async syncImportSource(@Param("id", ParseIntPipe) id: number) {
    return this.icalPollService.pollSource(id);
  }

  @UseGuards(ApiKeyGuard)
  @Delete("import-sources/:id")
  async deleteImportSource(@Param("id", ParseIntPipe) id: number) {
    await this.icalService.deleteImportSource(id);
    return { deleted: true };
  }

  // ------------------------------------------------------------ external blocks

  @UseGuards(ApiKeyGuard)
  @Get("external-blocks")
  async listExternalBlocks(
    @Query("hotelId") hotelId?: string,
    @Query("roomId") roomId?: string,
  ) {
    return this.icalService.listExternalBlocks(
      hotelId ? Number(hotelId) : undefined,
      roomId ? Number(roomId) : undefined,
    );
  }
}
