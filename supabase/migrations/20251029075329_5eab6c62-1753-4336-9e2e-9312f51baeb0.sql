-- Create demand_forecasts table
CREATE TABLE public.demand_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL,
  product_type TEXT NOT NULL,
  forecast_date DATE NOT NULL,
  predicted_quantity_kg NUMERIC NOT NULL,
  confidence_score NUMERIC,
  seasonal_factor NUMERIC,
  trend_factor NUMERIC,
  historical_avg NUMERIC,
  model_version TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(region, product_type, forecast_date)
);

CREATE INDEX idx_demand_forecasts_region ON public.demand_forecasts(region);
CREATE INDEX idx_demand_forecasts_date ON public.demand_forecasts(forecast_date);
CREATE INDEX idx_demand_forecasts_product ON public.demand_forecasts(product_type);

-- Create dispatch_predictions table
CREATE TABLE public.dispatch_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id TEXT REFERENCES public.shipments(id),
  predicted_dispatch_time TIMESTAMP WITH TIME ZONE,
  recommended_vehicle_id TEXT,
  recommended_driver_id UUID,
  predicted_duration_minutes INTEGER,
  predicted_cost NUMERIC,
  optimization_score NUMERIC,
  route_recommendation JSONB,
  weather_considerations JSONB,
  traffic_predictions JSONB,
  confidence_level TEXT, -- high, medium, low
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_dispatch_predictions_shipment ON public.dispatch_predictions(shipment_id);
CREATE INDEX idx_dispatch_predictions_time ON public.dispatch_predictions(predicted_dispatch_time);
CREATE INDEX idx_dispatch_predictions_applied ON public.dispatch_predictions(applied);

-- Create driver_performance_scores table
CREATE TABLE public.driver_performance_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL,
  evaluation_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  evaluation_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  overall_score NUMERIC NOT NULL,
  safety_score NUMERIC,
  efficiency_score NUMERIC,
  punctuality_score NUMERIC,
  fuel_efficiency_score NUMERIC,
  customer_feedback_score NUMERIC,
  total_trips INTEGER,
  on_time_deliveries INTEGER,
  incidents_count INTEGER,
  total_distance_km NUMERIC,
  total_fuel_liters NUMERIC,
  avg_speed_kmh NUMERIC,
  harsh_braking_events INTEGER,
  harsh_acceleration_events INTEGER,
  idle_time_hours NUMERIC,
  recommendations TEXT[],
  strengths TEXT[],
  areas_for_improvement TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_driver_performance_driver ON public.driver_performance_scores(driver_id);
CREATE INDEX idx_driver_performance_period ON public.driver_performance_scores(evaluation_period_start, evaluation_period_end);
CREATE INDEX idx_driver_performance_score ON public.driver_performance_scores(overall_score);

-- Create fleet_efficiency_scores table
CREATE TABLE public.fleet_efficiency_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id TEXT NOT NULL,
  evaluation_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  evaluation_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  overall_efficiency_score NUMERIC NOT NULL,
  utilization_rate NUMERIC,
  fuel_efficiency NUMERIC,
  maintenance_score NUMERIC,
  downtime_hours NUMERIC,
  total_trips INTEGER,
  total_distance_km NUMERIC,
  avg_load_factor NUMERIC,
  cost_per_km NUMERIC,
  revenue_per_km NUMERIC,
  idle_percentage NUMERIC,
  performance_trend TEXT, -- improving, stable, declining
  optimization_suggestions TEXT[],
  maintenance_alerts TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_fleet_efficiency_vehicle ON public.fleet_efficiency_scores(vehicle_id);
CREATE INDEX idx_fleet_efficiency_period ON public.fleet_efficiency_scores(evaluation_period_start, evaluation_period_end);
CREATE INDEX idx_fleet_efficiency_score ON public.fleet_efficiency_scores(overall_efficiency_score);

-- Create predictive_alerts table
CREATE TABLE public.predictive_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL, -- underperforming_route, idle_vehicle, maintenance_due, driver_fatigue, demand_spike, etc.
  severity TEXT NOT NULL, -- critical, high, medium, low
  entity_type TEXT NOT NULL, -- vehicle, driver, route, shipment
  entity_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  predicted_impact TEXT,
  recommended_actions TEXT[],
  data_points JSONB,
  confidence_score NUMERIC,
  status TEXT DEFAULT 'active', -- active, acknowledged, resolved, dismissed
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_predictive_alerts_type ON public.predictive_alerts(alert_type);
CREATE INDEX idx_predictive_alerts_severity ON public.predictive_alerts(severity);
CREATE INDEX idx_predictive_alerts_entity ON public.predictive_alerts(entity_type, entity_id);
CREATE INDEX idx_predictive_alerts_status ON public.predictive_alerts(status);
CREATE INDEX idx_predictive_alerts_created ON public.predictive_alerts(created_at);

-- Create route_performance_analytics table
CREATE TABLE public.route_performance_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id TEXT NOT NULL,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  analysis_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  analysis_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  total_trips INTEGER,
  avg_duration_minutes NUMERIC,
  avg_delay_minutes NUMERIC,
  on_time_percentage NUMERIC,
  avg_cost NUMERIC,
  avg_fuel_consumption NUMERIC,
  performance_score NUMERIC,
  traffic_pattern JSONB,
  weather_impact JSONB,
  optimization_opportunities TEXT[],
  is_underperforming BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_route_performance_route ON public.route_performance_analytics(route_id);
CREATE INDEX idx_route_performance_locations ON public.route_performance_analytics(from_location, to_location);
CREATE INDEX idx_route_performance_score ON public.route_performance_analytics(performance_score);
CREATE INDEX idx_route_performance_underperforming ON public.route_performance_analytics(is_underperforming);

-- Enable RLS
ALTER TABLE public.demand_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_performance_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_efficiency_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictive_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_performance_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can view demand forecasts" ON public.demand_forecasts
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage demand forecasts" ON public.demand_forecasts
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'logistics_manager'));

CREATE POLICY "Everyone can view dispatch predictions" ON public.dispatch_predictions
  FOR SELECT USING (true);

CREATE POLICY "Logistics managers can manage dispatch predictions" ON public.dispatch_predictions
  FOR ALL USING (has_role(auth.uid(), 'logistics_manager') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view driver performance" ON public.driver_performance_scores
  FOR SELECT USING (
    has_role(auth.uid(), 'logistics_manager') OR 
    has_role(auth.uid(), 'admin') OR
    driver_id = auth.uid()
  );

CREATE POLICY "System can insert driver performance" ON public.driver_performance_scores
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Everyone can view fleet efficiency" ON public.fleet_efficiency_scores
  FOR SELECT USING (true);

CREATE POLICY "System can insert fleet efficiency" ON public.fleet_efficiency_scores
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Everyone can view predictive alerts" ON public.predictive_alerts
  FOR SELECT USING (true);

CREATE POLICY "System can insert predictive alerts" ON public.predictive_alerts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Managers can update predictive alerts" ON public.predictive_alerts
  FOR UPDATE USING (
    has_role(auth.uid(), 'logistics_manager') OR 
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Everyone can view route analytics" ON public.route_performance_analytics
  FOR SELECT USING (true);

CREATE POLICY "System can insert route analytics" ON public.route_performance_analytics
  FOR INSERT WITH CHECK (true);