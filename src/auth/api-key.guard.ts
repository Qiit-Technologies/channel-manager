import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException("API key is required");
    }

    // Validate API key (you can enhance this with database lookup)
    if (!this.validateApiKey(apiKey)) {
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

  private validateApiKey(apiKey: string): boolean {
    // Get API key from environment variable
    const validApiKey = process.env.CHANNEL_MANAGER_API_KEY;

    if (!validApiKey) {
      // If no API key is set in environment, allow all requests (development mode)
      return true;
    }

    return apiKey === validApiKey;
  }
}
