import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Truck,
  Heart,
  Zap,
  MapPin,
  Fuel,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  Sparkles,
  Navigation,
  Activity,
} from 'lucide-react';
import { format } from 'date-fns';

interface Vehicle {
  id: string;
  registration_number: string;
  vehicle_type: string;
  driver_name: string;
  status: string;
  current_location: string;
  fuel_level: number;
  health_score: number;
  current_latitude: number;
  current_longitude: number;
}

interface VehicleInsight {
  id: string;
  vehicle_id: string;
  insight_type: string;
  severity: string;
  title: string;
  message: string;
  recommendations: string[];
  confidence_score: number;
  is_read: boolean;
  is_resolved: boolean;
  created_at: string;
}

interface WellbeingLog {
  id: string;
  mood_rating: number;
  fatigue_level: number;
  stress_level: number;
  driving_hours: number;
  concerns: string;
  created_at: string;
}

export function AIVehicleTracker() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [insights, setInsights] = useState<VehicleInsight[]>([]);
  const [wellbeingLogs, setWellbeingLogs] = useState<WellbeingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingInsights, setGeneratingInsights] = useState(false);

  useEffect(() => {
    fetchVehicles();

    const vehiclesChannel = supabase
      .channel('vehicles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, fetchVehicles)
      .subscribe();

    return () => {
      supabase.removeChannel(vehiclesChannel);
    };
  }, []);

  useEffect(() => {
    if (selectedVehicle) {
      fetchInsights(selectedVehicle.id);
      fetchWellbeingLogs(selectedVehicle.id);

      const insightsChannel = supabase
        .channel(`insights-${selectedVehicle.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'ai_vehicle_insights',
          filter: `vehicle_id=eq.${selectedVehicle.id}`
        }, () => fetchInsights(selectedVehicle.id))
        .subscribe();

      return () => {
        supabase.removeChannel(insightsChannel);
      };
    }
  }, [selectedVehicle]);

  const fetchVehicles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('status', { ascending: true });

    if (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Failed to load vehicles');
    } else {
      setVehicles(data || []);
      if (data && data.length > 0 && !selectedVehicle) {
        setSelectedVehicle(data[0]);
      }
    }
    setLoading(false);
  };

  const fetchInsights = async (vehicleId: string) => {
    const { data, error } = await supabase
      .from('ai_vehicle_insights')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching insights:', error);
    } else {
      setInsights(data || []);
    }
  };

  const fetchWellbeingLogs = async (vehicleId: string) => {
    const { data, error } = await supabase
      .from('driver_wellbeing_logs')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching wellbeing logs:', error);
    } else {
      setWellbeingLogs(data || []);
    }
  };

  const generateInsights = async () => {
    if (!selectedVehicle) return;

    setGeneratingInsights(true);
    try {
      const { data, error } = await supabase.functions.invoke('vehicle-ai-insights', {
        body: { vehicleId: selectedVehicle.id }
      });

      if (error) throw error;

      toast.success('AI insights generated successfully', {
        description: 'New recommendations are available',
      });
      fetchInsights(selectedVehicle.id);
    } catch (error) {
      console.error('Error generating insights:', error);
      toast.error('Failed to generate insights');
    } finally {
      setGeneratingInsights(false);
    }
  };

  const markInsightAsRead = async (insightId: string) => {
    const { error } = await supabase
      .from('ai_vehicle_insights')
      .update({ is_read: true })
      .eq('id', insightId);

    if (error) {
      console.error('Error marking insight as read:', error);
    } else {
      fetchInsights(selectedVehicle!.id);
    }
  };

  const resolveInsight = async (insightId: string) => {
    const { error } = await supabase
      .from('ai_vehicle_insights')
      .update({ is_resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', insightId);

    if (error) {
      console.error('Error resolving insight:', error);
      toast.error('Failed to resolve insight');
    } else {
      toast.success('Insight resolved');
      fetchInsights(selectedVehicle!.id);
    }
  };

  const getInsightIcon = (type: string) => {
    const icons: Record<string, any> = {
      route_optimization: Navigation,
      driver_wellbeing: Heart,
      predictive_maintenance: Zap,
      eta_update: MapPin,
      fuel_alert: Fuel,
      safety_alert: AlertTriangle,
      weather_alert: TrendingUp,
      traffic_alert: Activity,
    };
    return icons[type] || Info;
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      info: 'default',
      low: 'secondary',
      medium: 'default',
      high: 'destructive',
      critical: 'destructive',
    };
    return colors[severity] || 'default';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'default',
      'in-transit': 'default',
      maintenance: 'secondary',
      offline: 'destructive',
    };
    return colors[status] || 'default';
  };

  const unreadInsights = insights.filter(i => !i.is_read);
  const unresolvedInsights = insights.filter(i => !i.is_resolved);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Vehicle Tracking
          </h2>
          <p className="text-muted-foreground">
            Transparent, stress-free logistics with empathetic AI insights
          </p>
        </div>
        <div className="flex gap-2">
          {unresolvedInsights.length > 0 && (
            <Badge variant="destructive" className="text-lg px-4 py-2">
              <AlertTriangle className="h-4 w-4 mr-2" />
              {unresolvedInsights.length} Active Insights
            </Badge>
          )}
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Truck className="h-4 w-4 mr-2" />
            {vehicles.length} Vehicles
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Vehicle List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Active Vehicles</CardTitle>
            <CardDescription>Select a vehicle to view insights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">Loading...</div>
            ) : vehicles.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No vehicles found</div>
            ) : (
              vehicles.map((vehicle) => (
                <Button
                  key={vehicle.id}
                  variant={selectedVehicle?.id === vehicle.id ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setSelectedVehicle(vehicle)}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  <div className="flex-1 text-left">
                    <div className="font-medium">{vehicle.registration_number}</div>
                    <div className="text-xs opacity-70">{vehicle.driver_name}</div>
                  </div>
                  <Badge variant={getStatusColor(vehicle.status) as any} className="ml-2">
                    {vehicle.status}
                  </Badge>
                </Button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {selectedVehicle ? (
            <>
              {/* Vehicle Overview */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl">{selectedVehicle.registration_number}</CardTitle>
                      <CardDescription>
                        {selectedVehicle.vehicle_type} • Driver: {selectedVehicle.driver_name}
                      </CardDescription>
                    </div>
                    <Button onClick={generateInsights} disabled={generatingInsights}>
                      {generatingInsights ? (
                        <>Generating...</>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate AI Insights
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Health Score</div>
                      <div className="flex items-center gap-2">
                        <Progress value={selectedVehicle.health_score} className="flex-1" />
                        <span className="text-sm font-medium">{selectedVehicle.health_score}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Fuel Level</div>
                      <div className="flex items-center gap-2">
                        <Fuel className="h-4 w-4" />
                        <span className="font-medium">{selectedVehicle.fuel_level}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Location</div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="font-medium text-sm">{selectedVehicle.current_location || 'Unknown'}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Status</div>
                      <Badge variant={getStatusColor(selectedVehicle.status) as any}>
                        {selectedVehicle.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Insights and Wellbeing */}
              <Tabs defaultValue="insights" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="insights">
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Insights
                    {unreadInsights.length > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {unreadInsights.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="wellbeing">
                    <Heart className="h-4 w-4 mr-2" />
                    Driver Wellbeing
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="insights" className="space-y-4">
                  {insights.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">No insights yet</p>
                        <Button onClick={generateInsights} disabled={generatingInsights}>
                          Generate AI Insights
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    insights.map((insight) => {
                      const Icon = getInsightIcon(insight.insight_type);
                      return (
                        <Alert
                          key={insight.id}
                          variant={insight.severity === 'high' || insight.severity === 'critical' ? 'destructive' : 'default'}
                          className={insight.is_resolved ? 'opacity-50' : ''}
                        >
                          <Icon className="h-4 w-4" />
                          <AlertTitle className="flex items-center justify-between">
                            <span>{insight.title}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant={getSeverityColor(insight.severity) as any}>
                                {insight.severity}
                              </Badge>
                              {insight.is_resolved && (
                                <Badge variant="outline">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Resolved
                                </Badge>
                              )}
                            </div>
                          </AlertTitle>
                          <AlertDescription className="space-y-3 mt-2">
                            <p>{insight.message}</p>
                            {insight.recommendations && insight.recommendations.length > 0 && (
                              <div>
                                <p className="font-medium text-sm mb-1">Recommendations:</p>
                                <ul className="list-disc list-inside space-y-1">
                                  {insight.recommendations.map((rec, idx) => (
                                    <li key={idx} className="text-sm">{rec}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <div className="flex gap-2 pt-2">
                              {!insight.is_read && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markInsightAsRead(insight.id)}
                                >
                                  Mark as Read
                                </Button>
                              )}
                              {!insight.is_resolved && (
                                <Button
                                  size="sm"
                                  onClick={() => resolveInsight(insight.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Resolve
                                </Button>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground pt-2">
                              {format(new Date(insight.created_at), 'PPp')} • Confidence: {insight.confidence_score}%
                            </div>
                          </AlertDescription>
                        </Alert>
                      );
                    })
                  )}
                </TabsContent>

                <TabsContent value="wellbeing" className="space-y-4">
                  {wellbeingLogs.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No wellbeing logs yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    wellbeingLogs.map((log) => (
                      <Card key={log.id}>
                        <CardHeader>
                          <CardTitle className="text-base">
                            {format(new Date(log.created_at), 'PPp')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <div className="text-sm text-muted-foreground mb-1">Mood</div>
                              <Progress value={log.mood_rating * 20} />
                              <div className="text-xs mt-1">{log.mood_rating}/5</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground mb-1">Fatigue</div>
                              <Progress value={log.fatigue_level * 20} className="bg-orange-200" />
                              <div className="text-xs mt-1">{log.fatigue_level}/5</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground mb-1">Stress</div>
                              <Progress value={log.stress_level * 20} className="bg-red-200" />
                              <div className="text-xs mt-1">{log.stress_level}/5</div>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">Driving Hours</div>
                            <div className="font-medium">{log.driving_hours} hours</div>
                          </div>
                          {log.concerns && (
                            <div>
                              <div className="text-sm text-muted-foreground mb-1">Concerns</div>
                              <p className="text-sm">{log.concerns}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Truck className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Select a vehicle to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
