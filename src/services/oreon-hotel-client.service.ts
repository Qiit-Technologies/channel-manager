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
   * Create hotel in Anli PMS via API
   * This calls the Anli public endpoint to create hotels
   */
  async createHotel(
    hotelData: CreateHotelDto,
  ): Promise<{ id: number; name: string; email?: string }> {
    try {
      const url = `${this.baseUrl}/public/channel-manager/hotels`;
      const apiKey = this.apiKey;

      this.logger.log(
        `[Anli Hotel] URL: ${url}, API Key configured: ${apiKey ? "Yes" : "No"}`,
      );
      if (!apiKey) {
        this.logger.error(
          "[Anli Hotel] CM_FORWARD_API_KEY not configured in channel manager. Please set CM_FORWARD_API_KEY environment variable to match Anli's CM_FORWARD_API_KEY",
        );
        throw new HttpException(
          "CM_FORWARD_API_KEY not configured in channel manager. Please set the environment variable.",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      };

      // Map channel manager DTO to Anli DTO format
      const AnliPayload = {
        name: hotelData.name,
        email: hotelData.email,
        address: hotelData.address,
        country: hotelData.country,
        state: hotelData.state,
        registrationSource: hotelData.registrationSource || "CHANNEL_MANAGER",
      };

      this.logger.log(`[Anli Hotel] Creating hotel in Anli: ${hotelData.name}`);

      const response = await firstValueFrom(
        this.http.post(url, AnliPayload, { headers }),
      );
      if (response.status === 201 || response.status === 200) {
        this.logger.log(
          `[Anli Hotel] Hotel created successfully: id=${response.data.id} name=${response.data.name}`,
        );
        return response.data;
      } else {
        throw new HttpException(
          `Failed to create hotel in Anli: ${response.statusText}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const data = error?.response?.data;
      const errorMessage = data?.message || error?.message || "Unknown error";

      this.logger.error(
        `[Anli Hotel] Failed to create hotel: status=${status ?? "n/a"} message=${errorMessage}`,
      );

      if (status === 400) {
        throw new HttpException(
          `Hotel creation failed: ${errorMessage}`,
          HttpStatus.BAD_REQUEST,
        );
      } else if (status === 401) {
        throw new HttpException(
          "Invalid API key for Anli hotel creation",
          HttpStatus.UNAUTHORIZED,
        );
      } else {
        throw new HttpException(
          `Failed to create hotel in Anli: ${errorMessage}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  /**
   * Get hotels by registration source from Anli PMS via API
   * Excludes DIRECT registrations
   */
  async getHotelsByRegistrationSource(
    registrationSource?: string,
  ): Promise<{ count: number; hotels: any[] }> {
    try {
      let url = `${this.baseUrl}/public/channel-manager/hotels`;
      if (registrationSource) {
        url += `?registrationSource=${encodeURIComponent(registrationSource)}`;
      }

      const apiKey = this.apiKey;

      if (!apiKey) {
        this.logger.error(
          "[Anli Hotel] CM_FORWARD_API_KEY not configured in channel manager. Please set CM_FORWARD_API_KEY environment variable to match Anli's CM_FORWARD_API_KEY",
        );
        throw new HttpException(
          "CM_FORWARD_API_KEY not configured in channel manager. Please set the environment variable.",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      };

      this.logger.log(
        `[Anli Hotel] Fetching hotels${registrationSource ? ` with source=${registrationSource}` : " (all non-DIRECT)"} from Anli`,
      );

      const response = await firstValueFrom(this.http.get(url, { headers }));

      if (response.status === 200) {
        this.logger.log(
          `[Anli Hotel] Successfully fetched ${response.data.count} hotels`,
        );
        return response.data;
      } else {
        throw new HttpException(
          `Failed to fetch hotels from Anli: ${response.statusText}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const data = error?.response?.data;
      const errorMessage = data?.message || error?.message || "Unknown error";

      this.logger.error(
        `[Anli Hotel] Failed to fetch hotels: status=${status ?? "n/a"} message=${errorMessage}`,
      );

      if (status === 400) {
        throw new HttpException(
          `Failed to fetch hotels: ${errorMessage}`,
          HttpStatus.BAD_REQUEST,
        );
      } else if (status === 401) {
        throw new HttpException(
          "Invalid API key for Anli hotel fetch",
          HttpStatus.UNAUTHORIZED,
        );
      } else {
        throw new HttpException(
          `Failed to fetch hotels from Anli: ${errorMessage}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  /**
   * Get single hotel from Anli PMS via API
   */
  async getHotel(hotelId: number): Promise<any> {
    try {
      const url = `${this.baseUrl}/public/channel-manager/hotels/${hotelId}`;
      const apiKey = this.apiKey;

      if (!apiKey) {
        this.logger.error(
          "[Anli Hotel] CM_FORWARD_API_KEY not configured in channel manager.",
        );
        throw new HttpException(
          "CM_FORWARD_API_KEY not configured in channel manager.",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      };

      this.logger.log(
        `[Anli Hotel] Fetching single hotel ${hotelId} from Anli`,
      );

      const response = await firstValueFrom(this.http.get(url, { headers }));

      if (response.status === 200) {
        this.logger.log(`[Anli Hotel] Successfully fetched hotel ${hotelId}`);
        return response.data;
      } else {
        throw new HttpException(
          `Failed to fetch hotel from Anli: ${response.statusText}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const data = error?.response?.data;
      const errorMessage = data?.message || error?.message || "Unknown error";

      this.logger.error(
        `[Anli Hotel] Failed to fetch hotel ${hotelId}: status=${status ?? "n/a"} message=${errorMessage}`,
      );

      if (status === 404) {
        // Return null for missing hotel rather than throwing 500
        return null;
      }

      if (status === 400) {
        throw new HttpException(
          `Failed to fetch hotel: ${errorMessage}`,
          HttpStatus.BAD_REQUEST,
        );
      } else if (status === 401) {
        throw new HttpException(
          "Invalid API key for Anli hotel fetch",
          HttpStatus.UNAUTHORIZED,
        );
      } else {
        throw new HttpException(
          `Failed to fetch hotel from Anli: ${errorMessage}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  /**
   * Create room type in Anli PMS via API
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
          "[Anli RoomType] CM_FORWARD_API_KEY not configured in channel manager.",
        );
        throw new HttpException(
          "CM_FORWARD_API_KEY not configured in channel manager.",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      };

      this.logger.log(
        `[Anli RoomType] Creating room type in Anli: ${roomTypeData.name} for hotel ${roomTypeData.hotelId}`,
      );

      const response = await firstValueFrom(
        this.http.post(url, roomTypeData, { headers }),
      );

      if (response.status === 201 || response.status === 200) {
        this.logger.log(
          `[Anli RoomType] Room type created successfully: id=${response.data.id} name=${response.data.name}`,
        );
        return response.data;
      } else {
        throw new HttpException(
          `Failed to create room type in Anli: ${response.statusText}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const data = error?.response?.data;
      const errorMessage = data?.message || error?.message || "Unknown error";

      this.logger.error(
        `[Anli RoomType] Failed to create room type: status=${status ?? "n/a"} message=${errorMessage}`,
      );

      if (status === 400) {
        throw new HttpException(
          `Room type creation failed: ${errorMessage}`,
          HttpStatus.BAD_REQUEST,
        );
      } else if (status === 401) {
        throw new HttpException(
          "Invalid API key for Anli room type creation",
          HttpStatus.UNAUTHORIZED,
        );
      } else {
        throw new HttpException(
          `Failed to create room type in Anli: ${errorMessage}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  /**
   * Create room in Anli PMS via API
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
          "[Anli Room] CM_FORWARD_API_KEY not configured in channel manager.",
        );
        throw new HttpException(
          "CM_FORWARD_API_KEY not configured in channel manager.",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      };

      this.logger.log(
        `[Anli Room] Creating room in Anli: ${roomData.roomNumber} for hotel ${roomData.hotelId}`,
      );

      const response = await firstValueFrom(
        this.http.post(url, roomData, { headers }),
      );

      if (response.status === 201 || response.status === 200) {
        this.logger.log(
          `[Anli Room] Room created successfully: id=${response.data.id} number=${response.data.roomNumber}`,
        );
        return response.data;
      } else {
        throw new HttpException(
          `Failed to create room in Anli: ${response.statusText}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const data = error?.response?.data;
      const errorMessage = data?.message || error?.message || "Unknown error";

      this.logger.error(
        `[Anli Room] Failed to create room: status=${status ?? "n/a"} message=${errorMessage}`,
      );

      if (status === 400) {
        throw new HttpException(
          `Room creation failed: ${errorMessage}`,
          HttpStatus.BAD_REQUEST,
        );
      } else if (status === 401) {
        throw new HttpException(
          "Invalid API key for Anli room creation",
          HttpStatus.UNAUTHORIZED,
        );
      } else {
        throw new HttpException(
          `Failed to create room in Anli: ${errorMessage}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  /**
   * Get hotel room types with rooms from Anli PMS via API
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
          "[Anli RoomTypes] CM_FORWARD_API_KEY not configured in channel manager.",
        );
        throw new HttpException(
          "CM_FORWARD_API_KEY not configured in channel manager.",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      };

      this.logger.log(
        `[Anli RoomTypes] Fetching room types for hotel ${hotelId} from Anli`,
      );

      const response = await firstValueFrom(this.http.get(url, { headers }));
      console.log(response.data);
      if (response.status === 200) {
        this.logger.log(
          `[Anli RoomTypes] Successfully fetched ${response.data.count} room types`,
        );
        return response.data;
      } else {
        throw new HttpException(
          `Failed to fetch room types from Anli: ${response.statusText}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const data = error?.response?.data;
      const errorMessage = data?.message || error?.message || "Unknown error";

      this.logger.error(
        `[Anli RoomTypes] Failed to fetch room types: status=${status ?? "n/a"} message=${errorMessage}`,
      );

      if (status === 400) {
        throw new HttpException(
          `Failed to fetch room types: ${errorMessage}`,
          HttpStatus.BAD_REQUEST,
        );
      } else if (status === 401) {
        throw new HttpException(
          "Invalid API key for Anli room types fetch",
          HttpStatus.UNAUTHORIZED,
        );
      } else if (status === 404) {
        throw new HttpException(
          `Hotel not found: ${errorMessage}`,
          HttpStatus.NOT_FOUND,
        );
      } else {
        throw new HttpException(
          `Failed to fetch room types from Anli: ${errorMessage}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  /**
   * Search hotels in Anli PMS via API by name or email
   */
  async searchHotels(
    name?: string,
    email?: string,
  ): Promise<{ count: number; hotels: any[] }> {
    try {
      let url = `${this.baseUrl}/public/channel-manager/hotels/search`;
      const params = new URLSearchParams();
      if (name) params.append("name", name);
      if (email) params.append("email", email);

      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const apiKey = this.apiKey;

      if (!apiKey) {
        this.logger.error(
          "[Anli Hotel] CM_FORWARD_API_KEY not configured in channel manager.",
        );
        throw new HttpException(
          "CM_FORWARD_API_KEY not configured in channel manager.",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      };

      this.logger.log(
        `[Anli Hotel] Searching hotels with name=${name || "any"} and/or email=${email || "any"} from Anli`,
      );

      const response = await firstValueFrom(this.http.get(url, { headers }));

      if (response.status === 200) {
        this.logger.log(
          `[Anli Hotel] Successfully found ${response.data.count} matching hotels`,
        );
        return response.data;
      } else {
        throw new HttpException(
          `Failed to search hotels from Anli: ${response.statusText}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const data = error?.response?.data;
      const errorMessage = data?.message || error?.message || "Unknown error";

      this.logger.error(
        `[Anli Hotel] Failed to search hotels: status=${status ?? "n/a"} message=${errorMessage}`,
      );

      if (status === 400) {
        throw new HttpException(
          `Failed to search hotels: ${errorMessage}`,
          HttpStatus.BAD_REQUEST,
        );
      } else if (status === 401) {
        throw new HttpException(
          "Invalid API key for Anli hotel search",
          HttpStatus.UNAUTHORIZED,
        );
      } else {
        throw new HttpException(
          `Failed to search hotels from Anli: ${errorMessage}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}
