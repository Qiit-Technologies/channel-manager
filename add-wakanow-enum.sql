-- Add WAKANOW to the channel_type_enum
ALTER TYPE channel_type_enum ADD VALUE 'WAKANOW';

-- Verify the enum values
SELECT unnest(enum_range(NULL::channel_type_enum));
