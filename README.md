# Channel Manager

A comprehensive channel management system for hotel management, designed to integrate with multiple Online Travel Agencies (OTAs) and distribution channels.

## Features

- **Multi-Channel Integration**: Support for Airbnb, Booking.com, Expedia, Hotels.com, TripAdvisor, Agoda, and custom APIs
- **Real-time Synchronization**: Push updates for availability, rates, and inventory
- **Scheduled Sync**: Automated synchronization at configurable intervals
- **Webhook Support**: Handle incoming bookings and updates from channels
- **Guest Integration**: Seamless integration with existing guest management system
- **Comprehensive Logging**: Track all synchronization activities and errors

## Architecture

The system is built with a modular architecture:

- **Entities**: Database models for integrations, mappings, availability, rates, and sync logs
- **Services**: Business logic for channel management and synchronization
- **API Layer**: Abstract interface for different channel APIs with concrete implementations
- **Sync Engine**: Handles scheduled and real-time synchronization
- **Repository**: Data access layer for all channel manager entities

## Supported Channels

- **Airbnb**: Full API integration for property management
- **Booking.com**: Connect API for availability and rate updates
- **Expedia**: Partner Central API integration
- **Hotels.com**: API integration for property updates
- **TripAdvisor**: Business listing management
- **Agoda**: Partner API integration
- **Custom APIs**: Generic integration for custom channel systems

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd channel-manager
   ```

## API Key Authentication

The Channel Manager uses API key authentication for secure access to all endpoints.

### Setting Up API Key Authentication

1. **Generate an API Key**

   ```bash
   # Set the master API key in your .env file
   CHANNEL_MANAGER_API_KEY=your_master_api_key_here
   ```

2. **Using API Keys in Requests**

   **Option 1: Authorization Header (Recommended)**

   ```bash
   curl -H "Authorization: Bearer your_api_key_here" \
        http://localhost:3001/api/v1/channel-integrations
   ```

   **Option 2: X-API-Key Header**

   ```bash
   curl -H "X-API-Key: your_api_key_here" \
        http://localhost:3001/api/v1/channel-integrations
   ```

   **Option 3: Query Parameter**

   ```bash
   curl "http://localhost:3001/api/v1/channel-integrations?apiKey=your_api_key_here"
   ```

### API Key Management Endpoints

- `POST /api/v1/api-keys` - Create new API key (requires authentication)
- `GET /api/v1/api-keys/generate` - Generate new API key (requires authentication)
- `GET /api/v1/api-keys/validate/:apiKey` - Validate API key format (public)
- `GET /api/v1/api-keys/info` - Get API key information (requires authentication)

### Security Features

- **API Key Format**: `cm_timestamp_randomstring` (e.g., `cm_lq1x2y3z_abc123def456`)
- **Expiration**: Configurable expiration dates for API keys
- **Permissions**: READ_ONLY, READ_WRITE, ADMIN levels
- **IP Whitelisting**: Restrict access to specific IP addresses
- **Usage Tracking**: Monitor API key usage and last access

### Development Mode

When no `CHANNEL_MANAGER_API_KEY` is set in the environment, the system runs in development mode where all endpoints are accessible without authentication.

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file with the following variables:

   ```env
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   DB_DATABASE=your_database

   # Channel Manager API Key (Master Key)
   CHANNEL_MANAGER_API_KEY=your_master_api_key_here

   # Channel API Keys
   AIRBNB_API_KEY=your_airbnb_api_key
   AIRBNB_API_SECRET=your_airbnb_api_secret
   BOOKING_COM_API_KEY=your_booking_api_key
   EXPEDIA_API_KEY=your_expedia_api_key
   HOTELS_COM_API_KEY=your_hotels_com_api_key
   TRIPADVISOR_API_KEY=your_tripadvisor_api_key
   AGODA_API_KEY=your_agoda_api_key

  # Application
  PORT=3001
  NODE_ENV=development
  
  # Optional PMS Reservation Forwarding
  PMS_RESERVATION_FORWARD=true
  PMS_RESERVATION_CREATE_URL=https://oreon.example.com/api/v1/guests/{hotelId}
  PMS_API_KEY=your_pms_api_key
  ```

4. **Database Setup**

   ```bash
   # Run migrations (if using TypeORM migrations)
   npm run migration:run
   ```

5. **Start the application**

   ```bash
   # Development mode
   npm run start:dev

   # Production mode
   npm run start:prod
   ```

## API Endpoints

### Channel Integrations

- `POST /api/v1/channel-integrations` - Create new integration
- `GET /api/v1/channel-integrations/:hotelId` - Get integrations by hotel
- `PUT /api/v1/channel-integrations/:id` - Update integration
- `DELETE /api/v1/channel-integrations/:id` - Delete integration

### Channel Mappings

- `POST /api/v1/channel-mappings` - Create room type mapping
- `GET /api/v1/channel-mappings/:integrationId` - Get mappings by integration
- `PUT /api/v1/channel-mappings/:id` - Update mapping

### Availability Management

- `POST /api/v1/availability/sync` - Sync availability
- `GET /api/v1/availability/:integrationId/:roomtypeId` - Get availability by date range

### Rate Management

- `POST /api/v1/rates` - Create rate plan
- `GET /api/v1/rates/:integrationId` - Get rate plans by integration

### Synchronization

- `POST /api/v1/sync/:integrationId/:operationType` - Trigger manual sync
- `GET /api/v1/sync/logs/:integrationId` - Get sync logs
- `GET /api/v1/sync/statistics/:integrationId` - Get sync statistics

### Guest Integration

- `POST /api/v1/guests/:guestId/checkin` - Handle guest check-in
- `POST /api/v1/guests/:guestId/checkout` - Handle guest check-out

### PMS Reservation Forwarding (Optional)

- When inbound webhooks include reservation details, the system can forward a standardized `CreateGuestDto` payload to your PMS.
- Enable by setting `PMS_RESERVATION_FORWARD=true` and configuring `PMS_RESERVATION_CREATE_URL`.
- The URL may include a `{hotelId}` placeholder which will be replaced; otherwise `hotelId` is appended as a query param.
- If `PMS_API_KEY` is set, it is sent in the `X-API-Key` header.

## Usage Examples

### Creating a Channel Integration

```typescript
const integration = await channelManagerService.createChannelIntegration(
  {
    hotelId: 1,
    channelType: ChannelType.AIRBNB,
    channelName: "Airbnb Integration",
    apiKey: "your_api_key",
    apiSecret: "your_api_secret",
    isRealTimeSync: true,
    syncIntervalMinutes: 15,
  },
  userId
);

// Hotelbeds integration example
const hotelbedsIntegration =
  await channelManagerService.createChannelIntegration(
    {
      hotelId: 1,
      channelType: ChannelType.HOTELBEDS,
      channelName: "Hotelbeds Integration",
      apiKey: "your_hotelbeds_api_key",
      apiSecret: "your_hotelbeds_api_secret",
      channelPropertyId: "12345",
      isRealTimeSync: true,
      syncIntervalMinutes: 15,
    },
    userId
  );
```

### Syncing Availability

```typescript
const availability = await channelManagerService.syncAvailability({
  integrationId: 1,
  roomtypeId: 1,
  date: "2024-01-15",
  totalRooms: 10,
  availableRooms: 8,
  occupiedRooms: 2,
});
```

### Manual Sync Trigger

```typescript
await channelManagerService.triggerManualSync(1, SyncOperationType.FULL_SYNC);
```

## Configuration

### Sync Intervals

Configure synchronization intervals in the integration settings:

- **Real-time**: Immediate updates for critical changes
- **Scheduled**: Configurable intervals (5, 15, 30, 60 minutes)
- **Manual**: On-demand synchronization

### Error Handling

The system includes comprehensive error handling:

- Automatic retry mechanisms
- Error logging and monitoring
- Integration status tracking
- Alert notifications for critical failures

## Monitoring and Logging

### Sync Logs

Track all synchronization activities:

- Operation type and status
- Processing time and record counts
- Error details and response data
- Timestamps and user information

### Statistics

Monitor integration performance:

- Success/failure rates
- Average processing times
- Record counts by operation type
- Historical performance trends

## Security Features

- **API Key Authentication**: Secure API key-based authentication for all endpoints
- **API Key Management**: Generate, validate, and manage API keys with different permission levels
- **Channel API Key Management**: Secure storage and rotation of channel API keys
- **Webhook Validation**: Signature verification for incoming webhooks
- **Access Control**: Role-based permissions for channel management
- **Audit Logging**: Track all changes and access attempts
- **IP Whitelisting**: Restrict API access to specific IP addresses
- **Rate Limiting**: Built-in protection against abuse

## Development

### Project Structure

```
src/
├── entities/           # Database models
├── dto/               # Data transfer objects
├── api/               # Channel API implementations
│   └── implementations/
├── sync/              # Synchronization engine
├── channel-manager.module.ts
├── channel-manager.service.ts
├── channel-manager.controller.ts
├── channel-manager.repository.ts
└── main.ts
```

### Adding New Channels

1. Implement the `ChannelApiInterface`
2. Add the channel type to the `ChannelType` enum
3. Update the `ChannelApiFactory`
4. Add configuration and credentials handling

### Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "run", "start:prod"]
```

### Environment Variables

Ensure all required environment variables are set in your deployment environment.

## Support

For technical support or questions:

- Check the logs for detailed error information
- Review the sync statistics for performance insights
- Verify channel API credentials and permissions
- Ensure database connectivity and schema compatibility

## License

This project is licensed under the MIT License.