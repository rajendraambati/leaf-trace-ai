# AI-Powered Logistics Optimization

## Overview
The TobaccoTrace platform uses AI to optimize logistics operations, predict delays, and detect anomalies in real-time.

## Features

### 1. Route Optimization
AI analyzes multiple factors to recommend optimal delivery routes:
- **Weather conditions**: Adjusts routes based on rain, fog, storms
- **Road conditions**: Accounts for construction, traffic, road quality
- **Fuel optimization**: Calculates most cost-effective paths
- **Time estimation**: Provides accurate ETA based on conditions

**Usage:**
```typescript
const result = await predictRoute({
  origin: { lat: 17.4, lng: 78.4, name: "Warehouse A" },
  destination: { lat: 17.5, lng: 78.5, name: "Processing Plant" },
  weather_conditions: "Clear",
  road_conditions: "Normal",
  fuel_cost_per_km: 1.5
});
```

### 2. Anomaly Detection
Real-time monitoring and detection of logistics issues:
- Route deviations from planned path
- Unexpected delays or speed changes
- Missed checkpoints
- Temperature anomalies
- Unauthorized stops

**Severity Levels:**
- `CRITICAL`: Immediate action required
- `HIGH`: Urgent attention needed
- `MEDIUM`: Monitor closely
- `LOW`: Minor issue

**Auto-alerts:** Critical and high-severity anomalies trigger automatic IoT events and notifications.

### 3. Delay Prediction
Predicts delivery delays based on:
- Current location vs schedule
- Weather impact on speed
- Road conditions
- Traffic patterns
- Historical data

**Returns:**
- Delay probability (0-1)
- Estimated delay in minutes
- Updated ETA
- Confidence level (LOW/MEDIUM/HIGH)
- Contributing factors
- Recommendations

## Implementation

### Edge Function
`supabase/functions/logistics-ai-optimization/index.ts`
- Powered by Lovable AI (Google Gemini 2.5 Flash)
- Handles three optimization types: route_prediction, anomaly_detection, delay_prediction
- Uses structured output via tool calling
- Logs all AI usage to analytics table

### React Hook
`src/hooks/useLogisticsAI.ts`
- Convenient methods: `predictRoute()`, `detectAnomalies()`, `predictDelay()`
- Automatic toast notifications for alerts
- Error handling for rate limits and payment issues

### Component
`src/components/AILogisticsMonitor.tsx`
- Visual interface for AI monitoring
- One-click analysis buttons
- Auto-monitor mode (checks every 5 minutes)
- Color-coded severity indicators

## API Endpoints

### POST /functions/v1/logistics-ai-optimization

**Route Prediction:**
```json
{
  "type": "route_prediction",
  "origin": { "lat": 17.4, "lng": 78.4, "name": "Origin" },
  "destination": { "lat": 17.5, "lng": 78.5, "name": "Destination" },
  "weather_conditions": "Clear",
  "road_conditions": "Normal",
  "fuel_cost_per_km": 1.5
}
```

**Anomaly Detection:**
```json
{
  "type": "anomaly_detection",
  "shipment_id": "SHIP-123",
  "current_location": { "lat": 17.45, "lng": 78.45 },
  "scheduled_checkpoints": [],
  "actual_route": [],
  "weather_conditions": "Clear"
}
```

**Delay Prediction:**
```json
{
  "type": "delay_prediction",
  "shipment_id": "SHIP-123",
  "current_location": { "lat": 17.45, "lng": 78.45 },
  "destination": { "lat": 17.5, "lng": 78.5, "name": "Destination" },
  "weather_conditions": "Clear",
  "road_conditions": "Normal"
}
```

## Rate Limits & Pricing

- **Rate Limits**: Per workspace, monitored automatically
- **429 Error**: Too many requests - automatic retry with backoff
- **402 Error**: Credits depleted - prompts user to add funds
- **Free Tier**: Limited requests per month
- **Paid Tier**: Higher limits, priority processing

## Best Practices

1. **Auto-Monitor Mode**: Enable for critical shipments
2. **Checkpoint Validation**: Verify GPS against planned route every 5 minutes
3. **Severity Escalation**: CRITICAL/HIGH anomalies trigger immediate alerts
4. **Delay Mitigation**: Update customers proactively when delays predicted >70%
5. **Route Optimization**: Run before departure and when conditions change

## Monitoring & Analytics

All AI usage logged to `ai_usage_analytics` table:
- Feature type
- Model used (google/gemini-2.5-flash)
- Input/output data
- Success/failure status
- Execution time

## Troubleshooting

**Issue**: AI not responding
- Check `LOVABLE_API_KEY` is configured
- Verify rate limits not exceeded
- Review edge function logs

**Issue**: Inaccurate predictions
- Update weather/road condition inputs
- Provide more historical data
- Adjust checkpoint frequency

**Issue**: Too many false alerts
- Tune severity thresholds
- Adjust auto-monitor interval
- Filter low-severity anomalies

## Future Enhancements

- Multi-stop route optimization
- Driver behavior analysis
- Predictive maintenance alerts
- Integration with external weather APIs
- Machine learning model fine-tuning
- Custom alert rules engine
