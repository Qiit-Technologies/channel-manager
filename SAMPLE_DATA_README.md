# Channel Manager Sample Data

This directory contains comprehensive sample data for all Channel Manager API endpoints. Use these samples for testing, development, documentation, and API exploration.

## File Structure

- `src/sample-data.ts` - TypeScript file with typed sample data (recommended for TypeScript projects)
- `sample-data.json` - JSON version for easy consumption in any language

## Quick Start

### TypeScript/JavaScript

```typescript
import sampleData from "./src/sample-data";

// Access sample data
const integrations = sampleData.integrations.list;
const singleIntegration = sampleData.integrations.single;
const createRequest = sampleData.integrations.createRequest;
```

### JSON

```javascript
const sampleData = require("./sample-data.json");

// Access sample data
const integrations = sampleData.integrations.list;
const bookings = sampleData.bookings.list;
```

## Sample Data Coverage

The sample data file includes examples for all endpoints:

### 1. Channel Integration Endpoints

- ✅ `GET /integrations` - List of all integrations
- ✅ `GET /integrations/:id` - Single integration details
- ✅ `POST /integrations` - Create integration request body
- ✅ `PUT /integrations/:id` - Update integration request body
- ✅ `GET /integrations/available-types/:hotelId` - Available channel types

**Usage:**

```typescript
import { sampleChannelIntegrations } from "./src/sample-data";

// Get list of integrations
const integrations = sampleChannelIntegrations.list;

// Get single integration
const integration = sampleChannelIntegrations.single;

// Create integration request
const createPayload = sampleChannelIntegrations.createRequest;
```

### 2. Channel Mapping Endpoints

- ✅ `GET /integrations/:integrationId/mappings` - List of mappings
- ✅ `POST /mappings` - Create mapping request body
- ✅ `PUT /mappings/:id` - Update mapping request body

**Usage:**

```typescript
import { sampleChannelMappings } from "./src/sample-data";

const mappings = sampleChannelMappings.list;
const createMapping = sampleChannelMappings.createRequest;
const updateMapping = sampleChannelMappings.updateRequest;
```

### 3. Availability Endpoints

- ✅ `GET /availability` - List availability by date range
- ✅ `POST /availability/sync` - Sync availability request body

**Usage:**

```typescript
import { sampleAvailability } from "./src/sample-data";

const availabilityList = sampleAvailability.list;
const syncRequest = sampleAvailability.syncRequest;
```

### 4. Rate Plan Endpoints

- ✅ `GET /integrations/:integrationId/rate-plans` - List of rate plans
- ✅ `POST /rate-plans` - Create rate plan request body
- ✅ `PUT /rate-plans/:id` - Update rate plan request body

**Usage:**

```typescript
import { sampleRatePlans } from "./src/sample-data";

const ratePlans = sampleRatePlans.list;
const createRatePlan = sampleRatePlans.createRequest;
```

### 5. Booking/Guest Endpoints

- ✅ `GET /bookings` - List of bookings
- ✅ `GET /bookings/:bookingCode` - Single booking details
- ✅ `POST /bookings` - Create booking request body
- ✅ `PUT /bookings/:bookingCode` - Update booking request body
- ✅ `POST /guests/:guestId/check-in` - Check-in response
- ✅ `POST /guests/:guestId/check-out` - Check-out response

**Usage:**

```typescript
import { sampleBookings } from "./src/sample-data";

const bookings = sampleBookings.list;
const singleBooking = sampleBookings.single;
const createBooking = sampleBookings.createRequest;
```

### 6. Sync Log Endpoints

- ✅ `GET /integrations/:id/sync-logs` - List of sync logs
- ✅ `GET /integrations/:id/sync-statistics` - Sync statistics
- ✅ `POST /integrations/:id/sync` - Trigger sync request body

**Usage:**

```typescript
import { sampleSyncLogs } from "./src/sample-data";

const syncLogs = sampleSyncLogs.list;
const statistics = sampleSyncLogs.statistics;
const triggerSync = sampleSyncLogs.triggerSyncRequest;
```

### 7. Dashboard & Analytics Endpoints

- ✅ `GET /dashboard/summary` - Dashboard summary
- ✅ `GET /dashboard/performance` - Performance metrics

**Usage:**

```typescript
import { sampleDashboard } from "./src/sample-data";

const summary = sampleDashboard.summary;
const performance = sampleDashboard.performance;
```

### 8. Channel Information Endpoints

- ✅ `GET /channels/supported` - Supported channels list
- ✅ `GET /channels/:type/features` - Channel features

**Usage:**

```typescript
import { sampleChannelInfo } from "./src/sample-data";

const supportedChannels = sampleChannelInfo.supportedChannels;
const bookingComFeatures = sampleChannelInfo.features[ChannelType.BOOKING_COM];
```

### 9. Testing Endpoints

- ✅ `POST /integrations/:id/test` - Test integration response (success & failure)

**Usage:**

```typescript
import { sampleTesting } from "./src/sample-data";

const successResponse = sampleTesting.testResponse;
const failureResponse = sampleTesting.testResponseFailure;
```

### 10. Webhook Endpoints

- ✅ `POST /webhooks/:type` - Various webhook payload examples

**Usage:**

```typescript
import { sampleWebhooks } from "./src/sample-data";

const sevenReservation = sampleWebhooks.sevenReservation;
const sevenCancellation = sampleWebhooks.sevenCancellation;
const cornicheReservation = sampleWebhooks.cornicheReservation;
```

## Using Sample Data in Tests

### Example: Testing Integration Creation

```typescript
import { sampleChannelIntegrations } from "./src/sample-data";
import { ChannelManagerService } from "./channel-manager.service";

describe("ChannelManagerService", () => {
  it("should create integration with sample data", async () => {
    const createDto = sampleChannelIntegrations.createRequest;
    const result = await service.createChannelIntegration(createDto, 1);

    expect(result.channelType).toBe(ChannelType.BOOKING_COM);
    expect(result.hotelId).toBe(createDto.hotelId);
  });
});
```

### Example: Testing API Endpoints

```typescript
import { sampleBookings } from "./src/sample-data";

describe("Bookings API", () => {
  it("should return bookings list", async () => {
    const response = await request(app.getHttpServer())
      .get("/channel-manager/bookings")
      .set("X-API-Key", "test-key")
      .expect(200);

    expect(response.body.bookings).toBeDefined();
    expect(Array.isArray(response.body.bookings)).toBe(true);
  });

  it("should create booking with sample data", async () => {
    const createPayload = sampleBookings.createRequest;
    const response = await request(app.getHttpServer())
      .post("/channel-manager/bookings")
      .set("X-API-Key", "test-key")
      .send(createPayload)
      .expect(201);

    expect(response.body.bookingCode).toBe(createPayload.bookingCode);
  });
});
```

## Using Sample Data in API Documentation

### Swagger/OpenAPI Examples

The sample data can be used to populate Swagger examples:

```typescript
@ApiResponse({
  status: 200,
  description: 'List of integrations',
  schema: {
    example: sampleChannelIntegrations.list,
  },
})
```

### Postman Collection

You can import the JSON sample data into Postman and use it in:

1. Request body examples
2. Response examples
3. Test data
4. Environment variables

## Data Structure Notes

### Dates

All dates in the TypeScript file use JavaScript `Date` objects. When converting to JSON, they are serialized as ISO 8601 strings.

### Enums

Enum values are represented as strings matching the enum definitions:

- `ChannelType`: `BOOKING_COM`, `EXPEDIA`, `AIRBNB`, etc.
- `IntegrationStatus`: `ACTIVE`, `INACTIVE`, `ERROR`, `PENDING`, `TESTING`
- `BookingStatus`: `PENDING`, `CONFIRMED`, `CHECKED_IN`, `CHECKED_OUT`, `CANCELED`, etc.
- `AvailabilityStatus`: `AVAILABLE`, `UNAVAILABLE`, `OCCUPIED`, `MAINTENANCE`, `BLOCKED`
- `SyncStatus`: `SUCCESS`, `FAILED`, `PENDING`, `IN_PROGRESS`, `PARTIAL_SUCCESS`

### IDs

Sample data uses realistic ID values (e.g., 1, 2, 14, 42). In production, these will be auto-generated by the database.

## Contributing

When adding new endpoints or updating existing ones:

1. Update `src/sample-data.ts` with the new sample data
2. Ensure all required fields are included
3. Maintain consistency with existing data structure
4. Update this README if needed
5. Convert to JSON if JSON version is maintained

## Examples by Use Case

### Complete Integration Setup Flow

```typescript
import {
  sampleChannelIntegrations,
  sampleChannelMappings,
  sampleAvailability,
  sampleRatePlans,
} from "./src/sample-data";

// 1. Create integration
const integrationDto = sampleChannelIntegrations.createRequest;

// 2. Create mapping
const mappingDto = sampleChannelMappings.createRequest;
mappingDto.integrationId = integration.id; // Use created integration ID

// 3. Create rate plan
const ratePlanDto = sampleRatePlans.createRequest;
ratePlanDto.integrationId = integration.id;

// 4. Sync availability
const availabilityDto = sampleAvailability.syncRequest;
availabilityDto.integrationId = integration.id;
```

### Testing Webhook Handling

```typescript
import { sampleWebhooks } from "./src/sample-data";

// Test 7even reservation webhook
const reservation = sampleWebhooks.sevenReservation;
await webhookService.handleWebhook(ChannelType.SEVEN, reservation);

// Test cancellation webhook
const cancellation = sampleWebhooks.sevenCancellation;
await webhookService.handleWebhook(ChannelType.SEVEN, cancellation);
```

### Dashboard Data Visualization

```typescript
import { sampleDashboard } from "./src/sample-data";

// Get dashboard summary
const summary = sampleDashboard.summary;
console.log(`Active integrations: ${summary.activeIntegrations}`);

// Get performance metrics
const performance = sampleDashboard.performance;
performance.forEach((metric) => {
  console.log(`${metric.channelName}: ${metric.successRate}% success rate`);
});
```

## Notes

- All sample data is for development/testing purposes only
- Real API keys, secrets, and credentials should never be included
- Dates in samples are relative and may need adjustment for your use case
- Some data includes null/undefined values to represent optional fields
- JSON structure may differ slightly from TypeScript due to serialization
