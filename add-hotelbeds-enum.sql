-- Add HOTELBEDS to the channel_integration_channeltype_enum
ALTER TYPE channel_integration_channeltype_enum ADD VALUE 'HOTELBEDS';

-- Verify the enum values
SELECT unnest(enum_range(NULL::channel_integration_channeltype_enum)); 
 
 
 