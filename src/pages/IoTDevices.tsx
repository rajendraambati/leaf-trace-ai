import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Activity, Battery, Signal, Thermometer, MapPin, QrCode, Package } from "lucide-react";

export default function IoTDevices() {
  const [devices, setDevices] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);

  // New device form
  const [newDevice, setNewDevice] = useState({
    id: '',
    device_type: 'gps_tracker',
    shipment_id: '',
    firmware_version: '1.0.0',
    location: ''
  });

  useEffect(() => {
    fetchDevices();
    fetchEvents();

    // Subscribe to real-time updates
    const devicesChannel = supabase
      .channel('iot-devices-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'iot_devices' }, fetchDevices)
      .subscribe();

    const eventsChannel = supabase
      .channel('iot-events-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'iot_events' }, fetchEvents)
      .subscribe();

    return () => {
      supabase.removeChannel(devicesChannel);
      supabase.removeChannel(eventsChannel);
    };
  }, []);

  const fetchDevices = async () => {
    const { data, error } = await supabase
      .from('iot_devices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching devices:', error);
      toast.error('Failed to load devices');
    } else {
      setDevices(data || []);
    }
    setLoading(false);
  };

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('iot_events')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching events:', error);
    } else {
      setEvents(data || []);
    }
  };

  const registerDevice = async () => {
    if (!newDevice.id || !newDevice.device_type) {
      toast.error('Device ID and type are required');
      return;
    }

    const { error } = await supabase
      .from('iot_devices')
      .insert({
        ...newDevice,
        status: 'active',
        battery_level: 100,
        signal_strength: 100,
        last_ping: new Date().toISOString()
      });

    if (error) {
      toast.error('Failed to register device: ' + error.message);
    } else {
      toast.success('Device registered successfully');
      setNewDevice({
        id: '',
        device_type: 'gps_tracker',
        shipment_id: '',
        firmware_version: '1.0.0',
        location: ''
      });
      fetchDevices();
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'gps_tracker': return <MapPin className="h-4 w-4" />;
      case 'qr_scanner': return <QrCode className="h-4 w-4" />;
      case 'vehicle_sensor': return <Package className="h-4 w-4" />;
      case 'temperature_sensor': return <Thermometer className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'maintenance': return 'destructive';
      default: return 'outline';
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'departure': return 'default';
      case 'checkpoint': return 'secondary';
      case 'arrival': return 'default';
      case 'inspection': return 'outline';
      case 'temperature_alert': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">IoT Device Management</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and manage GPS trackers, QR scanners, and vehicle sensors
        </p>
      </div>

      <Tabs defaultValue="devices" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="events">Events Log</TabsTrigger>
          <TabsTrigger value="register">Register Device</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {devices.map((device) => (
              <Card key={device.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedDevice(device)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(device.device_type)}
                      <CardTitle className="text-lg">{device.id}</CardTitle>
                    </div>
                    <Badge variant={getStatusColor(device.status) as any}>
                      {device.status}
                    </Badge>
                  </div>
                  <CardDescription className="capitalize">
                    {device.device_type.replace('_', ' ')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {device.shipment_id && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Shipment:</span>
                      <span className="ml-2 font-medium">{device.shipment_id}</span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Battery className="h-3 w-3 text-muted-foreground" />
                      <span>{device.battery_level || 0}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Signal className="h-3 w-3 text-muted-foreground" />
                      <span>{device.signal_strength || 0}%</span>
                    </div>
                  </div>

                  {device.last_ping && (
                    <div className="text-xs text-muted-foreground">
                      Last ping: {new Date(device.last_ping).toLocaleString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {devices.length === 0 && !loading && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No IoT devices registered yet
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent IoT Events</CardTitle>
              <CardDescription>Real-time event log from all devices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {events.map((event) => (
                  <div key={event.id} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getEventTypeColor(event.event_type) as any}>
                          {event.event_type}
                        </Badge>
                        <span className="text-sm font-medium">{event.device_id}</span>
                      </div>
                      
                      {event.shipment_id && (
                        <div className="text-sm text-muted-foreground">
                          Shipment: {event.shipment_id}
                        </div>
                      )}

                      {event.gps_latitude && event.gps_longitude && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {event.gps_latitude.toFixed(4)}, {event.gps_longitude.toFixed(4)}
                        </div>
                      )}

                      {event.temperature && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Thermometer className="h-3 w-3" />
                          {event.temperature}°C
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground text-right">
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}

                {events.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No events recorded yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle>Register New IoT Device</CardTitle>
              <CardDescription>Add a new GPS tracker, QR scanner, or sensor to the system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="device-id">Device ID *</Label>
                  <Input
                    id="device-id"
                    placeholder="e.g., GPS-001"
                    value={newDevice.id}
                    onChange={(e) => setNewDevice({ ...newDevice, id: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="device-type">Device Type *</Label>
                  <Select value={newDevice.device_type} onValueChange={(value) => setNewDevice({ ...newDevice, device_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gps_tracker">GPS Tracker</SelectItem>
                      <SelectItem value="qr_scanner">QR Scanner</SelectItem>
                      <SelectItem value="vehicle_sensor">Vehicle Sensor</SelectItem>
                      <SelectItem value="temperature_sensor">Temperature Sensor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shipment-id">Shipment ID (Optional)</Label>
                  <Input
                    id="shipment-id"
                    placeholder="e.g., SHIP-12345"
                    value={newDevice.shipment_id}
                    onChange={(e) => setNewDevice({ ...newDevice, shipment_id: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Warehouse A"
                    value={newDevice.location}
                    onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firmware">Firmware Version</Label>
                  <Input
                    id="firmware"
                    value={newDevice.firmware_version}
                    onChange={(e) => setNewDevice({ ...newDevice, firmware_version: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={registerDevice} className="w-full">
                Register Device
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
