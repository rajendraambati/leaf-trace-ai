import { useEffect, useState } from "react";
import { Truck, MapPin, Clock, Thermometer, Route as RouteIcon, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/StatCard";
import IoTSensorMonitor from "@/components/IoTSensorMonitor";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import { RouteOptimization } from "@/components/RouteOptimization";
import { IoTTracker } from "@/components/IoTTracker";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { MapView, Location } from "@/components/MapView";
import AILogisticsMonitor from "@/components/AILogisticsMonitor";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuditLog } from "@/hooks/useAuditLog";

export default function Logistics() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const { logAction } = useAuditLog();

  useEffect(() => {
    fetchShipments();

    const channel = supabase
      .channel('shipments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, fetchShipments)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchShipments = async () => {
    const { data } = await supabase.from('shipments').select('*').order('created_at', { ascending: false });
    if (data) {
      setShipments(data);
      // Update map locations
      const locs: Location[] = data
        .filter(s => s.gps_latitude && s.gps_longitude)
        .map(s => ({
          lat: s.gps_latitude,
          lng: s.gps_longitude,
          name: s.id,
          status: s.status
        }));
      setLocations(locs);
    }
    setLoading(false);
  };

  const assignVehicle = async (shipmentId: string, vehicleId: string, driverName: string) => {
    const { error } = await supabase
      .from('shipments')
      .update({ vehicle_id: vehicleId, driver_name: driverName, status: 'assigned' })
      .eq('id', shipmentId);

    if (error) {
      toast.error('Failed to assign vehicle');
      return;
    }

    await logAction({
      action: 'vehicle_assignment',
      resource: 'shipment',
      resourceId: shipmentId,
      dataSnapshot: { vehicleId, driverName }
    });

    toast.success('Vehicle assigned successfully!');
    fetchShipments();
  };

  const confirmDelivery = async (shipmentId: string) => {
    const { error } = await supabase
      .from('shipments')
      .update({ 
        status: 'delivered',
        actual_arrival: new Date().toISOString()
      })
      .eq('id', shipmentId);

    if (error) {
      toast.error('Failed to confirm delivery');
      return;
    }

    await logAction({
      action: 'delivery_confirmed',
      resource: 'shipment',
      resourceId: shipmentId
    });

    toast.success('Delivery confirmed!');
    fetchShipments();
  };

  const inTransit = shipments.filter(s => s.status === 'in_transit').length;
  const delivered = shipments.filter(s => s.status === 'delivered').length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Logistics Tracking</h1>
        <p className="text-muted-foreground mt-2">
          Real-time shipment tracking, GPS monitoring, and temperature control
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <StatCard title="In Transit" value={inTransit.toString()} icon={Truck} />
        <StatCard title="Delivered Today" value={delivered.toString()} icon={MapPin} />
        <StatCard title="Total Shipments" value={shipments.length.toString()} icon={Clock} />
      </div>

      <Tabs defaultValue="tracking" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
          <TabsTrigger value="ai">AI Monitor</TabsTrigger>
          <TabsTrigger value="route">Route Optimization</TabsTrigger>
          <TabsTrigger value="realtime">Real-Time IoT</TabsTrigger>
          <TabsTrigger value="iot">Temperature</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="tracking" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Live Map View</CardTitle>
              </CardHeader>
              <CardContent>
                <MapView locations={locations} />
              </CardContent>
            </Card>

            <div className="space-y-4">
              {shipments.slice(0, 3).map((shipment) => (
                <Card key={shipment.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedShipment(shipment)}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Truck className="h-4 w-4" />
                          {shipment.id}
                        </CardTitle>
                        <CardDescription className="text-xs">Batch: {shipment.batch_id}</CardDescription>
                      </div>
                      <StatusBadge status={shipment.status as any} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Route:</span>
                        <span className="font-medium">{shipment.from_location} → {shipment.to_location}</span>
                      </div>
                      {shipment.eta && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ETA:</span>
                          <span className="font-medium">{new Date(shipment.eta).toLocaleTimeString()}</span>
                        </div>
                      )}
                      {shipment.status === 'in_transit' && (
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); confirmDelivery(shipment.id); }} className="w-full mt-2">
                          Confirm Delivery
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {selectedShipment && (
            <Card>
              <CardHeader>
                <CardTitle>Shipment Details - {selectedShipment.id}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <QRCodeDisplay 
                    data={JSON.stringify({ 
                      shipmentId: selectedShipment.id, 
                      batchId: selectedShipment.batch_id,
                      type: 'shipment_tracking'
                    })}
                    title="Shipment QR Code"
                    size={150}
                  />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Vehicle ID</p>
                      <p className="font-medium">{selectedShipment.vehicle_id || 'Not assigned'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Driver</p>
                      <p className="font-medium">{selectedShipment.driver_name || 'Not assigned'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Departure</p>
                      <p className="font-medium">
                        {selectedShipment.departure_time ? new Date(selectedShipment.departure_time).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Arrival</p>
                      <p className="font-medium">
                        {selectedShipment.actual_arrival ? new Date(selectedShipment.actual_arrival).toLocaleString() : 'In transit'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          {selectedShipment ? (
            <AILogisticsMonitor
              shipmentId={selectedShipment.id}
              origin={{ 
                lat: 17.4, 
                lng: 78.4, 
                name: selectedShipment.from_location 
              }}
              destination={{ 
                lat: 17.5, 
                lng: 78.5, 
                name: selectedShipment.to_location 
              }}
              currentLocation={
                selectedShipment.gps_latitude && selectedShipment.gps_longitude
                  ? { lat: selectedShipment.gps_latitude, lng: selectedShipment.gps_longitude }
                  : undefined
              }
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Select a shipment from Tracking tab to enable AI monitoring</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="route" className="space-y-6">
          {selectedShipment ? (
            <RouteOptimization
              shipmentId={selectedShipment.id}
              origin={{ lat: 17.4, lng: 78.4, name: selectedShipment.from_location }}
              destination={{ lat: 17.5, lng: 78.5, name: selectedShipment.to_location }}
              onOptimized={(route) => console.log('Route optimized:', route)}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Select a shipment from Tracking tab to optimize route</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {shipments.filter(s => s.status === 'in_transit').slice(0, 2).map((shipment) => (
              <IoTTracker 
                key={shipment.id}
                shipmentId={shipment.id}
                onLocationUpdate={(lat, lng) => {
                  // Update location in real-time
                  supabase.from('shipments')
                    .update({ gps_latitude: lat, gps_longitude: lng })
                    .eq('id', shipment.id);
                }}
              />
            ))}
          </div>
          {shipments.filter(s => s.status === 'in_transit').length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No shipments in transit</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="iot" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Temperature Monitoring</CardTitle>
              <CardDescription>Real-time temperature tracking for all shipments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shipments.filter(s => s.status === 'in_transit').map((shipment) => (
                  <div key={shipment.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{shipment.id}</p>
                        <p className="text-sm text-muted-foreground">Vehicle: {shipment.vehicle_id}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          (shipment.temperature_max || 0) > 30 ? "destructive" : "default"
                        }>
                          {shipment.temperature_min || 'N/A'}°C - {shipment.temperature_max || 'N/A'}°C
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsDashboard moduleType="logistics" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
