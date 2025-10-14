# API Documentation

## Overview

TobaccoTrace uses Lovable Cloud Edge Functions (Deno runtime) for backend logic. All functions are serverless, automatically scaled, and deployed on save.

## Base URL

```
https://syhqhdyvyahutymbzllg.supabase.co/functions/v1
```

## Authentication

All API endpoints require authentication via JWT token (except public endpoints).

```typescript
// Get auth token
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// Make authenticated request
const response = await fetch(`${SUPABASE_URL}/functions/v1/function-name`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

Or use the Supabase SDK:

```typescript
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { /* request payload */ }
});
```

## Edge Functions

### 1. AI Grading

**Endpoint**: `/ai-grading`  
**Method**: POST  
**Auth**: Required  
**Description**: Analyzes tobacco leaf images using AI to determine quality grade

**Request:**
```json
{
  "imageUrl": "https://storage-url/image.jpg",
  "batchId": "BATCH-001"
}
```

**Response:**
```json
{
  "success": true,
  "grading": {
    "ai_grade": "Premium",
    "confidence": 0.92,
    "quality_score": 85,
    "defects_detected": ["slight_discoloration"],
    "recommendations": [
      "Store in controlled humidity environment",
      "Process within 30 days for optimal quality"
    ]
  },
  "model": "azure_ml_custom" | "gemini_vision"
}
```

**Error Response:**
```json
{
  "error": "Failed to analyze image",
  "details": "Image URL not accessible"
}
```

**Analytics Tracking:**
The function automatically logs usage to `ai_usage_analytics` table for model performance tracking.

---

### 2. Route Optimization

**Endpoint**: `/route-optimization`  
**Method**: POST  
**Auth**: Required  
**Description**: Optimizes delivery routes using AI

**Request:**
```json
{
  "shipments": [
    {
      "id": "SHIP-001",
      "destination": "Mumbai",
      "priority": "high",
      "quantity_kg": 500
    }
  ],
  "vehicles": [
    {
      "id": "VEH-001",
      "capacity_kg": 1000,
      "current_location": "Warehouse-A"
    }
  ],
  "constraints": {
    "maxRouteTime": 480,
    "deliveryWindows": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "routes": [
    {
      "vehicleId": "VEH-001",
      "stops": [
        { "shipmentId": "SHIP-001", "eta": "2025-10-15T10:30:00Z", "sequence": 1 }
      ],
      "totalDistance": 125,
      "estimatedTime": 180
    }
  ],
  "summary": {
    "totalRoutes": 1,
    "optimizationScore": 0.88,
    "costSavings": 15.2
  }
}
```

---

### 3. ESG Scoring

**Endpoint**: `/esg-scoring`  
**Method**: POST  
**Auth**: Required  
**Description**: Calculates Environmental, Social, Governance scores

**Request:**
```json
{
  "entityType": "farmer",
  "entityId": "FARMER-123",
  "data": {
    "certifications": ["organic", "fair_trade"],
    "practices": {
      "waterConservation": true,
      "pesticideUse": "minimal",
      "laborStandards": "compliant"
    },
    "metrics": {
      "carbonFootprint": 2.5,
      "waterUsage": 1500,
      "employeeWellbeing": 8.5
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "scores": {
    "environmental": 78,
    "social": 85,
    "governance": 72,
    "overall": 78.3
  },
  "breakdown": {
    "strengths": ["Water conservation", "Fair labor practices"],
    "improvements": ["Carbon footprint reduction", "Governance transparency"]
  },
  "recommendations": [
    "Implement renewable energy sources",
    "Establish regular governance audits"
  ]
}
```

---

### 4. Crop Health Prediction

**Endpoint**: `/crop-health-prediction`  
**Method**: POST  
**Auth**: Required  
**Description**: Predicts crop health using ML models

**Request:**
```json
{
  "farmerId": "FARMER-123",
  "sensorData": {
    "soilMoisture": 65,
    "temperature": 28,
    "humidity": 72,
    "rainfall": 45
  },
  "historicalData": {
    "lastYield": 2500,
    "previousDiseases": ["leaf_spot"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "prediction": {
    "healthScore": 82,
    "riskLevel": "low",
    "predictedYield": 2650,
    "diseaseRisk": {
      "leaf_spot": 0.15,
      "root_rot": 0.08
    },
    "recommendations": [
      "Maintain current irrigation schedule",
      "Apply preventive fungicide in 2 weeks"
    ]
  },
  "confidence": 0.89
}
```

---

### 5. MQTT Handler

**Endpoint**: `/mqtt-handler`  
**Method**: POST  
**Auth**: Required (service role)  
**Description**: Processes IoT device data from MQTT broker

**Request:**
```json
{
  "deviceType": "gps" | "qr_scanner" | "weighbridge",
  "deviceId": "GPS-001",
  "data": {
    // Device-specific payload
  }
}
```

**GPS Data:**
```json
{
  "deviceType": "gps",
  "deviceId": "GPS-001",
  "data": {
    "latitude": 19.0760,
    "longitude": 72.8777,
    "timestamp": "2025-10-14T12:00:00Z",
    "speed": 45,
    "heading": 180
  }
}
```

**Response:**
```json
{
  "success": true,
  "action": "updated_shipment_location",
  "shipmentId": "SHIP-001",
  "newLocation": {
    "lat": 19.0760,
    "lng": 72.8777
  }
}
```

---

### 6. Compliance Reporting

**Endpoint**: `/generate-compliance-report`  
**Method**: POST  
**Auth**: Required (admin/auditor)  
**Description**: Generates compliance reports for regulatory submission

**Request:**
```json
{
  "reportType": "gst" | "fctc" | "esg",
  "periodStart": "2025-01-01",
  "periodEnd": "2025-03-31",
  "format": "json" | "pdf",
  "includeAttachments": true
}
```

**Response:**
```json
{
  "success": true,
  "reportId": "RPT-2025-Q1-001",
  "format": "json",
  "data": {
    "period": {
      "start": "2025-01-01",
      "end": "2025-03-31"
    },
    "summary": {
      "totalProcurement": 125000,
      "totalShipments": 450,
      "complianceScore": 94.5
    },
    "sections": {
      // Report-specific data
    }
  },
  "fileUrl": "https://storage-url/reports/RPT-2025-Q1-001.pdf"
}
```

---

### 7. Submit Government Report

**Endpoint**: `/submit-government-report`  
**Method**: POST  
**Auth**: Required (admin/auditor)  
**Description**: Submits reports to government portals

**Request:**
```json
{
  "portalType": "gst" | "fctc" | "esg",
  "reportData": {
    // Report payload
  },
  "portalUrl": "https://government-portal.in/api/submit",
  "credentials": {
    "username": "user",
    "apiKey": "key"
  }
}
```

**Response:**
```json
{
  "success": true,
  "submissionId": "SUB-2025-001",
  "portalResponse": {
    "status": "accepted",
    "referenceNumber": "GOV-REF-12345",
    "timestamp": "2025-10-14T12:00:00Z"
  },
  "auditLogId": "LOG-001"
}
```

---

### 8. Farmer Management

**Endpoint**: `/farmer-management`  
**Method**: GET, POST, PUT, DELETE  
**Auth**: Required  
**Description**: CRUD operations for farmer data

**GET** (Retrieve farmers)
```
GET /farmer-management
GET /farmer-management?id=FARMER-123
```

**Response:**
```json
{
  "success": true,
  "farmers": [
    {
      "id": "uuid",
      "name": "John Farmer",
      "phone": "+91-9876543210",
      "location": "Maharashtra",
      "farm_size_acres": 25.5,
      "status": "active",
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

**POST** (Create farmer)
```json
{
  "name": "John Farmer",
  "phone": "+91-9876543210",
  "email": "john@example.com",
  "location": "Maharashtra",
  "farm_size_acres": 25.5,
  "geo_latitude": 19.0760,
  "geo_longitude": 72.8777
}
```

**PUT** (Update farmer)
```json
{
  "id": "FARMER-123",
  "status": "inactive",
  "farm_size_acres": 30.0
}
```

**DELETE**
```
DELETE /farmer-management?id=FARMER-123
```

---

### 9. Procurement Management

**Endpoint**: `/procurement-management`  
**Method**: GET, POST, PUT, DELETE  
**Auth**: Required  
**Description**: Manage procurement batches

**POST** (Create batch)
```json
{
  "farmer_id": "uuid",
  "quantity_kg": 500,
  "grade": "Premium",
  "price_per_kg": 150,
  "procurement_date": "2025-10-14"
}
```

**Response:**
```json
{
  "success": true,
  "batch": {
    "id": "BATCH-001",
    "qr_code": "QR-BATCH-001-ABC123",
    "total_price": 75000,
    "status": "pending",
    "created_at": "2025-10-14T12:00:00Z"
  }
}
```

---

### 10. Logistics Tracking

**Endpoint**: `/logistics-tracking`  
**Method**: GET, POST, PUT, DELETE  
**Auth**: Required  
**Description**: Track shipments

**POST** (Create shipment)
```json
{
  "batch_id": "BATCH-001",
  "from_location": "Warehouse-A",
  "to_location": "Factory-B",
  "vehicle_id": "VEH-001",
  "driver_name": "Driver Name",
  "departure_time": "2025-10-14T08:00:00Z",
  "eta": "2025-10-14T12:00:00Z"
}
```

**PUT** (Update location)
```json
{
  "id": "SHIP-001",
  "status": "in-transit",
  "gps_latitude": 19.0760,
  "gps_longitude": 72.8777,
  "temperature_min": 18,
  "temperature_max": 22
}
```

---

### 11. Inventory Management

**Endpoint**: `/inventory-management`  
**Method**: POST  
**Auth**: Required  
**Description**: Manage warehouse inventory

**Request:**
```json
{
  "action": "check_in" | "check_out" | "transfer",
  "warehouse_id": "WH-001",
  "batch_id": "BATCH-001",
  "quantity_kg": 500
}
```

**Response:**
```json
{
  "success": true,
  "warehouse": {
    "id": "WH-001",
    "current_stock_kg": 5500,
    "max_capacity_kg": 10000,
    "utilization_percent": 55
  },
  "alert": "Capacity above 50%" // Optional
}
```

---

### 12. Analyze Feedback

**Endpoint**: `/analyze-feedback`  
**Method**: POST  
**Auth**: Required (admin/auditor)  
**Description**: AI-powered analysis of user feedback and usage patterns

**Request:**
```json
{} // No body required, analyzes latest data
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "priorities": [
      {
        "title": "Improve AI Grading Speed",
        "reasoning": "Users report slow response times",
        "impact": "high"
      }
    ],
    "performance_issues": [
      {
        "feature": "ai_grading",
        "issue": "Low confidence on edge cases",
        "recommendation": "Retrain with more diverse dataset"
      }
    ],
    "adoption_insights": {
      "underutilized": ["crop_health"],
      "popular": ["ai_grading", "route_optimization"]
    },
    "retraining_recommendations": [
      {
        "feature": "ai_grading",
        "suggestion": "Add low-light image samples",
        "data_needed": "500+ images in poor lighting conditions"
      }
    ]
  },
  "metadata": {
    "feedback_count": 125,
    "usage_count": 1450,
    "analyzed_at": "2025-10-14T12:00:00Z"
  }
}
```

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "error": "Error message",
  "details": "Detailed error information",
  "code": "ERROR_CODE",
  "timestamp": "2025-10-14T12:00:00Z"
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request payload |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `AI_SERVICE_ERROR` | 502 | AI service unavailable |

## Rate Limits

- **Default**: 60 requests per minute per user
- **AI endpoints**: 20 requests per minute per user
- **Bulk operations**: 10 requests per minute per user

Rate limit headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1760445600
```

## Webhooks

### Event Types

- `procurement.created` - New procurement batch
- `shipment.status_changed` - Shipment status update
- `ai_grading.completed` - AI analysis finished
- `compliance.report_generated` - Report ready

### Webhook Payload

```json
{
  "event": "procurement.created",
  "timestamp": "2025-10-14T12:00:00Z",
  "data": {
    "id": "BATCH-001",
    // Event-specific data
  }
}
```

## SDK Usage Examples

### React Query Integration

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Query example
const { data, isLoading } = useQuery({
  queryKey: ['farmers'],
  queryFn: async () => {
    const { data, error } = await supabase.functions.invoke('farmer-management');
    if (error) throw error;
    return data;
  }
});

// Mutation example
const createBatch = useMutation({
  mutationFn: async (batchData) => {
    const { data, error } = await supabase.functions.invoke('procurement-management', {
      body: batchData
    });
    if (error) throw error;
    return data;
  }
});
```

### Error Handling

```typescript
try {
  const { data, error } = await supabase.functions.invoke('ai-grading', {
    body: { imageUrl, batchId }
  });
  
  if (error) {
    if (error.message.includes('429')) {
      toast.error('Rate limit exceeded. Please try again later.');
    } else if (error.message.includes('402')) {
      toast.error('AI credits exhausted. Please add credits.');
    } else {
      toast.error('Failed to analyze image');
    }
    return;
  }
  
  // Handle success
  toast.success('Image analyzed successfully');
} catch (err) {
  console.error('Unexpected error:', err);
  toast.error('An unexpected error occurred');
}
```

## Testing

### Local Testing

```bash
# Test edge function locally
supabase functions serve function-name

# Make test request
curl -X POST http://localhost:54321/functions/v1/function-name \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Integration Tests

See [Testing Guide](./TESTING.md) for comprehensive testing strategies.

## Best Practices

1. **Always validate input**: Use zod or similar for request validation
2. **Handle errors gracefully**: Return meaningful error messages
3. **Log appropriately**: Use console.log/error for debugging
4. **Respect rate limits**: Implement exponential backoff
5. **Cache when possible**: Use React Query cache effectively
6. **Monitor performance**: Track function execution times
7. **Secure secrets**: Never expose API keys in frontend
8. **Test thoroughly**: Write tests for critical paths

## Support

For API issues:
1. Check [Troubleshooting Guide](./TROUBLESHOOTING.md)
2. Review edge function logs in backend dashboard
3. Contact backend team lead
