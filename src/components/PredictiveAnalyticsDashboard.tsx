import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  TrendingUp,
  AlertTriangle,
  Activity,
  BarChart3,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

export function PredictiveAnalyticsDashboard() {
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [routeAnalytics, setRouteAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [forecastsData, alertsData, routesData] = await Promise.all([
      supabase
        .from('demand_forecasts')
        .select('*')
        .gte('forecast_date', new Date().toISOString().split('T')[0])
        .order('forecast_date')
        .limit(7),
      supabase
        .from('predictive_alerts')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
      supabase
        .from('route_performance_analytics')
        .select('*')
        .eq('is_underperforming', true)
        .order('performance_score')
    ]);

    if (forecastsData.data) setForecasts(forecastsData.data);
    if (alertsData.data) setAlerts(alertsData.data);
    if (routesData.data) setRouteAnalytics(routesData.data);
  };

  const runForecasting = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('demand-forecasting', {
        body: { region: 'all', productType: 'all', forecastDays: 30 }
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Demand forecast generated' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const runAnalytics = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('predictive-analytics', {
        body: { analysisType: 'full' }
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Predictive analysis completed' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase
      .from('predictive_alerts')
      .update({
        status: 'acknowledged',
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: user?.id
      })
      .eq('id', alertId);

    fetchData();
  };

  const resolveAlert = async (alertId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase
      .from('predictive_alerts')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: user?.id
      })
      .eq('id', alertId);

    fetchData();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Predictive Analytics</h2>
        <div className="flex gap-2">
          <Button onClick={runForecasting} disabled={loading} variant="outline">
            <TrendingUp className="mr-2 h-4 w-4" />
            Generate Forecast
          </Button>
          <Button onClick={runAnalytics} disabled={loading}>
            <Activity className="mr-2 h-4 w-4" />
            Run Analytics
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold">{alerts.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Alerts</p>
                <p className="text-2xl font-bold text-destructive">
                  {alerts.filter(a => a.severity === 'critical').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Underperforming Routes</p>
                <p className="text-2xl font-bold">{routeAnalytics.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Forecasts Ready</p>
                <p className="text-2xl font-bold text-green-600">{forecasts.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts">
        <TabsList>
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
          <TabsTrigger value="forecasts">Demand Forecasts</TabsTrigger>
          <TabsTrigger value="routes">Route Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
                <p className="text-lg font-medium">No Active Alerts</p>
                <p className="text-muted-foreground">All systems operating normally</p>
              </CardContent>
            </Card>
          ) : (
            alerts.map(alert => (
              <Card key={alert.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <Badge variant="outline">{alert.alert_type}</Badge>
                      </div>
                      <CardTitle className="text-lg">{alert.title}</CardTitle>
                    </div>
                    <AlertTriangle className={`h-5 w-5 ${
                      alert.severity === 'critical' ? 'text-destructive' : 'text-orange-500'
                    }`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">{alert.description}</p>
                  
                  {alert.predicted_impact && (
                    <div className="mb-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Predicted Impact</p>
                      <p className="text-sm text-muted-foreground">{alert.predicted_impact}</p>
                    </div>
                  )}

                  {alert.recommended_actions && alert.recommended_actions.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Recommended Actions:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {alert.recommended_actions.map((action: string, idx: number) => (
                          <li key={idx} className="text-sm text-muted-foreground">{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      Acknowledge
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => resolveAlert(alert.id)}
                    >
                      Mark Resolved
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="forecasts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>7-Day Demand Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {forecasts.map(forecast => (
                  <div key={forecast.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">
                        {new Date(forecast.forecast_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">{forecast.region} - {forecast.product_type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{Math.round(forecast.predicted_quantity_kg)} kg</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round(forecast.confidence_score * 100)}% confidence
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routes" className="space-y-4">
          {routeAnalytics.map(route => (
            <Card key={route.id}>
              <CardHeader>
                <CardTitle className="text-lg">{route.from_location} → {route.to_location}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Trips</p>
                    <p className="text-lg font-bold">{route.total_trips}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">On-Time Rate</p>
                    <p className="text-lg font-bold">{Math.round(route.on_time_percentage)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Delay</p>
                    <p className="text-lg font-bold">{Math.round(route.avg_delay_minutes)} min</p>
                  </div>
                </div>
                <Badge variant="destructive">Underperforming</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}