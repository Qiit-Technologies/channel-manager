import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

@Injectable()
export class PmsReservationClient {
  private readonly logger = new Logger(PmsReservationClient.name);

  constructor(private readonly http: HttpService) {}

  private get baseUrl(): string | undefined {
    return process.env.PMS_RESERVATION_CREATE_URL;
  }

  private get apiKey(): string | undefined {
    return process.env.PMS_API_KEY;
  }

  private buildUrl(): string | null {
    const base = this.baseUrl;
    if (!base) return null;
    return base;
  }

  async createGuestReservation(
    hotelId: number,
    oreonGuestDto: any,
  ): Promise<{
    success: boolean;
    status?: number;
    data?: any;
    error?: string;
  }> {
    try {
      const enabled =
        (process.env.PMS_RESERVATION_FORWARD || "false").toLowerCase() ===
        "true";
      this.logger.log(
        `[PMS Forward] enabled=${enabled} baseUrl=${this.baseUrl ?? "unset"} apiKeySet=${Boolean(this.apiKey)}`,
      );
      if (!enabled) {
        this.logger.log("[PMS Forward] Disabled by config");
        return { success: false, error: "forwarding_disabled" };
      }

      const url = this.buildUrl();
      if (!url) {
        this.logger.warn(
          "[PMS Forward] PMS_RESERVATION_CREATE_URL not configured; skipping",
        );
        return { success: false, error: "missing_url" };
      }
      this.logger.log(`[PMS Forward] builtUrl=${url}`);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (this.apiKey) {
        headers["x-api-key"] = this.apiKey;
      }

      // Log a compact summary of the payload
      try {
        const summary = {
          fullName: oreonGuestDto?.fullName,
          email: oreonGuestDto?.email,
          roomTypeId: oreonGuestDto?.roomTypeId,
          checkInDate: oreonGuestDto?.checkInDate,
          checkOutDate: oreonGuestDto?.checkOutDate,
          amount: oreonGuestDto?.amount,
          amountPaid: oreonGuestDto?.amountPaid,
          propertyReference: oreonGuestDto?.propertyReference,
        };
        this.logger.log(
          `[PMS Forward] payload summary: ${JSON.stringify(summary)}`,
        );
      } catch {}

      const resp = await firstValueFrom(
        this.http.post(url, oreonGuestDto, { headers }),
      );
      this.logger.log(`PMS reservation created: status=${resp.status}`);
      return {
        success: resp.status < 300,
        status: resp.status,
        data: resp.data,
      };
    } catch (error: any) {
      const status = error?.response?.status;
      const data = error?.response?.data;
      const dataPreview = data ? JSON.stringify(data).slice(0, 500) : undefined;
      this.logger.error(
        `[PMS Forward] Failed: status=${status ?? "n/a"} message=${error?.message || error} data=${dataPreview || "n/a"}`,
      );
      return {
        success: false,
        status,
        data,
        error: error?.message || String(error),
      };
    }
  }
}
