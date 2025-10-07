-- Add SEVEN to the channel_integration_channeltype_enum
ALTER TYPE channel_integration_channeltype_enum ADD VALUE 'SEVEN';

-- Verify the enum values
SELECT unnest(enum_range(NULL::channel_integration_channeltype_enum));

-- Optional: Add a comment to document this change
COMMENT ON TYPE channel_integration_channeltype_enum IS 'Channel types supported by the channel manager, including hotel-specific integrations like 7even';