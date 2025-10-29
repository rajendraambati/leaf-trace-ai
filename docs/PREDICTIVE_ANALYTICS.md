# Predictive Analytics & AI Optimization System

## Overview

AI-powered predictive system for demand forecasting, dispatch optimization, performance scoring, and proactive alerting using Lovable AI (Gemini 2.5 Flash).

## Features

### 1. Demand Forecasting
- **Historical Analysis**: Analyzes past 12 months of procurement and shipment data
- **Seasonal Patterns**: Detects harvest seasons, holidays, and market cycles
- **Regional Forecasting**: Generate predictions per region and product type
- **Multi-Day Forecasts**: 7, 14, or 30-day predictions
- **Confidence Scoring**: AI-calculated confidence levels for each forecast

### 2. Dispatch Optimization
- **Optimal Timing**: Recommends best dispatch times based on traffic, weather, and historical performance
- **Vehicle Matching**: Suggests ideal vehicle-route combinations
- **Driver Assignment**: Factors in driver availability, fatigue, and performance
- **Cost Optimization**: Minimizes fuel, time, and operational costs
- **Route Recommendations**: AI-generated optimal routes with alternatives

### 3. Performance Scoring

#### Driver Performance
- **Overall Score**: Composite metric (0-100)
- **Safety Score**: Harsh braking/acceleration events, incidents
- **Efficiency Score**: Route adherence, fuel consumption
- **Punctuality Score**: On-time delivery rate
- **Wellbeing Integration**: Fatigue and stress level tracking
- **Personalized Recommendations**: AI-generated improvement suggestions

#### Fleet Efficiency
- **Utilization Rate**: Active vs idle time
- **Fuel Efficiency**: MPG/L per vehicle
- **Maintenance Score**: Downtime and service adherence
- **Cost Per KM**: Operational cost tracking
- **Performance Trends**: Improving, stable, or declining indicators
- **Optimization Suggestions**: AI-driven recommendations

### 4. Predictive Alerts

#### Alert Types
- **Underperforming Routes**: < 70% on-time delivery rate
- **Idle Vehicles**: Available vehicles not deployed
- **Driver Fatigue**: High fatigue/stress patterns detected
- **Maintenance Due**: Predictive maintenance warnings
- **Demand Spikes**: Forecasted demand increases
- **Traffic Anomalies**: Unusual delays detected

#### Severity Levels
- **Critical**: Immediate action required (safety, regulatory)
- **High**: Action needed within 24 hours
- **Medium**: Monitor and plan intervention
- **Low**: Informational, no immediate action

#### Alert Management
- **Acknowledgement**: Mark alerts as seen
- **Resolution**: Track resolution with notes
- **Impact Prediction**: AI estimates business impact
- **Recommended Actions**: Step-by-step mitigation steps

### 5. Route Analytics
- **Performance Tracking**: Historical route performance
- **Delay Analysis**: Average delays and patterns
- **Traffic Patterns**: Peak hour identification
- **Weather Impact**: Correlation analysis
- **Optimization Opportunities**: AI-identified improvements

## Database Schema

### demand_forecasts
```sql
- region: Target region (all/specific)
- product_type: Product category (all/specific)
- forecast_date: Date of prediction
- predicted_quantity_kg: Forecasted demand
- confidence_score: AI confidence (0-1)
- seasonal_factor: Seasonal multiplier
- trend_factor: Trend component
- historical_avg: Baseline average
- model_version: AI model used
```

### dispatch_predictions
```sql
- shipment_id: Target shipment
- predicted_dispatch_time: Optimal departure time
- recommended_vehicle_id: Best vehicle match
- recommended_driver_id: Suggested driver
- predicted_duration_minutes: Estimated travel time
- predicted_cost: Expected operational cost
- optimization_score: Overall optimization rating
- route_recommendation: AI-suggested route
- weather_considerations: Weather factors
- traffic_predictions: Expected traffic
- confidence_level: high/medium/low
- applied: Whether recommendation was used
```

### driver_performance_scores
```sql
- driver_id: Driver reference
- evaluation_period_start/end: Analysis window
- overall_score: Composite score (0-100)
- safety_score: Safety metrics
- efficiency_score: Operational efficiency
- punctuality_score: On-time performance
- fuel_efficiency_score: Fuel usage
- total_trips: Trip count in period
- on_time_deliveries: Successful deliveries
- incidents_count: Safety incidents
- harsh_braking_events: Safety events
- harsh_acceleration_events: Safety events
- idle_time_hours: Unproductive time
- recommendations: AI suggestions
- strengths: Identified strengths
- areas_for_improvement: Growth areas
```

### fleet_efficiency_scores
```sql
- vehicle_id: Vehicle reference
- overall_efficiency_score: Composite (0-100)
- utilization_rate: Active percentage
- fuel_efficiency: MPG/L performance
- maintenance_score: Service compliance
- downtime_hours: Out of service time
- total_trips: Trip count
- total_distance_km: Mileage
- avg_load_factor: Capacity usage
- cost_per_km: Operational cost
- revenue_per_km: Revenue generated
- idle_percentage: Idle time ratio
- performance_trend: improving/stable/declining
- optimization_suggestions: AI recommendations
- maintenance_alerts: Upcoming service needs
```

### predictive_alerts
```sql
- alert_type: Category of alert
- severity: critical/high/medium/low
- entity_type: vehicle/driver/route/shipment
- entity_id: Reference ID
- title: Alert headline
- description: Detailed description
- predicted_impact: Business impact
- recommended_actions: Array of actions
- data_points: Supporting data (JSON)
- confidence_score: AI confidence
- status: active/acknowledged/resolved/dismissed
- acknowledged_at/by: Acknowledgement tracking
- resolved_at/by: Resolution tracking
- resolution_notes: Resolution details
```

### route_performance_analytics
```sql
- route_id: Route identifier
- from_location/to_location: Route endpoints
- analysis_period_start/end: Analysis window
- total_trips: Trip count
- avg_duration_minutes: Average time
- avg_delay_minutes: Average delay
- on_time_percentage: Success rate
- avg_cost: Average operational cost
- avg_fuel_consumption: Fuel usage
- performance_score: Overall rating
- traffic_pattern: Traffic analysis (JSON)
- weather_impact: Weather analysis (JSON)
- optimization_opportunities: Improvements
- is_underperforming: Boolean flag
```

## API Endpoints

### Demand Forecasting
**POST** `/functions/v1/demand-forecasting`
```json
{
  "region": "all",
  "productType": "all",
  "forecastDays": 30
}
```

**Response:**
```json
{
  "success": true,
  "forecasts": [{
    "region": "all",
    "product_type": "all",
    "forecast_date": "2024-01-15",
    "predicted_quantity_kg": 1250,
    "confidence_score": 0.87,
    "seasonal_factor": 1.2,
    "historical_avg": 1000
  }],
  "summary": {
    "totalForecasted": 37500,
    "avgDaily": 1250,
    "avgConfidence": 0.85
  }
}
```

### Predictive Analytics
**POST** `/functions/v1/predictive-analytics`
```json
{
  "analysisType": "full"
}
```

**Response:**
```json
{
  "success": true,
  "insights": {
    "alerts": [{
      "type": "underperforming_route",
      "severity": "high",
      "entityType": "route",
      "entityId": "Route-A-B",
      "title": "Route A-B Underperforming",
      "description": "Only 65% on-time delivery rate",
      "predictedImpact": "Potential customer satisfaction decline",
      "recommendedActions": [
        "Review driver assignments",
        "Analyze traffic patterns",
        "Consider alternative routes"
      ],
      "confidenceScore": 0.92
    }],
    "optimizations": [
      "Consolidate deliveries on Route X-Y to reduce trips by 15%",
      "Shift morning dispatches 30 minutes earlier to avoid peak traffic"
    ]
  },
  "summary": {
    "totalAlerts": 12,
    "criticalAlerts": 2,
    "idleVehicles": 3,
    "underperformingRoutes": 5
  }
}
```

## AI Models Used

### Gemini 2.5 Flash (Primary)
- **Purpose**: Demand forecasting, performance analysis, alert generation
- **Strengths**: Fast inference, good reasoning, cost-effective
- **Temperature**: 0.3-0.4 for consistent predictions
- **Context Window**: Handles 30+ days of historical data

### Model Features
- **Structured Output**: Returns JSON for easy parsing
- **Multi-factor Analysis**: Considers seasonality, trends, external factors
- **Explainable AI**: Provides reasoning for predictions
- **Confidence Scoring**: Built-in uncertainty quantification

## Usage Examples

### 1. Generate Demand Forecast
```typescript
const { data, error } = await supabase.functions.invoke('demand-forecasting', {
  body: {
    region: 'North Region',
    productType: 'Grade A',
    forecastDays: 14
  }
});

console.log(`Forecasted ${data.summary.totalForecasted}kg over 14 days`);
```

### 2. Run Predictive Analytics
```typescript
const { data } = await supabase.functions.invoke('predictive-analytics', {
  body: { analysisType: 'full' }
});

// Process critical alerts
const criticalAlerts = data.insights.alerts.filter(a => a.severity === 'critical');
for (const alert of criticalAlerts) {
  console.log(`CRITICAL: ${alert.title}`);
  console.log(`Actions: ${alert.recommendedActions.join(', ')}`);
}
```

### 3. Query Forecasts
```typescript
const { data: forecasts } = await supabase
  .from('demand_forecasts')
  .select('*')
  .eq('region', 'South Region')
  .gte('forecast_date', '2024-01-01')
  .order('forecast_date');
```

### 4. Manage Alerts
```typescript
// Acknowledge alert
await supabase
  .from('predictive_alerts')
  .update({
    status: 'acknowledged',
    acknowledged_at: new Date().toISOString(),
    acknowledged_by: userId
  })
  .eq('id', alertId);

// Resolve with notes
await supabase
  .from('predictive_alerts')
  .update({
    status: 'resolved',
    resolved_at: new Date().toISOString(),
    resolved_by: userId,
    resolution_notes: 'Assigned backup driver, route completed on time'
  })
  .eq('id', alertId);
```

## Integration Points

### Dispatcher Dashboard
- Real-time alert notifications
- Quick access to recommendations
- One-click application of dispatch predictions
- Driver and vehicle selection guided by AI scores

### Driver App
- Performance feedback
- Personalized recommendations
- Achievement tracking
- Wellbeing integration

### Fleet Management
- Vehicle efficiency reports
- Maintenance scheduling
- Utilization optimization
- Cost tracking

### Warehouse Operations
- Demand-based inventory planning
- Staff scheduling based on forecasts
- Space allocation optimization

## Scheduled Analysis

### Automatic Jobs (Recommended)
```sql
-- Daily demand forecast update (runs at 2 AM)
SELECT cron.schedule(
  'daily-demand-forecast',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url:='https://project-ref.supabase.co/functions/v1/demand-forecasting',
    headers:='{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body:='{"region": "all", "productType": "all", "forecastDays": 30}'::jsonb
  );
  $$
);

-- Hourly analytics scan (runs every hour)
SELECT cron.schedule(
  'hourly-predictive-analytics',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url:='https://project-ref.supabase.co/functions/v1/predictive-analytics',
    headers:='{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body:='{"analysisType": "full"}'::jsonb
  );
  $$
);
```

## Best Practices

### 1. Data Quality
- Ensure accurate historical data
- Regular GPS and telemetry syncs
- Timely shipment status updates
- Complete driver wellbeing logs

### 2. Alert Management
- Review critical alerts immediately
- Acknowledge alerts within 1 hour
- Document resolution actions
- Track alert effectiveness

### 3. Forecast Accuracy
- Validate forecasts against actuals
- Adjust seasonal factors as needed
- Consider external events (holidays, strikes)
- Update AI model periodically

### 4. Performance Monitoring
- Weekly performance reviews with drivers
- Monthly fleet efficiency audits
- Quarterly trend analysis
- Annual model retraining

### 5. Privacy & Ethics
- Anonymize driver performance for aggregates
- Use scores for coaching, not punishment
- Transparent scoring methodology
- Right to contest scores

## Troubleshooting

### Low Confidence Forecasts
- **Cause**: Insufficient historical data
- **Solution**: Accumulate 3+ months before relying on forecasts

### False Positive Alerts
- **Cause**: Threshold too sensitive
- **Solution**: Adjust alert thresholds in AI prompt

### Missing Predictions
- **Cause**: Edge function timeout or error
- **Solution**: Check edge function logs, reduce analysis scope

### Inaccurate Route Analytics
- **Cause**: Incomplete shipment data
- **Solution**: Ensure all shipments have actual_arrival timestamps

## Future Enhancements

- [ ] Real-time ML model retraining
- [ ] Weather API integration for enhanced predictions
- [ ] Market price correlation analysis
- [ ] Multi-modal transport optimization
- [ ] Carbon footprint predictions
- [ ] Customer demand sentiment analysis
- [ ] Automated dispatch decision engine
- [ ] Driver coaching recommendations
- [ ] Predictive maintenance ML models
- [ ] Dynamic pricing recommendations