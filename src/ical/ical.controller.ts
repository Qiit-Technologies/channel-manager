import {
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

function publicBaseUrl(req: Request): string {
  const configured = (process.env.ICAL_PUBLIC_BASE_URL || "").trim();
  if (configured) return configured.replace(/\/+$/, "");
  return `${req.protocol}://${req.get("host")}`;
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
    const base = publicBaseUrl(req);
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
    const base = publicBaseUrl(req);
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
