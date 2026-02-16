-- Create the ota_configuration table if it doesn't exist
CREATE TABLE IF NOT EXISTS ota_configuration (
    id SERIAL PRIMARY KEY,
    "channelType" VARCHAR NOT NULL UNIQUE,
    "apiKey" VARCHAR,
    "apiSecret" VARCHAR,
    "accessToken" VARCHAR,
    "refreshToken" VARCHAR,
    "baseUrl" VARCHAR,
    "isActive" BOOLEAN DEFAULT true,
    "additionalConfig" JSONB,
    "lastTested" TIMESTAMP,
    "testStatus" VARCHAR,
    "errorMessage" VARCHAR,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Note: We use VARCHAR for channelType for better compatibility with different enum versions,
-- but the application will treat it as an enum.

-- Upsert configuration for Corniche
INSERT INTO ota_configuration (
    "channelType", 
    "baseUrl", 
    "apiKey", 
    "apiSecret", 
    "isActive", 
    "additionalConfig"
) VALUES (
    'CORNICHE',
    'https://www.thecornichehotel.com/wp-json/cmw/v1',
    'CornicheLive_2026#W9xT4qL8zR2m',
    'CornicheLive_2026#W9xT4qL8zR2m',
    true,
    '{"webhookUrl": "https://www.thecornichehotel.com/wp-json/cmw/v1/webhooks/CORNICHE"}'
)
ON CONFLICT ("channelType") 
DO UPDATE SET 
    "baseUrl" = EXCLUDED."baseUrl",
    "apiKey" = EXCLUDED."apiKey",
    "apiSecret" = EXCLUDED."apiSecret",
    "isActive" = EXCLUDED."isActive",
    "additionalConfig" = EXCLUDED."additionalConfig",
    "updatedAt" = NOW();
