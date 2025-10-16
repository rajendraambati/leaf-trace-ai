# Logistics API Documentation

Complete API reference for TobaccoTrace logistics operations including vehicle assignment, tracking updates, status retrieval, and AI optimization.

## Base URL
```
https://syhqhdyvyahutymbzllg.supabase.co/functions/v1
```

## Authentication
Most endpoints require JWT authentication via the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 1. Vehicle Assignment

**Endpoint:** `POST /logistics-batch-assign`

**Description:** Assign a vehicle and driver to a tobacco batch for transport.

**Authentication:** Required (logistics_manager, auditor, admin roles)

**Request Body:**
```json
{
  "batch_id": "BATCH-1760511830780",
  "vehicle_id": "TRK-001",
  "driver_name": "John Doe",
  "from_location": "Warehouse A",
  "to_location": "Processing Plant B",
  "departure_time": "2025-10-16T10:00:00Z",
  "eta": "2025-10-16T14:00:00Z",
  "route_data": {
    "distance_km": 120,
    "estimated_fuel": 25.5
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Vehicle assigned successfully",
  "data": {
    "shipment_id": "SHIP-1760626478123",
    "batch_id": "BATCH-1760511830780",
    "vehicle_id": "TRK-001",
    "driver_name": "John Doe",
    "status": "assigned",
    "departure_time": "2025-10-16T10:00:00Z",
    "eta": "2025-10-16T14:00:00Z"
  }
}
```

**Audit Log:** Creates entry with `vehicle_assignment` action

---

## 2. Tracking Update

**Endpoint:** `PUT /logistics-track-update`

**Description:** Update shipment tracking data including GPS, temperature, and IoT device info.

**Authentication:** Required

**Request Body:**
```json
{
  "shipment_id": "SHIP-1760626478123",
  "gps_latitude": 17.4532,
  "gps_longitude": 78.3904,
  "temperature_min": 18.5,
  "temperature_max": 22.3,
  "status": "in_transit",
  "device_id": "GPS-001",
  "battery_level": 85,
  "signal_strength": 92
}
```

**Optional Fields:**
- `delivery_timestamp`: ISO timestamp for delivery confirmation
- `device_id`: IoT device identifier
- `battery_level`: Device battery percentage (0-100)
- `signal_strength`: Signal strength percentage (0-100)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Tracking data updated successfully",
  "data": {
    "shipment_id": "SHIP-1760626478123",
    "status": "in_transit",
    "gps_location": {
      "latitude": 17.4532,
      "longitude": 78.3904
    },
    "temperature": {
      "min": 18.5,
      "max": 22.3
    },
    "updated_at": "2025-10-16T12:30:00Z"
  }
}
```

**Audit Log:** Creates entry with `tracking_update` action including device data

---

## 3. Batch Status

**Endpoint:** `GET /logistics-batch-status`

**Description:** Retrieve detailed status information for a batch or shipment including GPS, temperature, and quality data.

**Authentication:** Required

**Query Parameters:**
- `batch_id` (optional): Procurement batch ID
- `shipment_id` (optional): Shipment ID

**Note:** At least one parameter is required.

**Request Example:**
```
GET /logistics-batch-status?batch_id=BATCH-1760511830780
GET /logistics-batch-status?shipment_id=SHIP-1760626478123
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Shipment status retrieved successfully",
  "data": {
    "batch": {
      "id": "BATCH-1760511830780",
      "farmer_id": "6afd94d2-af3b-4193-b060-e7348e61f209",
      "quantity_kg": 30.00,
      "grade": "Standard",
      "status": "pending",
      "procurement_date": "2025-10-15T07:03:53Z"
    },
    "shipments": [
      {
        "shipment_id": "SHIP-1760626478123",
        "batch_id": "BATCH-1760511830780",
        "vehicle_id": "TRK-001",
        "driver_name": "John Doe",
        "status": "in_transit",
        "route": {
          "from": "Warehouse A",
          "to": "Processing Plant B"
        },
        "gps_location": {
          "latitude": 17.4532,
          "longitude": 78.3904
        },
        "temperature": {
          "min": 18.5,
          "max": 22.3
        },
        "timeline": {
          "departure": "2025-10-16T10:00:00Z",
          "eta": "2025-10-16T14:00:00Z",
          "actual_arrival": null,
          "created_at": "2025-10-16T09:45:00Z",
          "updated_at": "2025-10-16T12:30:00Z"
        },
        "quality_data": {
          "grade": "Premium",
          "moisture_content": 12.5,
          "nicotine_level": 2.1,
          "test_date": "2025-10-15T08:00:00Z"
        }
      }
    ],
    "total_shipments": 1
  }
}
```

---

## 4. AI Optimization

**Endpoint:** `POST /logistics-ai-optimization`

**Description:** Use AI to optimize routes, detect anomalies, or predict delays.

**Authentication:** Optional (public endpoint)

### 4.1 Route Prediction

**Request Body:**
```json
{
  "type": "route_prediction",
  "origin": {
    "lat": 17.4,
    "lng": 78.4,
    "name": "Warehouse A"
  },
  "destination": {
    "lat": 17.5,
    "lng": 78.5,
    "name": "Processing Plant"
  },
  "weather_conditions": "Clear",
  "road_conditions": "Normal",
  "fuel_cost_per_km": 1.5
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "recommended_route": [
      {
        "waypoint": "Highway Junction A",
        "distance_km": 45,
        "estimated_time_minutes": 60
      },
      {
        "waypoint": "City Bypass",
        "distance_km": 75,
        "estimated_time_minutes": 90
      }
    ],
    "total_distance_km": 120,
    "estimated_fuel_cost": 180.00,
    "estimated_time_hours": 2.5,
    "risk_factors": [
      "Minor traffic expected on Highway Junction A",
      "Weather conditions favorable"
    ],
    "recommendations": [
      "Depart before 8 AM to avoid traffic",
      "Fuel up at Junction A (cheaper prices)"
    ]
  }
}
```

### 4.2 Anomaly Detection

**Request Body:**
```json
{
  "type": "anomaly_detection",
  "shipment_id": "SHIP-1760626478123",
  "current_location": {
    "lat": 17.45,
    "lng": 78.45
  },
  "scheduled_checkpoints": [
    { "name": "Checkpoint A", "lat": 17.42, "lng": 78.41 },
    { "name": "Checkpoint B", "lat": 17.48, "lng": 78.48 }
  ],
  "actual_route": [
    { "lat": 17.4, "lng": 78.4, "timestamp": "2025-10-16T10:00:00Z" },
    { "lat": 17.45, "lng": 78.45, "timestamp": "2025-10-16T12:00:00Z" }
  ],
  "weather_conditions": "Clear"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "anomalies": [
      {
        "type": "route_deviation",
        "severity": "HIGH",
        "description": "Vehicle deviated 5km from planned route",
        "recommendation": "Contact driver to verify alternate route reason"
      },
      {
        "type": "missed_checkpoint",
        "severity": "MEDIUM",
        "description": "Checkpoint A was bypassed",
        "recommendation": "Verify checkpoint scan or investigate reason"
      }
    ],
    "overall_risk": "HIGH",
    "requires_immediate_action": true
  }
}
```

**Auto-alerts:** HIGH/CRITICAL anomalies automatically create IoT events.

### 4.3 Delay Prediction

**Request Body:**
```json
{
  "type": "delay_prediction",
  "shipment_id": "SHIP-1760626478123",
  "current_location": {
    "lat": 17.45,
    "lng": 78.45
  },
  "destination": {
    "lat": 17.5,
    "lng": 78.5,
    "name": "Processing Plant"
  },
  "weather_conditions": "Rainy",
  "road_conditions": "Traffic"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "delay_probability": 0.75,
    "estimated_delay_minutes": 45,
    "updated_eta": "2025-10-16T14:45:00Z",
    "confidence_level": "HIGH",
    "factors": [
      "Heavy rain reducing average speed by 20%",
      "Traffic congestion on main route",
      "Driver behind schedule by 30 minutes"
    ],
    "recommendations": [
      "Notify recipient of 45-minute delay",
      "Consider alternate route via City Bypass",
      "Monitor weather updates for route changes"
    ]
  }
}
```

---

## 5. IoT Event Handler

**Endpoint:** `POST /mqtt-handler`

**Description:** Process IoT device events (MQTT protocol) including GPS updates, temperature alerts, and checkpoint scans.

**Authentication:** Not required (service-to-service)

**Request Body:**
```json
{
  "device_id": "GPS-001",
  "shipment_id": "SHIP-1760626478123",
  "event_type": "checkpoint",
  "event_data": {
    "checkpoint_name": "Junction A",
    "scan_time": "2025-10-16T11:30:00Z",
    "verified": true
  },
  "gps_latitude": 17.42,
  "gps_longitude": 78.41,
  "temperature": 20.5,
  "battery_level": 85,
  "signal_strength": 92
}
```

**Event Types:**
- `departure`: Vehicle departed from origin
- `checkpoint`: Passed through checkpoint
- `arrival`: Arrived at destination
- `inspection`: Quality inspection performed
- `temperature_alert`: Temperature threshold exceeded
- `gps_update`: GPS location update
- `qr_scan`: QR code scanned
- `sensor_reading`: General sensor data

**Response:**
```json
{
  "success": true,
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Event checkpoint processed successfully",
  "device_id": "GPS-001",
  "timestamp": "2025-10-16T11:30:00Z"
}
```

**Auto-processing:**
- Updates shipment status based on event type
- Updates GPS coordinates in real-time
- Logs temperature readings
- Triggers device last_ping update

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields",
  "required": ["batch_id", "vehicle_id", "driver_name"]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Batch not found"
}
```

### 429 Rate Limit
```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```

### 402 Payment Required
```json
{
  "error": "Payment required. Please add credits to your workspace."
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to create shipment",
  "details": "Detailed error message"
}
```

---

## Database Tables

### shipments
Stores shipment tracking information with GPS and temperature data.

### iot_devices
Registered IoT devices (GPS trackers, QR scanners, sensors) with status and battery info.

### iot_events
Event log for all IoT device activities with automatic device ping updates.

### ai_usage_analytics
Logs all AI optimization requests for monitoring and analytics.

---

## Workflow Examples

### Complete Logistics Workflow

1. **Create Shipment:**
```bash
POST /logistics-batch-assign
{
  "batch_id": "BATCH-123",
  "vehicle_id": "TRK-001",
  "driver_name": "John",
  "from_location": "Warehouse",
  "to_location": "Plant"
}
```

2. **Get AI Route Optimization:**
```bash
POST /logistics-ai-optimization
{
  "type": "route_prediction",
  "origin": {...},
  "destination": {...}
}
```

3. **IoT Device Sends Departure Event:**
```bash
POST /mqtt-handler
{
  "device_id": "GPS-001",
  "shipment_id": "SHIP-123",
  "event_type": "departure",
  "gps_latitude": 17.4,
  "gps_longitude": 78.4
}
```

4. **Track Progress:**
```bash
PUT /logistics-track-update
{
  "shipment_id": "SHIP-123",
  "gps_latitude": 17.45,
  "gps_longitude": 78.45,
  "temperature_min": 19,
  "temperature_max": 23
}
```

5. **Check for Anomalies:**
```bash
POST /logistics-ai-optimization
{
  "type": "anomaly_detection",
  "shipment_id": "SHIP-123",
  "current_location": {...}
}
```

6. **Get Status:**
```bash
GET /logistics-batch-status?shipment_id=SHIP-123
```

7. **Confirm Delivery:**
```bash
PUT /logistics-track-update
{
  "shipment_id": "SHIP-123",
  "status": "delivered",
  "delivery_timestamp": "2025-10-16T14:00:00Z"
}
```

---

## Rate Limits

- **Standard Endpoints:** 60 requests/minute per user
- **AI Endpoints:** 20 requests/minute per workspace
- **IoT Handler:** 1000 events/minute

---

## Best Practices

1. **Batch Updates**: Use tracking updates for bulk GPS/temperature data
2. **AI Optimization**: Run route prediction before departure
3. **Anomaly Detection**: Enable auto-monitoring for critical shipments
4. **Error Handling**: Implement retry logic for 429/500 errors
5. **Real-time Sync**: Subscribe to Supabase realtime for live updates
6. **Audit Logging**: All operations automatically logged for compliance

---

## SDK Integration

### React Hook Example
```typescript
import { useLogisticsAI } from "@/hooks/useLogisticsAI";

const { predictRoute, detectAnomalies, predictDelay } = useLogisticsAI();

// Predict optimal route
const routeResult = await predictRoute({
  origin: { lat: 17.4, lng: 78.4, name: "Origin" },
  destination: { lat: 17.5, lng: 78.5, name: "Destination" }
});

// Check for anomalies
const anomalies = await detectAnomalies({
  shipment_id: "SHIP-123",
  current_location: { lat: 17.45, lng: 78.45 }
});
```

### Direct API Call Example
```typescript
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/logistics-batch-assign`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      batch_id: "BATCH-123",
      vehicle_id: "TRK-001",
      driver_name: "John Doe",
      from_location: "Warehouse A",
      to_location: "Plant B"
    })
  }
);
```

---

## Monitoring & Analytics

All API calls are logged to `audit_logs` table with:
- User ID and role
- Action type
- Resource ID
- Timestamp
- Data snapshot

AI operations additionally logged to `ai_usage_analytics` with:
- Feature type
- Model name
- Input/output data
- Confidence scores
- Execution time
- Success/failure status

---

## Support

For API issues or questions:
- Review edge function logs in backend dashboard
- Check audit logs for request history
- Verify authentication and permissions
- Ensure all required fields are provided
