import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApiKey, ApiKeyStatus } from "../entities/api-key.entity";
import { createHash } from "crypto";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository?: Repository<ApiKey>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException("API key is required");
    }

    // Validate API key (check database first, then fallback to env variable)
    const isValid = await this.validateApiKey(apiKey);
    if (!isValid) {
      throw new UnauthorizedException("Invalid API key");
    }

    return true;
  }

  private extractApiKey(request: Request): string | undefined {
    // Check Authorization header: Bearer <api-key>
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7);
    }

    // Check X-API-Key header
    const apiKeyHeader = request.headers["x-api-key"];
    if (apiKeyHeader) {
      return Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;
    }

    // Check query parameter
    const queryApiKey = request.query.apiKey;
    if (queryApiKey) {
      if (Array.isArray(queryApiKey)) {
        return String(queryApiKey[0]);
      }
      return String(queryApiKey);
    }

    return undefined;
  }

  private async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      // First, try to validate against database (if repository is available)
      if (this.apiKeyRepository && process.env.TEST_MODE !== "true") {
        const keyHash = createHash("sha256").update(apiKey).digest("hex");
        const dbApiKey = await this.apiKeyRepository.findOne({
          where: { keyHash },
        });

        if (dbApiKey) {
          // Check if API key is active
          if (dbApiKey.status !== ApiKeyStatus.ACTIVE) {
            return false;
          }

          // Check if API key is expired
          if (dbApiKey.expiresAt && new Date(dbApiKey.expiresAt) < new Date()) {
            return false;
          }

          // Update last used timestamp
          dbApiKey.lastUsedAt = new Date();
          dbApiKey.usageCount = (dbApiKey.usageCount || 0) + 1;
          await this.apiKeyRepository.save(dbApiKey);

          return true;
        }
      }
    } catch (error) {
      // If database lookup fails, fall back to environment variable
    }

    // Fallback to environment variable validation
    const validApiKey = process.env.CHANNEL_MANAGER_API_KEY;

    if (!validApiKey) {
      // If no API key is set in environment, allow all requests (development mode)
      return true;
    }

    return apiKey === validApiKey;
  }
}
