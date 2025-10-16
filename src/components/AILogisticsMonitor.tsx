import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLogisticsAI } from "@/hooks/useLogisticsAI";
import { Brain, AlertTriangle, TrendingUp, MapPin, Clock } from "lucide-react";

interface AILogisticsMonitorProps {
  shipmentId: string;
  origin?: { lat: number; lng: number; name: string };
  destination?: { lat: number; lng: number; name: string };
  currentLocation?: { lat: number; lng: number };
}

export default function AILogisticsMonitor({ 
  shipmentId, 
  origin, 
  destination, 
  currentLocation 
}: AILogisticsMonitorProps) {
  const { loading, predictRoute, detectAnomalies, predictDelay } = useLogisticsAI();
  const [routePrediction, setRoutePrediction] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any>(null);
  const [delayPrediction, setDelayPrediction] = useState<any>(null);
  const [autoMonitor, setAutoMonitor] = useState(false);

  useEffect(() => {
    if (autoMonitor) {
      const interval = setInterval(() => {
        handleAnomalyCheck();
        handleDelayPrediction();
      }, 300000); // Check every 5 minutes

      return () => clearInterval(interval);
    }
  }, [autoMonitor, currentLocation]);

  const handleRoutePrediction = async () => {
    if (!origin || !destination) return;
    
    const result = await predictRoute({
      origin,
      destination,
      weather_conditions: 'Clear',
      road_conditions: 'Normal',
      fuel_cost_per_km: 1.5
    });
    
    setRoutePrediction(result);
  };

  const handleAnomalyCheck = async () => {
    const result = await detectAnomalies({
      shipment_id: shipmentId,
      current_location: currentLocation,
      weather_conditions: 'Clear'
    });
    
    setAnomalies(result);
  };

  const handleDelayPrediction = async () => {
    if (!destination) return;
    
    const result = await predictDelay({
      shipment_id: shipmentId,
      current_location: currentLocation,
      destination,
      weather_conditions: 'Clear',
      road_conditions: 'Normal'
    });
    
    setDelayPrediction(result);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'default';
      case 'LOW': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle>AI Logistics Monitor</CardTitle>
            </div>
            <Button
              variant={autoMonitor ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoMonitor(!autoMonitor)}
            >
              {autoMonitor ? 'Auto Monitor ON' : 'Auto Monitor OFF'}
            </Button>
          </div>
          <CardDescription>AI-powered route optimization and anomaly detection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={handleRoutePrediction} 
              disabled={loading || !origin || !destination}
              size="sm"
              variant="outline"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Predict Route
            </Button>
            <Button 
              onClick={handleAnomalyCheck} 
              disabled={loading}
              size="sm"
              variant="outline"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Check Anomalies
            </Button>
            <Button 
              onClick={handleDelayPrediction} 
              disabled={loading || !destination}
              size="sm"
              variant="outline"
            >
              <Clock className="h-4 w-4 mr-2" />
              Predict Delay
            </Button>
          </div>

          {/* Route Prediction Results */}
          {routePrediction && (
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <h3 className="font-semibold">Route Optimization</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Distance</p>
                  <p className="font-medium">{routePrediction.total_distance_km?.toFixed(1)} km</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Est. Time</p>
                  <p className="font-medium">{routePrediction.estimated_time_hours?.toFixed(1)} hrs</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fuel Cost</p>
                  <p className="font-medium">${routePrediction.estimated_fuel_cost?.toFixed(2)}</p>
                </div>
              </div>

              {routePrediction.risk_factors && routePrediction.risk_factors.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Risk Factors:</p>
                  {routePrediction.risk_factors.map((risk: string, i: number) => (
                    <p key={i} className="text-xs text-muted-foreground">• {risk}</p>
                  ))}
                </div>
              )}

              {routePrediction.recommendations && routePrediction.recommendations.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Recommendations:</p>
                  {routePrediction.recommendations.map((rec: string, i: number) => (
                    <p key={i} className="text-xs text-muted-foreground">• {rec}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Anomaly Detection Results */}
          {anomalies && anomalies.anomalies && anomalies.anomalies.length > 0 && (
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <h3 className="font-semibold">Detected Anomalies</h3>
                </div>
                <Badge variant={getSeverityColor(anomalies.overall_risk) as any}>
                  {anomalies.overall_risk} Risk
                </Badge>
              </div>

              <div className="space-y-2">
                {anomalies.anomalies.map((anomaly: any, i: number) => (
                  <div key={i} className="p-3 bg-muted rounded space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm capitalize">
                        {anomaly.type.replace('_', ' ')}
                      </p>
                      <Badge variant={getSeverityColor(anomaly.severity) as any} className="text-xs">
                        {anomaly.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{anomaly.description}</p>
                    {anomaly.recommendation && (
                      <p className="text-xs font-medium text-primary">→ {anomaly.recommendation}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delay Prediction Results */}
          {delayPrediction && (
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <h3 className="font-semibold">Delay Prediction</h3>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Delay Probability</p>
                  <p className="font-medium">{(delayPrediction.delay_probability * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Confidence</p>
                  <Badge variant="outline">{delayPrediction.confidence_level}</Badge>
                </div>
              </div>

              {delayPrediction.estimated_delay_minutes && (
                <div>
                  <p className="text-muted-foreground text-sm">Estimated Delay</p>
                  <p className="font-medium">{delayPrediction.estimated_delay_minutes} minutes</p>
                </div>
              )}

              <div>
                <p className="text-muted-foreground text-sm">Updated ETA</p>
                <p className="font-medium">{delayPrediction.updated_eta}</p>
              </div>

              {delayPrediction.factors && delayPrediction.factors.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Factors:</p>
                  {delayPrediction.factors.map((factor: string, i: number) => (
                    <p key={i} className="text-xs text-muted-foreground">• {factor}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {!routePrediction && !anomalies && !delayPrediction && (
            <div className="text-center text-muted-foreground py-8 text-sm">
              Click buttons above to run AI analysis
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
