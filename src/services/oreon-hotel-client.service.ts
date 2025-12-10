import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { CreateHotelDto } from "../dto/create-hotel.dto";
import { CreateRoomTypeDto } from "../dto/create-roomtype.dto";
import { CreateRoomDto } from "../dto/create-room.dto";

@Injectable()
export class OreonHotelClient {
  private readonly logger = new Logger(OreonHotelClient.name);

  constructor(private readonly http: HttpService) {}

  private get baseUrl(): string {
    return process.env.OREON_API_URL || "http://localhost:3000";
  }

  private get apiKey(): string | undefined {
    return process.env.CM_FORWARD_API_KEY;
  }

  /**
   * Create hotel in Oreon PMS via API
   * This calls the Oreon public endpoint to create hotels
   */
  async createHotel(
    hotelData: CreateHotelDto
  ): Promise<{ id: number; name: string; email?: string }> {
    try {
      const url = `${this.baseUrl}/public/channel-manager/hotels`;
      const apiKey = this.apiKey;

      this.logger.log(
        `[Oreon Hotel] URL: ${url}, API Key configured: ${apiKey ? "Yes" : "No"}`
      );
      if (!apiKey) {
        this.logger.error(
          "[Oreon Hotel] CM_FORWARD_API_KEY not configured in channel manager. Please set CM_FORWARD_API_KEY environment variable to match Oreon's CM_FORWARD_API_KEY"
        );
        throw new HttpException(
          "CM_FORWARD_API_KEY not configured in channel manager. Please set the environment variable.",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      };

      // Map channel manager DTO to Oreon DTO format
      const oreonPayload = {
        name: hotelData.name,
        email: hotelData.email,
        address: hotelData.address,
        country: hotelData.country,
        state: hotelData.state,
        registrationSource: hotelData.registrationSource || "CHANNEL_MANAGER",
      };

      this.logger.log(
        `[Oreon Hotel] Creating hotel in Oreon: ${hotelData.name}`
      );

      const response = await firstValueFrom(
        this.http.post(url, oreonPayload, { headers })
      );
      if (response.status === 201 || response.status === 200) {
        this.logger.log(
          `[Oreon Hotel] Hotel created successfully: id=${response.data.id} name=${response.data.name}`
        );
        return response.data;
      } else {
        throw new HttpException(
          `Failed to create hotel in Oreon: ${response.statusText}`,
          HttpStatus.BAD_REQUEST
        );
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const data = error?.response?.data;
      const errorMessage = data?.message || error?.message || "Unknown error";

      this.logger.error(
        `[Oreon Hotel] Failed to create hotel: status=${status ?? "n/a"} message=${errorMessage}`
      );

      if (status === 400) {
        throw new HttpException(
          `Hotel creation failed: ${errorMessage}`,
          HttpStatus.BAD_REQUEST
        );
      } else if (status === 401) {
        throw new HttpException(
          "Invalid API key for Oreon hotel creation",
          HttpStatus.UNAUTHORIZED
        );
      } else {
        throw new HttpException(
          `Failed to create hotel in Oreon: ${errorMessage}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }

  /**
   * Get hotels by registration source from Oreon PMS via API
   * Excludes DIRECT registrations
   */
  async getHotelsByRegistrationSource(
    registrationSource?: string
  ): Promise<{ count: number; hotels: any[] }> {
    try {
      let url = `${this.baseUrl}/public/channel-manager/hotels`;
      if (registrationSource) {
        url += `?registrationSource=${encodeURIComponent(registrationSource)}`;
      }

      const apiKey = this.apiKey;

      if (!apiKey) {
        this.logger.error(
          "[Oreon Hotel] CM_FORWARD_API_KEY not configured in channel manager. Please set CM_FORWARD_API_KEY environment variable to match Oreon's CM_FORWARD_API_KEY"
        );
        throw new HttpException(
          "CM_FORWARD_API_KEY not configured in channel manager. Please set the environment variable.",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      };

      this.logger.log(
        `[Oreon Hotel] Fetching hotels${registrationSource ? ` with source=${registrationSource}` : " (all non-DIRECT)"} from Oreon`
      );

      const response = await firstValueFrom(this.http.get(url, { headers }));

      if (response.status === 200) {
        this.logger.log(
          `[Oreon Hotel] Successfully fetched ${response.data.count} hotels`
        );
        return response.data;
      } else {
        throw new HttpException(
          `Failed to fetch hotels from Oreon: ${response.statusText}`,
          HttpStatus.BAD_REQUEST
        );
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const data = error?.response?.data;
      const errorMessage = data?.message || error?.message || "Unknown error";

      this.logger.error(
        `[Oreon Hotel] Failed to fetch hotels: status=${status ?? "n/a"} message=${errorMessage}`
      );

      if (status === 400) {
        throw new HttpException(
          `Failed to fetch hotels: ${errorMessage}`,
          HttpStatus.BAD_REQUEST
        );
      } else if (status === 401) {
        throw new HttpException(
          "Invalid API key for Oreon hotel fetch",
          HttpStatus.UNAUTHORIZED
        );
      } else {
        throw new HttpException(
          `Failed to fetch hotels from Oreon: ${errorMessage}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }

  /**
   * Create room type in Oreon PMS via API
   */
  async createRoomType(roomTypeData: CreateRoomTypeDto): Promise<{
    id: number;
    name: string;
    description: string;
    hotelId: number;
  }> {
    try {
      const url = `${this.baseUrl}/public/channel-manager/roomtypes`;
      const apiKey = this.apiKey;

      if (!apiKey) {
        this.logger.error(
          "[Oreon RoomType] CM_FORWARD_API_KEY not configured in channel manager."
        );
        throw new HttpException(
          "CM_FORWARD_API_KEY not configured in channel manager.",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      };

      this.logger.log(
        `[Oreon RoomType] Creating room type in Oreon: ${roomTypeData.name} for hotel ${roomTypeData.hotelId}`
      );

      const response = await firstValueFrom(
        this.http.post(url, roomTypeData, { headers })
      );

      if (response.status === 201 || response.status === 200) {
        this.logger.log(
          `[Oreon RoomType] Room type created successfully: id=${response.data.id} name=${response.data.name}`
        );
        return response.data;
      } else {
        throw new HttpException(
          `Failed to create room type in Oreon: ${response.statusText}`,
          HttpStatus.BAD_REQUEST
        );
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const data = error?.response?.data;
      const errorMessage = data?.message || error?.message || "Unknown error";

      this.logger.error(
        `[Oreon RoomType] Failed to create room type: status=${status ?? "n/a"} message=${errorMessage}`
      );

      if (status === 400) {
        throw new HttpException(
          `Room type creation failed: ${errorMessage}`,
          HttpStatus.BAD_REQUEST
        );
      } else if (status === 401) {
        throw new HttpException(
          "Invalid API key for Oreon room type creation",
          HttpStatus.UNAUTHORIZED
        );
      } else {
        throw new HttpException(
          `Failed to create room type in Oreon: ${errorMessage}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }

  /**
   * Create room in Oreon PMS via API
   */
  async createRoom(roomData: CreateRoomDto): Promise<{
    id: number;
    roomNumber: string;
    roomtype: number;
    status: string;
    price: number;
    floor?: number;
    roomCapacity: number;
    hotelId: number;
  }> {
    try {
      const url = `${this.baseUrl}/public/channel-manager/rooms`;
      const apiKey = this.apiKey;

      if (!apiKey) {
        this.logger.error(
          "[Oreon Room] CM_FORWARD_API_KEY not configured in channel manager."
        );
        throw new HttpException(
          "CM_FORWARD_API_KEY not configured in channel manager.",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      };

      this.logger.log(
        `[Oreon Room] Creating room in Oreon: ${roomData.roomNumber} for hotel ${roomData.hotelId}`
      );

      const response = await firstValueFrom(
        this.http.post(url, roomData, { headers })
      );

      if (response.status === 201 || response.status === 200) {
        this.logger.log(
          `[Oreon Room] Room created successfully: id=${response.data.id} number=${response.data.roomNumber}`
        );
        return response.data;
      } else {
        throw new HttpException(
          `Failed to create room in Oreon: ${response.statusText}`,
          HttpStatus.BAD_REQUEST
        );
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const data = error?.response?.data;
      const errorMessage = data?.message || error?.message || "Unknown error";

      this.logger.error(
        `[Oreon Room] Failed to create room: status=${status ?? "n/a"} message=${errorMessage}`
      );

      if (status === 400) {
        throw new HttpException(
          `Room creation failed: ${errorMessage}`,
          HttpStatus.BAD_REQUEST
        );
      } else if (status === 401) {
        throw new HttpException(
          "Invalid API key for Oreon room creation",
          HttpStatus.UNAUTHORIZED
        );
      } else {
        throw new HttpException(
          `Failed to create room in Oreon: ${errorMessage}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }

  /**
   * Get hotel room types with rooms from Oreon PMS via API
   */
  async getHotelRoomTypes(hotelId: number): Promise<{
    hotelId: number;
    count: number;
    roomTypes: Array<{
      id: number;
      name: string;
      description: string;
      createdAt: Date;
      rooms: Array<{
        id: number;
        roomNumber: string;
        status: string;
        price: number;
        floor?: number;
        roomCapacity: number;
      }>;
    }>;
  }> {
    try {
      const url = `${this.baseUrl}/public/channel-manager/hotels/${hotelId}/roomtypes`;
      const apiKey = this.apiKey;

      if (!apiKey) {
        this.logger.error(
          "[Oreon RoomTypes] CM_FORWARD_API_KEY not configured in channel manager."
        );
        throw new HttpException(
          "CM_FORWARD_API_KEY not configured in channel manager.",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      };

      this.logger.log(
        `[Oreon RoomTypes] Fetching room types for hotel ${hotelId} from Oreon`
      );

      const response = await firstValueFrom(this.http.get(url, { headers }));

      if (response.status === 200) {
        this.logger.log(
          `[Oreon RoomTypes] Successfully fetched ${response.data.count} room types`
        );
        return response.data;
      } else {
        throw new HttpException(
          `Failed to fetch room types from Oreon: ${response.statusText}`,
          HttpStatus.BAD_REQUEST
        );
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const data = error?.response?.data;
      const errorMessage = data?.message || error?.message || "Unknown error";

      this.logger.error(
        `[Oreon RoomTypes] Failed to fetch room types: status=${status ?? "n/a"} message=${errorMessage}`
      );

      if (status === 400) {
        throw new HttpException(
          `Failed to fetch room types: ${errorMessage}`,
          HttpStatus.BAD_REQUEST
        );
      } else if (status === 401) {
        throw new HttpException(
          "Invalid API key for Oreon room types fetch",
          HttpStatus.UNAUTHORIZED
        );
      } else if (status === 404) {
        throw new HttpException(
          `Hotel not found: ${errorMessage}`,
          HttpStatus.NOT_FOUND
        );
      } else {
        throw new HttpException(
          `Failed to fetch room types from Oreon: ${errorMessage}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }
}
