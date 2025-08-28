import { SetMetadata } from '@nestjs/common';

export const API_KEY_REQUIRED = 'apiKeyRequired';
export const RequireApiKey = () => SetMetadata(API_KEY_REQUIRED, true); 