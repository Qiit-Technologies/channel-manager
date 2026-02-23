-- Upsert configuration for Wakanow
-- Note: Replace these placeholder values with actual credentials when available
INSERT INTO ota_configuration (
    "channelType", 
    "baseUrl", 
    "apiKey", 
    "apiSecret", 
    "isActive", 
    "additionalConfig"
) VALUES (
    'WAKANOW',
    'https://api.wakanow.com/v1',
    'Wakanow_API_Key_Placeholder',
    'Wakanow_API_Secret_Placeholder',
    true,
    '{"webhookUrl": "https://api.qiit.com/channel-manager/webhooks/WAKANOW", "currency": "NGN"}'
)
ON CONFLICT ("channelType") 
DO UPDATE SET 
    "baseUrl" = EXCLUDED."baseUrl",
    "apiKey" = EXCLUDED."apiKey",
    "apiSecret" = EXCLUDED."apiSecret",
    "isActive" = EXCLUDED."isActive",
    "additionalConfig" = EXCLUDED."additionalConfig",
    "updatedAt" = NOW();
