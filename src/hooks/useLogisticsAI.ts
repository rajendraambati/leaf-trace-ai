import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RouteOptimizationResult {
  recommended_route?: Array<{
    waypoint: string;
    distance_km: number;
    estimated_time_minutes: number;
  }>;
  total_distance_km: number;
  estimated_fuel_cost: number;
  estimated_time_hours: number;
  risk_factors?: string[];
  recommendations?: string[];
}

interface AnomalyDetectionResult {
  anomalies: Array<{
    type: 'route_deviation' | 'delay' | 'missed_checkpoint' | 'temperature_alert' | 'unauthorized_stop';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    recommendation: string;
  }>;
  overall_risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requires_immediate_action?: boolean;
}

interface DelayPredictionResult {
  delay_probability: number;
  estimated_delay_minutes?: number;
  updated_eta: string;
  confidence_level: 'LOW' | 'MEDIUM' | 'HIGH';
  factors?: string[];
  recommendations?: string[];
}

export const useLogisticsAI = () => {
  const [loading, setLoading] = useState(false);

  const predictRoute = async (params: {
    origin: { lat: number; lng: number; name: string };
    destination: { lat: number; lng: number; name: string };
    weather_conditions?: string;
    road_conditions?: string;
    fuel_cost_per_km?: number;
  }): Promise<RouteOptimizationResult | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('logistics-ai-optimization', {
        body: {
          type: 'route_prediction',
          ...params
        }
      });

      if (error) {
        if (error.message?.includes('429')) {
          toast.error('Rate limit exceeded. Please try again in a moment.');
        } else if (error.message?.includes('402')) {
          toast.error('AI credits depleted. Please add credits to continue.');
        } else {
          toast.error('Failed to predict route: ' + error.message);
        }
        return null;
      }

      if (data?.result) {
        toast.success('Route optimized successfully!');
        return data.result;
      }

      return null;
    } catch (err) {
      console.error('Route prediction error:', err);
      toast.error('An error occurred during route prediction');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const detectAnomalies = async (params: {
    shipment_id: string;
    current_location?: { lat: number; lng: number };
    scheduled_checkpoints?: any[];
    actual_route?: any[];
    weather_conditions?: string;
  }): Promise<AnomalyDetectionResult | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('logistics-ai-optimization', {
        body: {
          type: 'anomaly_detection',
          ...params
        }
      });

      if (error) {
        if (error.message?.includes('429')) {
          toast.error('Rate limit exceeded. Please try again later.');
        } else if (error.message?.includes('402')) {
          toast.error('AI credits required.');
        } else {
          toast.error('Failed to detect anomalies: ' + error.message);
        }
        return null;
      }

      if (data?.result) {
        const result = data.result as AnomalyDetectionResult;
        
        // Show alerts based on severity
        const criticalAnomalies = result.anomalies.filter(a => a.severity === 'CRITICAL');
        const highAnomalies = result.anomalies.filter(a => a.severity === 'HIGH');
        
        if (criticalAnomalies.length > 0) {
          toast.error(`🚨 ${criticalAnomalies.length} CRITICAL anomaly detected!`, {
            duration: 10000
          });
        } else if (highAnomalies.length > 0) {
          toast.warning(`⚠️ ${highAnomalies.length} HIGH severity anomaly detected`, {
            duration: 5000
          });
        }
        
        return result;
      }

      return null;
    } catch (err) {
      console.error('Anomaly detection error:', err);
      toast.error('Error during anomaly detection');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const predictDelay = async (params: {
    shipment_id: string;
    current_location?: { lat: number; lng: number };
    destination?: { lat: number; lng: number; name: string };
    weather_conditions?: string;
    road_conditions?: string;
  }): Promise<DelayPredictionResult | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('logistics-ai-optimization', {
        body: {
          type: 'delay_prediction',
          ...params
        }
      });

      if (error) {
        if (error.message?.includes('429')) {
          toast.error('Rate limit exceeded.');
        } else if (error.message?.includes('402')) {
          toast.error('Payment required.');
        } else {
          toast.error('Failed to predict delay: ' + error.message);
        }
        return null;
      }

      if (data?.result) {
        const result = data.result as DelayPredictionResult;
        
        if (result.delay_probability > 0.7) {
          toast.warning(`High delay probability: ${(result.delay_probability * 100).toFixed(0)}%`);
        }
        
        return result;
      }

      return null;
    } catch (err) {
      console.error('Delay prediction error:', err);
      toast.error('Error predicting delay');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    predictRoute,
    detectAnomalies,
    predictDelay
  };
};
