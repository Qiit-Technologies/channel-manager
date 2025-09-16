# Channel Manager API Documentation

## Overview

The Channel Manager API provides comprehensive integration capabilities for managing hotel distribution across multiple Online Travel Agencies (OTAs) and booking channels. It handles channel integrations, room mappings, availability synchronization, rate management, and real-time booking updates.

## Base URL

```
http://localhost:4000/api/v1/channel-manager
```

## Authentication

All endpoints require API key authentication via the `X-API-Key` header.

**Important:** The API key must be included in every request header:

```http
X-API-Key: your-api-key-here
```

## Getting Started

### 1. Prerequisites

- Valid API key (obtain from `/api-keys/generate`)
- Hotel ID from your PMS system
- Channel-specific credentials (API keys, secrets, etc.)

### 2. Implementation Flow

1. **Create Channel Integration** - Set up connection to OTA
2. **Create Room Mappings** - Map PMS room types to channel room types
3. **Configure Rate Plans** - Set up pricing structures
4. **Sync Availability** - Push room availability to channels
5. **Handle Bookings** - Process incoming reservations

### 3. Channel-Specific Requirements

Each channel has different requirements and capabilities:

#### Booking.com

- Requires: API Key, API Secret, Property ID
- Features: Real-time sync, webhooks, multi-currency
- Rate Limits: 1000 requests/hour

#### Expedia

- Requires: API Key, API Secret, Property ID
- Features: XML API, inventory sync, guest management
- Rate Limits: 500 requests/hour

#### Airbnb

- Requires: Access Token, Property ID
- Features: Calendar sync, instant booking, guest communication
- Rate Limits: 200 requests/hour

### 4. Error Handling Best Practices

- Always check HTTP status codes
- Implement retry logic for 5xx errors
- Log error details for debugging
- Handle rate limiting gracefully

## API Endpoints

### 1. Channel Integration Management

#### Create Channel Integration

```http
POST /integrations
Content-Type: application/json
X-API-Key: your-api-key

{
  "hotelId": 1,
  "channelType": "BOOKING_COM",
  "channelName": "Booking.com Integration",
  "apiKey": "your-api-key",
  "apiSecret": "your-api-secret",
  "channelPropertyId": "property-123",
  "isWebhookEnabled": true,
  "syncIntervalMinutes": 15,
  "isRealTimeSync": true,
  "testMode": false,
  "supportedFeatures": ["availability", "rates", "bookings"]
}
```

**Response:**

```json
{
  "id": 1,
  "hotelId": 1,
  "channelType": "BOOKING_COM",
  "channelName": "Booking.com Integration",
  "status": "PENDING",
  "apiKey": "your-api-key",
  "channelPropertyId": "property-123",
  "isWebhookEnabled": true,
  "syncIntervalMinutes": 15,
  "isRealTimeSync": true,
  "testMode": false,
  "supportedFeatures": ["availability", "rates", "bookings"],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Get Channel Integrations

```http
GET /integrations?hotelId=1
X-API-Key: your-api-key
```

#### Get Single Integration

```http
GET /integrations/1
X-API-Key: your-api-key
```

#### Update Integration

```http
PUT /integrations/1
Content-Type: application/json
X-API-Key: your-api-key

{
  "status": "ACTIVE",
  "syncIntervalMinutes": 30
}
```

#### Delete Integration

```http
DELETE /integrations/1
X-API-Key: your-api-key
```

#### Get Available Integration Types

```http
GET /integrations/available-types/1
X-API-Key: your-api-key
```

### 2. Channel Mapping Management

#### Create Channel Mapping

```http
POST /mappings
Content-Type: application/json
X-API-Key: your-api-key

{
  "integrationId": 1,
  "roomtypeId": 1,
  "channelRoomTypeId": "room-type-123",
  "channelRoomTypeName": "Deluxe Room",
  "channelRatePlanId": "rate-plan-123",
  "channelRatePlanName": "Standard Rate",
  "channelAmenities": ["WiFi", "Breakfast", "Pool"],
  "channelDescription": "Spacious deluxe room with city view",
  "channelImages": ["image1.jpg", "image2.jpg"],
  "isActive": true
}
```

#### Get Channel Mappings

```http
GET /integrations/1/mappings
X-API-Key: your-api-key
```

#### Update Channel Mapping

```http
PUT /mappings/1
Content-Type: application/json
X-API-Key: your-api-key

{
  "isActive": false,
  "channelDescription": "Updated room description"
}
```

### 3. Availability Management

#### Sync Availability

```http
POST /availability/sync
Content-Type: application/json
X-API-Key: your-api-key

{
  "integrationId": 1,
  "roomtypeId": 1,
  "date": "2024-01-15",
  "status": "AVAILABLE",
  "availableRooms": 5,
  "totalRooms": 10,
  "rate": 150.00,
  "currency": "USD",
  "isClosed": false
}
```

#### Get Availability by Date Range

```http
GET /availability?integrationId=1&roomtypeId=1&startDate=2024-01-01&endDate=2024-01-31
X-API-Key: your-api-key
```

### 4. Rate Plan Management

#### Create Rate Plan

```http
POST /rate-plans
Content-Type: application/json
X-API-Key: your-api-key

{
  "integrationId": 1,
  "roomtypeId": 1,
  "channelRatePlanId": "rate-plan-123",
  "channelRatePlanName": "Standard Rate",
  "ratePlanType": "STANDARD",
  "baseRate": 150.00,
  "currency": "USD",
  "minStay": 1,
  "maxStay": 30,
  "cancellationPolicy": "Free cancellation until 24 hours before check-in"
}
```

#### Get Rate Plans

```http
GET /integrations/1/rate-plans
X-API-Key: your-api-key
```

### 5. Sync Management

#### Trigger Manual Sync

```http
POST /integrations/1/sync
Content-Type: application/json
X-API-Key: your-api-key

{
  "operationType": "FULL_SYNC"
}
```

#### Get Sync Logs

```http
GET /integrations/1/sync-logs?limit=100
X-API-Key: your-api-key
```

#### Get Sync Statistics

```http
GET /integrations/1/sync-statistics?days=7
X-API-Key: your-api-key
```

### 6. Testing and Validation

#### Test Channel Integration

```http
POST /integrations/1/test
X-API-Key: your-api-key
```

**Response:**

```json
{
  "success": true
}
```

### 7. Channel Information

#### Get Supported Channels

```http
GET /channels/supported
X-API-Key: your-api-key
```

#### Get Channel Features

```http
GET /channels/BOOKING_COM/features
X-API-Key: your-api-key
```

### 8. Guest Management

#### Handle Guest Check-in

```http
POST /guests/123/check-in
X-API-Key: your-api-key
```

#### Handle Guest Check-out

```http
POST /guests/123/check-out
X-API-Key: your-api-key
```

### 9. Dashboard and Analytics

#### Get Dashboard Summary

```http
GET /dashboard/summary?hotelId=1
X-API-Key: your-api-key
```

#### Get Performance Metrics

```http
GET /dashboard/performance?hotelId=1&days=30
X-API-Key: your-api-key
```

## API Key Management

### Create API Key

```http
POST /api-keys
Content-Type: application/json
X-API-Key: your-api-key

{
  "name": "Channel Manager API Key",
  "description": "API key for channel manager operations",
  "permission": "READ_WRITE",
  "expiresAt": "2025-01-01T00:00:00.000Z"
}
```

### Generate API Key

```http
GET /api-keys/generate
X-API-Key: your-api-key
```

### Validate API Key

```http
GET /api-keys/validate/your-api-key
```

### Get API Key Info

```http
GET /api-keys/info
X-API-Key: your-api-key
```

## OTA Configuration Management

### Get All Configurations

```http
GET /ota-configurations
X-API-Key: your-api-key
```

### Get Configuration by Channel Type

```http
GET /ota-configurations/BOOKING_COM
X-API-Key: your-api-key
```

### Create Configuration

```http
POST /ota-configurations
Content-Type: application/json
X-API-Key: your-api-key

{
  "channelType": "BOOKING_COM",
  "apiKey": "your-api-key",
  "apiSecret": "your-api-secret",
  "baseUrl": "https://api.booking.com",
  "isActive": true
}
```

### Update Configuration

```http
PUT /ota-configurations/BOOKING_COM
Content-Type: application/json
X-API-Key: your-api-key

{
  "isActive": false
}
```

### Test Configuration

```http
POST /ota-configurations/BOOKING_COM/test
X-API-Key: your-api-key
```

### Delete Configuration

```http
DELETE /ota-configurations/BOOKING_COM
X-API-Key: your-api-key
```

## Data Models

### Channel Integration

```typescript
interface ChannelIntegration {
  id: number;
  hotelId: number;
  channelType: ChannelType;
  channelName: string;
  status: IntegrationStatus;
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  channelPropertyId?: string;
  channelUsername?: string;
  channelPassword?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  isWebhookEnabled: boolean;
  syncIntervalMinutes: number;
  isRealTimeSync: boolean;
  lastSyncAt?: Date;
  lastSuccessfulSync?: Date;
  errorMessage?: string;
  testMode?: boolean;
  channelSettings?: Record<string, any>;
  supportedFeatures?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: number;
  updatedBy?: number;
}
```

### Channel Mapping

```typescript
interface ChannelMapping {
  id: number;
  integrationId: number;
  roomtypeId: number;
  channelRoomTypeId: string;
  channelRoomTypeName: string;
  channelRatePlanId?: string;
  channelRatePlanName?: string;
  channelAmenities?: string[];
  channelDescription?: string;
  channelImages?: string[];
  isActive: boolean;
  mappingRules?: Record<string, any>;
  customFields?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: number;
  updatedBy?: number;
}
```

### Channel Availability

```typescript
interface ChannelAvailability {
  id: number;
  integrationId: number;
  roomtypeId: number;
  date: Date;
  status: AvailabilityStatus;
  availableRooms: number;
  totalRooms: number;
  occupiedRooms: number;
  blockedRooms: number;
  maintenanceRooms: number;
  rate?: number;
  currency?: string;
  isClosed: boolean;
  closeReason?: string;
  restrictions?: Record<string, any>;
  channelData?: Record<string, any>;
  isSynced: boolean;
  lastSyncedAt?: Date;
  syncStatus?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: number;
  updatedBy?: number;
}
```

## Enums

### ChannelType

```typescript
enum ChannelType {
  BOOKING_COM = "BOOKING_COM",
  EXPEDIA = "EXPEDIA",
  AIRBNB = "AIRBNB",
  HOTELS_COM = "HOTELS_COM",
  TRIPADVISOR = "TRIPADVISOR",
  AGODA = "AGODA",
  HOTELBEDS = "HOTELBEDS",
  CUSTOM = "CUSTOM",
}
```

### IntegrationStatus

```typescript
enum IntegrationStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ERROR = "ERROR",
  PENDING = "PENDING",
  TESTING = "TESTING",
}
```

### AvailabilityStatus

```typescript
enum AvailabilityStatus {
  AVAILABLE = "AVAILABLE",
  UNAVAILABLE = "UNAVAILABLE",
  OCCUPIED = "OCCUPIED",
  MAINTENANCE = "MAINTENANCE",
  BLOCKED = "BLOCKED",
}
```

### SyncOperationType

```typescript
enum SyncOperationType {
  INVENTORY_UPDATE = "INVENTORY_UPDATE",
  RATE_UPDATE = "RATE_UPDATE",
  AVAILABILITY_UPDATE = "AVAILABILITY_UPDATE",
  BOOKING_CREATE = "BOOKING_CREATE",
  BOOKING_UPDATE = "BOOKING_UPDATE",
  BOOKING_CANCEL = "BOOKING_CANCEL",
  MAPPING_UPDATE = "MAPPING_UPDATE",
  FULL_SYNC = "FULL_SYNC",
}
```

## Error Handling

### Standard Error Response

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "property": "hotelId",
      "constraints": {
        "isNotEmpty": "hotelId should not be empty"
      }
    }
  ]
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Rate Limiting

- Default rate limit: 1000 requests per hour per API key
- Burst limit: 100 requests per minute
- Rate limit headers included in responses:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## Webhooks

The API supports webhook notifications for real-time updates. Configure webhook URLs in channel integrations to receive:

- Booking notifications
- Availability updates
- Rate changes
- Sync status updates

## Testing

Use the test endpoints to validate channel integrations before going live:

- Test API connectivity
- Validate credentials
- Check data synchronization
- Verify webhook functionality

## Implementation Examples

### Complete Integration Setup Example

Here's a step-by-step example of setting up a Booking.com integration:

#### 1. Generate API Key

```bash
curl -X GET "http://localhost:4000/api/v1/channel-manager/api-keys/generate" \
  -H "X-API-Key: your-admin-key"
```

#### 2. Create Channel Integration

```bash
curl -X POST "http://localhost:4000/api/v1/channel-manager/integrations" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "hotelId": 1,
    "channelType": "BOOKING_COM",
    "channelName": "Main Booking.com Integration",
    "apiKey": "your-booking-api-key",
    "apiSecret": "your-booking-api-secret",
    "channelPropertyId": "property-123",
    "isWebhookEnabled": true,
    "syncIntervalMinutes": 15,
    "isRealTimeSync": true,
    "testMode": true
  }'
```

#### 3. Create Room Mapping

```bash
curl -X POST "http://localhost:4000/api/v1/channel-manager/mappings" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "integrationId": 1,
    "roomtypeId": 1,
    "channelRoomTypeId": "deluxe-room-123",
    "channelRoomTypeName": "Deluxe Room",
    "channelRatePlanId": "standard-rate-123",
    "channelRatePlanName": "Standard Rate",
    "channelAmenities": ["WiFi", "Breakfast", "Pool"],
    "isActive": true
  }'
```

#### 4. Sync Availability

```bash
curl -X POST "http://localhost:4000/api/v1/channel-manager/availability/sync" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "integrationId": 1,
    "roomtypeId": 1,
    "date": "2024-01-15",
    "status": "AVAILABLE",
    "availableRooms": 5,
    "totalRooms": 10,
    "rate": 150.00,
    "currency": "USD"
  }'
```

#### 5. Test Integration

```bash
curl -X POST "http://localhost:4000/api/v1/channel-manager/integrations/1/test" \
  -H "X-API-Key: your-api-key"
```

### Common Use Cases

#### Daily Availability Sync

```javascript
// Sync availability for next 30 days
const today = new Date();
const endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
  await fetch("/channel-manager/availability/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": "your-api-key",
    },
    body: JSON.stringify({
      integrationId: 1,
      roomtypeId: 1,
      date: d.toISOString().split("T")[0],
      status: "AVAILABLE",
      availableRooms: 5,
      totalRooms: 10,
      rate: 150.0,
      currency: "USD",
    }),
  });
}
```

#### Handle Booking Webhook

```javascript
// Webhook endpoint to handle incoming bookings
app.post("/webhook/booking", (req, res) => {
  const { integrationId, bookingData } = req.body;

  // Process booking in your PMS
  processBooking(bookingData);

  // Update availability
  updateAvailability(
    integrationId,
    bookingData.roomTypeId,
    bookingData.checkIn,
    bookingData.checkOut
  );

  res.status(200).send("OK");
});
```

#### Rate Update Automation

```javascript
// Update rates based on demand
async function updateRates(integrationId, roomTypeId, newRate) {
  const response = await fetch(
    `/channel-manager/integrations/${integrationId}/rate-plans`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": "your-api-key",
      },
      body: JSON.stringify({
        integrationId,
        roomtypeId: roomTypeId,
        channelRatePlanId: "rate-plan-123",
        channelRatePlanName: "Dynamic Rate",
        baseRate: newRate,
        currency: "USD",
        isActive: true,
      }),
    }
  );

  return response.json();
}
```

## Troubleshooting

### Common Issues

#### 1. Authentication Errors

- **Error:** `401 Unauthorized`
- **Solution:** Verify API key is correct and included in headers
- **Check:** API key hasn't expired

#### 2. Integration Test Failures

- **Error:** `400 Bad Request - Integration test failed`
- **Solution:** Verify channel credentials are correct
- **Check:** Channel API is accessible and credentials are valid

#### 3. Sync Failures

- **Error:** `500 Internal Server Error`
- **Solution:** Check channel API rate limits
- **Check:** Verify room mappings are correct

#### 4. Webhook Issues

- **Error:** Webhooks not received
- **Solution:** Verify webhook URL is accessible
- **Check:** Webhook secret is configured correctly

### Debug Mode

Enable debug logging by setting the `DEBUG` environment variable:

```bash
DEBUG=channel-manager:* npm start
```

### Health Check

Check API health:

```bash
curl -X GET "http://localhost:4000/api/v1/channel-manager/health" \
  -H "X-API-Key: your-api-key"
```

## Quick Reference

### Essential Endpoints

| Operation          | Method | Endpoint                       | Description                   |
| ------------------ | ------ | ------------------------------ | ----------------------------- |
| Create Integration | POST   | `/integrations`                | Set up new channel connection |
| Get Integrations   | GET    | `/integrations?hotelId=1`      | List hotel integrations       |
| Create Mapping     | POST   | `/mappings`                    | Map PMS room to channel room  |
| Sync Availability  | POST   | `/availability/sync`           | Update room availability      |
| Test Integration   | POST   | `/integrations/{id}/test`      | Validate connection           |
| Get Dashboard      | GET    | `/dashboard/summary?hotelId=1` | View integration status       |

### Required Headers

```http
Content-Type: application/json
X-API-Key: your-api-key-here
```

### Common Response Codes

- `200` - Success
- `201` - Created successfully
- `400` - Bad request (check request body)
- `401` - Unauthorized (check API key)
- `404` - Resource not found
- `409` - Conflict (duplicate integration)
- `500` - Server error

## SDK Examples

### JavaScript/Node.js

```javascript
class ChannelManagerClient {
  constructor(
    apiKey,
    baseUrl = "http://localhost:4000/api/v1/channel-manager"
  ) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async request(method, endpoint, data = null) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": this.apiKey,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Channel Integration methods
  async createIntegration(integrationData) {
    return this.request("POST", "/integrations", integrationData);
  }

  async getIntegrations(hotelId) {
    return this.request("GET", `/integrations?hotelId=${hotelId}`);
  }

  async testIntegration(integrationId) {
    return this.request("POST", `/integrations/${integrationId}/test`);
  }

  // Availability methods
  async syncAvailability(availabilityData) {
    return this.request("POST", "/availability/sync", availabilityData);
  }

  async getAvailability(integrationId, roomtypeId, startDate, endDate) {
    return this.request(
      "GET",
      `/availability?integrationId=${integrationId}&roomtypeId=${roomtypeId}&startDate=${startDate}&endDate=${endDate}`
    );
  }
}

// Usage example
const client = new ChannelManagerClient("your-api-key");

// Create integration
const integration = await client.createIntegration({
  hotelId: 1,
  channelType: "BOOKING_COM",
  channelName: "Main Integration",
  apiKey: "booking-api-key",
  apiSecret: "booking-api-secret",
});

// Sync availability
await client.syncAvailability({
  integrationId: integration.id,
  roomtypeId: 1,
  date: "2024-01-15",
  status: "AVAILABLE",
  availableRooms: 5,
  totalRooms: 10,
  rate: 150.0,
  currency: "USD",
});
```

### Python

```python
import requests
import json

class ChannelManagerClient:
    def __init__(self, api_key, base_url='http://localhost:4000/api/v1/channel-manager'):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            'Content-Type': 'application/json',
            'X-API-Key': api_key
        }

    def request(self, method, endpoint, data=None):
        url = f"{self.base_url}{endpoint}"
        response = requests.request(method, url, headers=self.headers, json=data)

        if not response.ok:
            raise Exception(f"API Error: {response.status_code} {response.text}")

        return response.json()

    def create_integration(self, integration_data):
        return self.request('POST', '/integrations', integration_data)

    def get_integrations(self, hotel_id):
        return self.request('GET', f'/integrations?hotelId={hotel_id}')

    def sync_availability(self, availability_data):
        return self.request('POST', '/availability/sync', availability_data)

# Usage example
client = ChannelManagerClient('your-api-key')

# Create integration
integration = client.create_integration({
    'hotelId': 1,
    'channelType': 'BOOKING_COM',
    'channelName': 'Main Integration',
    'apiKey': 'booking-api-key',
    'apiSecret': 'booking-api-secret'
})

# Sync availability
client.sync_availability({
    'integrationId': integration['id'],
    'roomtypeId': 1,
    'date': '2024-01-15',
    'status': 'AVAILABLE',
    'availableRooms': 5,
    'totalRooms': 10,
    'rate': 150.00,
    'currency': 'USD'
})
```

### PHP

```php
<?php
class ChannelManagerClient {
    private $apiKey;
    private $baseUrl;

    public function __construct($apiKey, $baseUrl = 'http://localhost:4000/api/v1/channel-manager') {
        $this->apiKey = $apiKey;
        $this->baseUrl = $baseUrl;
    }

    private function request($method, $endpoint, $data = null) {
        $url = $this->baseUrl . $endpoint;
        $headers = [
            'Content-Type: application/json',
            'X-API-Key: ' . $this->apiKey
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode >= 400) {
            throw new Exception("API Error: $httpCode $response");
        }

        return json_decode($response, true);
    }

    public function createIntegration($integrationData) {
        return $this->request('POST', '/integrations', $integrationData);
    }

    public function getIntegrations($hotelId) {
        return $this->request('GET', "/integrations?hotelId=$hotelId");
    }

    public function syncAvailability($availabilityData) {
        return $this->request('POST', '/availability/sync', $availabilityData);
    }
}

// Usage example
$client = new ChannelManagerClient('your-api-key');

// Create integration
$integration = $client->createIntegration([
    'hotelId' => 1,
    'channelType' => 'BOOKING_COM',
    'channelName' => 'Main Integration',
    'apiKey' => 'booking-api-key',
    'apiSecret' => 'booking-api-secret'
]);

// Sync availability
$client->syncAvailability([
    'integrationId' => $integration['id'],
    'roomtypeId' => 1,
    'date' => '2024-01-15',
    'status' => 'AVAILABLE',
    'availableRooms' => 5,
    'totalRooms' => 10,
    'rate' => 150.00,
    'currency' => 'USD'
]);
?>
```

## Support

For technical support or questions:

- Check the logs for detailed error messages
- Use the test endpoints to validate configurations
- Review the sync logs for troubleshooting sync issues
- Contact the development team with specific error details
