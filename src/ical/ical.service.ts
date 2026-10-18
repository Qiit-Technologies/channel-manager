import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomBytes } from "crypto";
import { In, IsNull, Repository } from "typeorm";
import { Guest } from "../entities/guest.entity";
import { IcalFeed } from "./entities/ical-feed.entity";
import { IcalImportSource } from "./entities/ical-import-source.entity";
import { IcalExternalBlock } from "./entities/ical-external-block.entity";

/** How far ahead the export feed looks (sanity cap). */
const EXPORT_WINDOW_DAYS = 730;

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

function icsDate(key: string): string {
  return key.replace(/-/g, ""); // YYYYMMDD
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

interface BusyRange {
  start: string; // YYYY-MM-DD inclusive
  end: string; // YYYY-MM-DD exclusive
  uid: string;
}

/** Merge overlapping or adjacent ranges so the feed stays tidy. */
function mergeRanges(ranges: BusyRange[]): BusyRange[] {
  const sorted = [...ranges].sort((a, b) =>
    a.start < b.start ? -1 : a.start > b.start ? 1 : 0,
  );
  const merged: BusyRange[] = [];
  for (const range of sorted) {
    const last = merged[merged.length - 1];
    if (last && range.start <= last.end) {
      if (range.end > last.end) last.end = range.end;
    } else {
      merged.push({ ...range });
    }
  }
  return merged;
}

@Injectable()
export class IcalService {
  private readonly logger = new Logger(IcalService.name);

  constructor(
    @InjectRepository(IcalFeed)
    private readonly feeds: Repository<IcalFeed>,
    @InjectRepository(IcalImportSource)
    private readonly importSources: Repository<IcalImportSource>,
    @InjectRepository(IcalExternalBlock)
    private readonly externalBlocks: Repository<IcalExternalBlock>,
    @InjectRepository(Guest)
    private readonly guests: Repository<Guest>,
  ) {}

  // ------------------------------------------------------------ feeds

  async createFeed(
    hotelId: number,
    roomId: number | null,
    roomNumber?: string | null,
    label?: string,
  ): Promise<IcalFeed> {
    const feed = this.feeds.create({
      hotelId,
      roomId,
      roomNumber: roomNumber || null,
      label: label || null,
      token: randomBytes(32).toString("hex"),
      isActive: true,
    });
    return this.feeds.save(feed);
  }

  /**
   * Creates one feed per room, skipping rooms that already have an active
   * feed. Returns the created feeds (with their one-time tokens) plus the
   * room ids that were skipped.
   */
  async createBulkFeeds(
    hotelId: number,
    rooms: Array<{ roomId: number; roomNumber: string }>,
  ): Promise<{ created: IcalFeed[]; skippedRoomIds: number[] }> {
    const roomIds = [...new Set(rooms.map((r) => r.roomId))];
    const existing =
      roomIds.length > 0
        ? await this.feeds.find({
            where: { hotelId, roomId: In(roomIds), isActive: true },
          })
        : [];
    const seen = new Set(existing.map((f) => f.roomId));
    const created: IcalFeed[] = [];
    const skippedRoomIds: number[] = [];
    for (const room of rooms) {
      if (seen.has(room.roomId)) {
        if (!skippedRoomIds.includes(room.roomId)) {
          skippedRoomIds.push(room.roomId);
        }
        continue;
      }
      seen.add(room.roomId);
      created.push(
        await this.createFeed(
          hotelId,
          room.roomId,
          room.roomNumber,
          `Room ${room.roomNumber} auto`,
        ),
      );
    }
    return { created, skippedRoomIds };
  }

  /**
   * Idempotent whole-property feed (`roomId` null). When one already exists
   * the existing feed is returned WITHOUT its token — the caller must not
   * re-expose a token it didn't just create.
   */
  async createPropertyFeed(
    hotelId: number,
    label?: string,
  ): Promise<{ feed: IcalFeed; alreadyExisted: boolean }> {
    const existing = await this.feeds.findOne({
      where: { hotelId, roomId: IsNull(), isActive: true },
    });
    if (existing) return { feed: existing, alreadyExisted: true };
    const feed = await this.createFeed(
      hotelId,
      null,
      null,
      label || "Property feed",
    );
    return { feed, alreadyExisted: false };
  }

  async listFeeds(hotelId?: number): Promise<IcalFeed[]> {
    return this.feeds.find({
      where: hotelId ? { hotelId } : {},
      order: { createdAt: "DESC" },
    });
  }

  async rotateFeed(id: number): Promise<IcalFeed> {
    const feed = await this.feeds.findOne({ where: { id } });
    if (!feed) throw new NotFoundException("iCal feed not found");
    feed.token = randomBytes(32).toString("hex");
    return this.feeds.save(feed);
  }

  async deleteFeed(id: number): Promise<void> {
    await this.feeds.delete(id);
  }

  // ------------------------------------------------------------ export

  /**
   * Builds the RFC 5545 calendar for one feed token. Includes live PMS stays
   * AND external (OTA-imported) blocks so the feed never fights the channel.
   * No guest PII is emitted — every event is a generic busy block (per-room
   * feeds) or `Busy - Room <number>` (property feeds; room numbers are not
   * PII). Ranges are merged per room, never across rooms.
   */
  async generateCalendar(
    token: string,
  ): Promise<{ ics: string; roomNumber: string }> {
    const feed = await this.feeds.findOne({
      where: { token, isActive: true },
    });
    if (!feed) throw new NotFoundException("iCal feed not found");

    const isPropertyFeed = feed.roomId === null || feed.roomId === undefined;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayKey = dateKey(today);
    const horizon = new Date(today.getTime() + EXPORT_WINDOW_DAYS * 86400000);
    const horizonKey = dateKey(horizon);

    // Live PMS stays (shared guest table).
    const staysQb = this.guests
      .createQueryBuilder("g")
      .select(["g.id", "g.startDate", "g.endDate", "g.roomId", "g.roomNumber"])
      .where("g.hotelId = :hotelId", { hotelId: feed.hotelId })
      .andWhere("g.isVoid != :voided", { voided: true })
      .andWhere("g.isCheckedOut = :checkedOut", { checkedOut: false })
      .andWhere("g.startDate IS NOT NULL")
      .andWhere("g.endDate IS NOT NULL")
      .andWhere("g.endDate > :today", { today: todayKey })
      .andWhere("g.startDate < :horizon", { horizon: horizonKey })
      .orderBy("g.startDate", "ASC");
    if (!isPropertyFeed) {
      staysQb.andWhere("g.roomId = :roomId", { roomId: feed.roomId });
    }
    const stays = await staysQb.getMany();

    // Group busy ranges per room so property feeds never merge across rooms.
    const byRoom = new Map<string, { label: string; ranges: BusyRange[] }>();
    const pushRange = (
      roomId: number | null,
      roomNumber: string | null | undefined,
      range: BusyRange,
    ) => {
      const key = isPropertyFeed ? `room:${roomId}` : "single";
      const label =
        roomNumber && roomNumber.trim()
          ? roomNumber.trim()
          : `Room ${roomId}`;
      let entry = byRoom.get(key);
      if (!entry) {
        entry = { label, ranges: [] };
        byRoom.set(key, entry);
      }
      entry.ranges.push(range);
    };

    for (const stay of stays) {
      const start = dateKey(new Date(stay.startDate));
      const end = dateKey(new Date(stay.endDate));
      pushRange(stay.roomId ?? null, stay.roomNumber ?? null, {
        start: start < todayKey ? todayKey : start,
        end: end > horizonKey ? horizonKey : end,
        uid: `anli-guest-${stay.id}@anli-channel-manager`,
      });
    }

    // External blocks (from OTA imports).
    const blocksQb = this.externalBlocks
      .createQueryBuilder("b")
      .where("b.hotelId = :hotelId", { hotelId: feed.hotelId })
      .andWhere("b.endDate > :today", { today: todayKey })
      .orderBy("b.startDate", "ASC");
    if (!isPropertyFeed) {
      blocksQb.andWhere("b.roomId = :roomId", { roomId: feed.roomId });
    }
    const roomBlocks = await blocksQb.getMany();
    for (const block of roomBlocks) {
      pushRange(block.roomId ?? null, null, {
        start: dateKey(new Date(block.startDate)),
        end: dateKey(new Date(block.endDate)),
        uid: `anli-ext-${block.id}@anli-channel-manager`,
      });
    }

    const dtstamp =
      new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const calName = isPropertyFeed
      ? "Anli - All rooms"
      : `Anli - Room ${feed.roomNumber || feed.roomId}`;
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Anli//Channel Manager//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:${escapeIcsText(calName)}`,
    ];
    for (const { label, ranges } of byRoom.values()) {
      const merged = mergeRanges(
        ranges.filter((r) => r.end > r.start && r.end > todayKey),
      );
      for (const range of merged) {
        const summary = isPropertyFeed ? `Busy - Room ${label}` : "Busy - Anli";
        lines.push(
          "BEGIN:VEVENT",
          `UID:${range.uid}`,
          `DTSTAMP:${dtstamp}`,
          `DTSTART;VALUE=DATE:${icsDate(range.start)}`,
          `DTEND;VALUE=DATE:${icsDate(range.end)}`,
          `SUMMARY:${escapeIcsText(summary)}`,
          "STATUS:CONFIRMED",
          "TRANSP:OPAQUE",
          "END:VEVENT",
        );
      }
    }
    lines.push("END:VCALENDAR");
    return {
      ics: lines.join("\r\n") + "\r\n",
      roomNumber: isPropertyFeed
        ? "property"
        : feed.roomNumber || String(feed.roomId),
    };
  }

  // ------------------------------------------------------------ import sources

  async createImportSource(
    hotelId: number,
    roomId: number,
    sourceName: string,
    sourceUrl: string,
    roomNumber?: string,
  ): Promise<IcalImportSource> {
    let parsed: URL;
    try {
      parsed = new URL(sourceUrl);
    } catch {
      throw new BadRequestException("sourceUrl must be a valid URL");
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new BadRequestException("sourceUrl must use http or https");
    }
    const source = this.importSources.create({
      hotelId,
      roomId,
      roomNumber: roomNumber || null,
      sourceName,
      sourceUrl,
      isActive: true,
    });
    return this.importSources.save(source);
  }

  async listImportSources(hotelId?: number): Promise<IcalImportSource[]> {
    return this.importSources.find({
      where: hotelId ? { hotelId } : {},
      order: { createdAt: "DESC" },
    });
  }

  async deleteImportSource(id: number): Promise<void> {
    await this.externalBlocks.delete({ importSourceId: id });
    await this.importSources.delete(id);
  }

  async listExternalBlocks(
    hotelId?: number,
    roomId?: number,
  ): Promise<IcalExternalBlock[]> {
    const where: Record<string, number> = {};
    if (hotelId) where.hotelId = hotelId;
    if (roomId) where.roomId = roomId;
    return this.externalBlocks.find({
      where,
      order: { startDate: "ASC" },
    });
  }
}
