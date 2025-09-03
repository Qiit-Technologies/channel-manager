# API Key Authentication Examples

## Quick Start

### 1. Set Your Master API Key

```bash
# In your .env file
CHANNEL_MANAGER_API_KEY=cm_$(date +%s)_$(openssl rand -hex 16)
```

### 2. Test Authentication

```bash
# Test with Authorization header
curl -H "Authorization: Bearer your_api_key_here" \
     http://localhost:3001/api/v1/api-keys/info

# Test with X-API-Key header
curl -H "X-API-Key: your_api_key_here" \
     http://localhost:3001/api/v1/api-keys/info

# Test with query parameter
curl "http://localhost:3001/api/v1/api-keys/info?apiKey=your_api_key_here"
```

## Integration Examples

### JavaScript/Node.js

```javascript
const axios = require("axios");

const API_KEY = "your_api_key_here";
const BASE_URL = "http://localhost:3001/api/v1";

// Create channel integration
async function createIntegration() {
  try {
    const response = await axios.post(
      `${BASE_URL}/channel-integrations`,
      {
        hotelId: 1,
        channelType: "AIRBNB",
        channelName: "Airbnb Integration",
        apiKey: "airbnb_api_key",
        apiSecret: "airbnb_api_secret",
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Integration created:", response.data);
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

// Create Hotelbeds integration
async function createHotelbedsIntegration() {
  try {
    const response = await axios.post(
      `${BASE_URL}/channel-integrations`,
      {
        hotelId: 1,
        channelType: "HOTELBEDS",
        channelName: "Hotelbeds Integration",
        apiKey: "hotelbeds_api_key",
        apiSecret: "hotelbeds_api_secret",
        channelPropertyId: "12345",
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Hotelbeds integration created:", response.data);
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

// Get channel integrations
async function getIntegrations() {
  try {
    const response = await axios.get(`${BASE_URL}/channel-integrations/1`, {
      headers: {
        "X-API-Key": API_KEY,
      },
    });

    console.log("Integrations:", response.data);
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}
```

### Python

```python
import requests

API_KEY = 'your_api_key_here'
BASE_URL = 'http://localhost:3001/api/v1'

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

# Create channel integration
def create_integration():
    data = {
        'hotelId': 1,
        'channelType': 'AIRBNB',
        'channelName': 'Airbnb Integration',
        'apiKey': 'airbnb_api_key',
        'apiSecret': 'airbnb_api_secret'
    }

    response = requests.post(
        f'{BASE_URL}/channel-integrations',
        json=data,
        headers=headers
    )

    if response.status_code == 200:
        print('Integration created:', response.json())
    else:
        print('Error:', response.json())

# Create Hotelbeds integration
def create_hotelbeds_integration():
    data = {
        'hotelId': 1,
        'channelType': 'HOTELBEDS',
        'channelName': 'Hotelbeds Integration',
        'apiKey': 'hotelbeds_api_key',
        'apiSecret': 'hotelbeds_api_secret',
        'channelPropertyId': '12345'
    }

    response = requests.post(
        f'{BASE_URL}/channel-integrations',
        json=data,
        headers=headers
    )

    if response.status_code == 200:
        print('Hotelbeds integration created:', response.json())
    else:
        print('Error:', response.json())

# Get channel integrations
def get_integrations():
    response = requests.get(
        f'{BASE_URL}/channel-integrations/1',
        headers={'X-API-Key': API_KEY}
    )

    if response.status_code == 200:
        print('Integrations:', response.json())
    else:
        print('Error:', response.json())
```

### cURL Examples

```bash
# Create channel integration
curl -X POST \
  -H "Authorization: Bearer your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "hotelId": 1,
    "channelType": "AIRBNB",
    "channelName": "Airbnb Integration",
    "apiKey": "airbnb_api_key",
    "apiSecret": "airbnb_api_secret"
  }' \
  http://localhost:3001/api/v1/channel-integrations

# Create Hotelbeds integration
curl -X POST \
  -H "Authorization: Bearer your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "hotelId": 1,
    "channelType": "HOTELBEDS",
    "channelName": "Hotelbeds Integration",
    "apiKey": "hotelbeds_api_key",
    "apiSecret": "hotelbeds_api_secret",
    "channelPropertyId": "12345"
  }' \
  http://localhost:3001/api/v1/channel-integrations

# Get channel integrations
curl -H "X-API-Key: your_api_key_here" \
     http://localhost:3001/api/v1/channel-integrations/1

# Sync availability
curl -X POST \
  -H "Authorization: Bearer your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "integrationId": 1,
    "roomtypeId": 1,
    "date": "2024-01-15",
    "totalRooms": 10,
    "availableRooms": 8,
    "occupiedRooms": 2
  }' \
  http://localhost:3001/api/v1/availability/sync

# Trigger manual sync
curl -X POST \
  -H "X-API-Key: your_api_key_here" \
  http://localhost:3001/api/v1/sync/1/FULL_SYNC
```

## Error Handling

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "API key is required for this endpoint",
  "error": "Unauthorized"
}
```

### 401 Invalid API Key

```json
{
  "statusCode": 401,
  "message": "Invalid API key",
  "error": "Unauthorized"
}
```

## Security Best Practices

1. **Use HTTPS in Production**: Always use HTTPS for production deployments
2. **Rotate API Keys**: Regularly rotate your API keys
3. **Store Securely**: Never commit API keys to version control
4. **Use Environment Variables**: Store API keys in environment variables
5. **Monitor Usage**: Track API key usage for security monitoring
6. **IP Whitelisting**: Restrict access to known IP addresses when possible

## Development vs Production

### Development Mode

- No API key required when `CHANNEL_MANAGER_API_KEY` is not set
- All endpoints accessible without authentication
- Useful for local development and testing

### Production Mode

- API key required for all protected endpoints
- Strict authentication enforced
- Enhanced security features enabled 