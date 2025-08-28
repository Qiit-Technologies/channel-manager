import { Injectable, Logger } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name);

  /**
   * Generate a new API key
   * @param prefix Optional prefix for the API key
   * @returns Generated API key
   */
  generateApiKey(prefix: string = 'cm'): string {
    const randomPart = randomBytes(32).toString('hex');
    const timestamp = Date.now().toString(36);
    const apiKey = `${prefix}_${timestamp}_${randomPart}`;
    
    this.logger.log(`Generated new API key: ${apiKey.substring(0, 20)}...`);
    return apiKey;
  }

  /**
   * Generate a secure hash of an API key for storage
   * @param apiKey The API key to hash
   * @returns Hashed API key
   */
  hashApiKey(apiKey: string): string {
    return createHash('sha256').update(apiKey).digest('hex');
  }

  /**
   * Validate API key format
   * @param apiKey The API key to validate
   * @returns True if valid format
   */
  validateApiKeyFormat(apiKey: string): boolean {
    // Check if API key follows the expected format: prefix_timestamp_random
    const parts = apiKey.split('_');
    return parts.length === 3 && parts[0] === 'cm';
  }

  /**
   * Extract information from API key
   * @param apiKey The API key to analyze
   * @returns Object with prefix, timestamp, and random part
   */
  parseApiKey(apiKey: string): { prefix: string; timestamp: number; randomPart: string } | null {
    if (!this.validateApiKeyFormat(apiKey)) {
      return null;
    }

    const parts = apiKey.split('_');
    const timestamp = parseInt(parts[1], 36);
    
    return {
      prefix: parts[0],
      timestamp,
      randomPart: parts[2],
    };
  }

  /**
   * Check if API key is expired (older than specified days)
   * @param apiKey The API key to check
   * @param maxAgeDays Maximum age in days
   * @returns True if expired
   */
  isApiKeyExpired(apiKey: string, maxAgeDays: number = 365): boolean {
    const parsed = this.parseApiKey(apiKey);
    if (!parsed) {
      return true;
    }

    const ageInDays = (Date.now() - parsed.timestamp) / (1000 * 60 * 60 * 24);
    return ageInDays > maxAgeDays;
  }
} 