import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Activity, AlertTriangle, CheckCircle, Thermometer, MapPin, Battery, Signal } from "lucide-react";

interface IoTSensorMonitorProps {
  shipmentId?: string;
  deviceId?: string;
}

export default function IoTSensorMonitor({ shipmentId, deviceId }: IoTSensorMonitorProps) {
  const [devices, setDevices] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<number>(0);

  useEffect(() => {
    fetchData();

    // Subscribe to real-time events
    const channel = supabase
      .channel('iot-monitor')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'iot_events',
          filter: shipmentId ? `shipment_id=eq.${shipmentId}` : undefined
        }, 
        (payload) => {
          console.log('New IoT event:', payload);
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shipmentId, deviceId]);

  const fetchData = async () => {
    // Fetch devices
    let devicesQuery = supabase.from('iot_devices').select('*');
    
    if (shipmentId) {
      devicesQuery = devicesQuery.eq('shipment_id', shipmentId);
    } else if (deviceId) {
      devicesQuery = devicesQuery.eq('id', deviceId);
    }

    const { data: devicesData } = await devicesQuery;
    setDevices(devicesData || []);

    // Fetch recent events
    let eventsQuery = supabase
      .from('iot_events')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10);

    if (shipmentId) {
      eventsQuery = eventsQuery.eq('shipment_id', shipmentId);
    } else if (deviceId) {
      eventsQuery = eventsQuery.eq('device_id', deviceId);
    }

    const { data: eventsData } = await eventsQuery;
    setEvents(eventsData || []);

    // Count alerts
    const alertCount = eventsData?.filter(e => e.event_type === 'temperature_alert').length || 0;
    setAlerts(alertCount);
  };

  const getDeviceStatus = (device: any) => {
    if (!device.last_ping) return 'inactive';
    
    const lastPing = new Date(device.last_ping).getTime();
    const now = new Date().getTime();
    const minutesSinceLastPing = (now - lastPing) / 1000 / 60;

    if (minutesSinceLastPing < 5) return 'active';
    if (minutesSinceLastPing < 15) return 'warning';
    return 'inactive';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'inactive': return <Activity className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            IoT Sensor Monitor
          </CardTitle>
          <CardDescription>Real-time device status and alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Devices Status */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Connected Devices ({devices.length})</h3>
            <div className="space-y-2">
              {devices.map((device) => {
                const status = getDeviceStatus(device);
                return (
                  <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(status)}
                      <div>
                        <div className="font-medium text-sm">{device.id}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {device.device_type.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <Battery className="h-3 w-3" />
                        {device.battery_level || 0}%
                      </div>
                      <div className="flex items-center gap-1">
                        <Signal className="h-3 w-3" />
                        {device.signal_strength || 0}%
                      </div>
                    </div>
                  </div>
                );
              })}

              {devices.length === 0 && (
                <div className="text-center text-muted-foreground py-4 text-sm">
                  No devices assigned
                </div>
              )}
            </div>
          </div>

          {/* Alerts Summary */}
          {alerts > 0 && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="font-semibold text-sm">{alerts} Active Alert{alerts !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )}

          {/* Recent Events */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Recent Events</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {events.map((event) => (
                <div key={event.id} className="flex items-start gap-2 p-2 border rounded text-sm">
                  <Badge variant={event.event_type === 'temperature_alert' ? 'destructive' : 'secondary'} className="text-xs">
                    {event.event_type}
                  </Badge>
                  
                  <div className="flex-1 space-y-1">
                    <div className="text-xs text-muted-foreground">
                      {event.device_id}
                    </div>
                    
                    {event.gps_latitude && event.gps_longitude && (
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin className="h-3 w-3" />
                        {event.gps_latitude.toFixed(4)}, {event.gps_longitude.toFixed(4)}
                      </div>
                    )}
                    
                    {event.temperature && (
                      <div className="flex items-center gap-1 text-xs">
                        <Thermometer className="h-3 w-3" />
                        {event.temperature}°C
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground">
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}

              {events.length === 0 && (
                <div className="text-center text-muted-foreground py-4 text-xs">
                  No recent events
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
