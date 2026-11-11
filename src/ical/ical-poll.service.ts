import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { HttpService } from "@nestjs/axios";
import { Cron, CronExpression } from "@nestjs/schedule";
import { firstValueFrom } from "rxjs";
import * as ical from "node-ical";
import { Repository } from "typeorm";
import { IcalImportSource } from "./entities/ical-import-source.entity";
import { IcalExternalBlock } from "./entities/ical-external-block.entity";

/** Cap how far ahead imported blocks are stored. */
const IMPORT_WINDOW_DAYS = 730;

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

function todayKey(): string {
  return dateKey(new Date());
}

interface ParsedBlock {
  start: string; // YYYY-MM-DD inclusive
  end: string; // YYYY-MM-DD exclusive
  uid: string;
}

/**
 * Extracts busy date ranges from a parsed iCal feed.
 *
 * Most OTA exports (Airbnb, Booking.com) use VALUE=DATE all-day events,
 * which node-ical parses as UTC-midnight Dates — toISOString() then yields
 * the correct calendar date. DATE-TIME events are reduced to their calendar
 * dates the same way. Recurring events (RRULE) are not expanded; OTA
 * exports are normally flattened, so this is a documented limitation.
 */
function parseBlocks(icsText: string): ParsedBlock[] {
  const parsed = ical.parseICS(icsText);
  const horizon = new Date();
  horizon.setUTCDate(horizon.getUTCDate() + IMPORT_WINDOW_DAYS);
  const horizonKey = dateKey(horizon);
  const today = todayKey();
  const blocks: ParsedBlock[] = [];

  for (const key of Object.keys(parsed)) {
    const component = (parsed as Record<string, any>)[key];
    if (!component || component.type !== "VEVENT") continue;
    const start = component.start as Date | undefined;
    const end = component.end as Date | undefined;
    if (!(start instanceof Date) || isNaN(start.getTime())) continue;
    const startKey = dateKey(start);
    const endKey =
      end instanceof Date && !isNaN(end.getTime())
        ? dateKey(end)
        : startKey;
    // End-exclusive hotel semantics: a 1-night stay Nov 5 -> Nov 6 blocks Nov 5.
    const normalizedEnd = endKey > startKey ? endKey : startKey;
    if (normalizedEnd <= today) continue; // past
    if (startKey >= horizonKey) continue; // too far out
    blocks.push({
      start: startKey,
      end: normalizedEnd > horizonKey ? horizonKey : normalizedEnd,
      uid: String(component.uid || key),
    });
  }
  return blocks;
}

@Injectable()
export class IcalPollService {
  private readonly logger = new Logger(IcalPollService.name);

  constructor(
    @InjectRepository(IcalImportSource)
    private readonly importSources: Repository<IcalImportSource>,
    @InjectRepository(IcalExternalBlock)
    private readonly externalBlocks: Repository<IcalExternalBlock>,
    private readonly http: HttpService,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleScheduledPoll(): Promise<void> {
    const sources = await this.importSources.find({
      where: { isActive: true },
    });
    if (!sources.length) return;
    this.logger.log(`Polling ${sources.length} iCal import source(s)`);
    for (const source of sources) {
      try {
        const result = await this.pollSource(source.id);
        this.logger.log(
          `iCal import source ${source.id} (${source.sourceName}): ${result.blocks} block(s)`,
        );
      } catch (error: any) {
        // One bad source must never fail the whole cron run.
        this.logger.error(
          `iCal import source ${source.id} failed: ${error.message}`,
        );
      }
    }
  }

  /**
   * Fetches one source, parses its events, and replaces that source's
   * external blocks (idempotent full refresh). Returns the block count.
   */
  async pollSource(sourceId: number): Promise<{ blocks: number }> {
    const source = await this.importSources.findOne({
      where: { id: sourceId },
    });
    if (!source) throw new NotFoundException("iCal import source not found");

    const headers: Record<string, string> = {
      Accept: "text/calendar, text/plain, */*",
    };
    if (source.lastEtag) headers["If-None-Match"] = source.lastEtag;
    if (source.lastModified) headers["If-Modified-Since"] = source.lastModified;

    let response;
    try {
      response = await firstValueFrom(
        this.http.get(source.sourceUrl, {
          headers,
          timeout: 30000,
          responseType: "text",
          // 304 is a normal "not modified" answer, not an error.
          validateStatus: (status: number) => status < 500,
        }),
      );
    } catch (error: any) {
      source.lastError = `Fetch failed: ${error.message}`;
      source.lastFetchedAt = new Date();
      await this.importSources.save(source);
      throw error;
    }

    if (response.status === 304) {
      source.lastFetchedAt = new Date();
      source.lastError = null;
      await this.importSources.save(source);
      const count = await this.externalBlocks.count({
        where: { importSourceId: source.id },
      });
      return { blocks: count };
    }

    if (response.status >= 400) {
      source.lastError = `HTTP ${response.status} fetching ${source.sourceUrl}`;
      source.lastFetchedAt = new Date();
      await this.importSources.save(source);
      throw new Error(source.lastError);
    }

    let parsed: ParsedBlock[];
    try {
      parsed = parseBlocks(String(response.data));
    } catch (error: any) {
      source.lastError = `Parse failed: ${error.message}`;
      source.lastFetchedAt = new Date();
      await this.importSources.save(source);
      throw error;
    }

    // Idempotent full refresh for this source.
    await this.externalBlocks.delete({ importSourceId: source.id });
    if (parsed.length) {
      const rows = parsed.map((block) =>
        this.externalBlocks.create({
          hotelId: source.hotelId,
          roomId: source.roomId,
          importSourceId: source.id,
          startDate: block.start as any,
          endDate: block.end as any,
          sourceName: source.sourceName,
          externalUid: block.uid,
        }),
      );
      await this.externalBlocks.save(rows);
    }

    const etag = response.headers?.["etag"];
    const lastModified = response.headers?.["last-modified"];
    source.lastFetchedAt = new Date();
    if (etag) source.lastEtag = String(etag);
    if (lastModified) source.lastModified = String(lastModified);
    source.lastError = null;
    await this.importSources.save(source);

    return { blocks: parsed.length };
  }
}
