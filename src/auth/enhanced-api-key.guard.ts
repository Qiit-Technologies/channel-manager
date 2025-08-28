import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { API_KEY_REQUIRED } from "./api-key.decorator";

@Injectable()
export class EnhancedApiKeyGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if API key is required for this endpoint
    const isApiKeyRequired = this.reflector.getAllAndOverride<boolean>(
      API_KEY_REQUIRED,
      [context.getHandler(), context.getClass()]
    );

    // If API key is not explicitly required, allow access
    if (!isApiKeyRequired) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException("API key is required for this endpoint");
    }

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
    const validApiKey = process.env.CHANNEL_MANAGER_API_KEY;

    if (!validApiKey) {
      // Development mode - allow all requests
      return true;
    }

    return apiKey === validApiKey;
  }
}
