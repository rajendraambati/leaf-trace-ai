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
import { ShipmentCreationForm } from "@/components/ShipmentCreationForm";
import { ShipmentTrackingHistory } from "@/components/ShipmentTrackingHistory";
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

    // Enhanced real-time subscription with detailed notifications
    const channel = supabase
      .channel('shipments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shipments',
        },
        (payload) => {
          console.log('Shipment change detected:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newShipment = payload.new as any;
            setShipments((prev) => [newShipment, ...prev]);
            toast.success(`New shipment created: ${newShipment.id}`);
          } else if (payload.eventType === 'UPDATE') {
            const updatedShipment = payload.new as any;
            setShipments((prev) =>
              prev.map((s) => (s.id === updatedShipment.id ? { ...s, ...updatedShipment } : s))
            );
            
            // Show specific notification based on status change
            if (updatedShipment.status === 'delivered') {
              toast.success(`✅ Shipment ${updatedShipment.id} delivered!`);
            } else if (updatedShipment.status === 'in_transit') {
              toast.info(`🚚 Shipment ${updatedShipment.id} is now in transit`);
            } else {
              toast.info(`📦 Shipment ${updatedShipment.id} updated`);
            }
            
            // Update selected shipment if it's the one being updated
            if (selectedShipment?.id === updatedShipment.id) {
              setSelectedShipment({ ...selectedShipment, ...updatedShipment });
            }
          } else if (payload.eventType === 'DELETE') {
            setShipments((prev) => prev.filter((s) => s.id !== payload.old.id));
            toast.info('Shipment removed');
          }
          
          // Refresh locations for map
          fetchShipments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedShipment]);

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

    // Note: Batch status is automatically updated to 'delivered' by database trigger

    await logAction({
      action: 'delivery_confirmed',
      resource: 'shipment',
      resourceId: shipmentId
    });

    toast.success('Delivery confirmed! 🎉');
    fetchShipments();
  };

  const inTransit = shipments.filter(s => s.status === 'in_transit').length;
  const delivered = shipments.filter(s => s.status === 'delivered').length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Logistics Tracking</h1>
          <p className="text-muted-foreground mt-2">
            Real-time shipment tracking, GPS monitoring, and temperature control
          </p>
        </div>
        <ShipmentCreationForm />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <StatCard title="In Transit" value={inTransit.toString()} icon={Truck} />
        <StatCard title="Delivered Today" value={delivered.toString()} icon={MapPin} />
        <StatCard title="Total Shipments" value={shipments.length.toString()} icon={Clock} />
      </div>

      <Tabs defaultValue="tracking" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
          <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
          <TabsTrigger value="history">Movement</TabsTrigger>
          <TabsTrigger value="ai">AI Monitor</TabsTrigger>
          <TabsTrigger value="route">Route</TabsTrigger>
          <TabsTrigger value="realtime">Live IoT</TabsTrigger>
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

        <TabsContent value="lifecycle" className="space-y-6">
          {selectedShipment ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Shipment Lifecycle - {selectedShipment.id}
                </CardTitle>
                <CardDescription>Complete journey from origin to destination</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Current Status Summary */}
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Status</p>
                      <div className="mt-1">
                        <StatusBadge status={selectedShipment.status} />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Last Updated</p>
                      <p className="font-medium text-sm">
                        {new Date(selectedShipment.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Lifecycle Timeline */}
                  <div className="space-y-4">
                    {/* Step 1: Creation/Pending */}
                    <div className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <div className="w-0.5 h-full bg-border mt-2" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">Shipment Created</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(selectedShipment.created_at).toLocaleString()}
                        </p>
                        <div className="mt-2 space-y-1 text-sm">
                          <p><span className="text-muted-foreground">Batch:</span> {selectedShipment.batch_id}</p>
                          <p><span className="text-muted-foreground">Origin:</span> {selectedShipment.from_location}</p>
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Departure */}
                    {selectedShipment.departure_time && (
                      <div className="flex items-start gap-4 p-4 border rounded-lg">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <div className="w-0.5 h-full bg-border mt-2" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">Departed</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(selectedShipment.departure_time).toLocaleString()}
                          </p>
                          <div className="mt-2 space-y-1 text-sm">
                            <p><span className="text-muted-foreground">Vehicle:</span> {selectedShipment.vehicle_id}</p>
                            <p><span className="text-muted-foreground">Driver:</span> {selectedShipment.driver_name}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 3: In Transit */}
                    {selectedShipment.status === 'in_transit' && (
                      <div className="flex items-start gap-4 p-4 border rounded-lg bg-primary/5 animate-pulse">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-primary" />
                          <div className="w-0.5 h-full bg-border mt-2" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            In Transit
                          </p>
                          <p className="text-sm text-muted-foreground">Currently on the way</p>
                          <div className="mt-2 space-y-1 text-sm">
                            {selectedShipment.eta && (
                              <p><span className="text-muted-foreground">ETA:</span> {new Date(selectedShipment.eta).toLocaleString()}</p>
                            )}
                            {selectedShipment.gps_latitude && selectedShipment.gps_longitude && (
                              <p><span className="text-muted-foreground">Location:</span> {selectedShipment.gps_latitude.toFixed(4)}, {selectedShipment.gps_longitude.toFixed(4)}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 4: Delivered */}
                    <div className={`flex items-start gap-4 p-4 border rounded-lg ${
                      selectedShipment.status === 'delivered' ? 'bg-green-50 dark:bg-green-950' : 'opacity-50'
                    }`}>
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${
                          selectedShipment.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">Arrival at Destination</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedShipment.to_location}
                        </p>
                        {selectedShipment.actual_arrival ? (
                          <div className="mt-2 space-y-1 text-sm">
                            <p><span className="text-muted-foreground">Delivered:</span> {new Date(selectedShipment.actual_arrival).toLocaleString()}</p>
                            <Badge variant="default" className="bg-green-500">✓ Completed</Badge>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground mt-2">Awaiting delivery confirmation</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Temperature Summary if available */}
                  {(selectedShipment.temperature_min || selectedShipment.temperature_max) && (
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Thermometer className="h-4 w-4" />
                        <p className="font-semibold">Temperature Monitoring</p>
                      </div>
                      <div className="flex gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Min</p>
                          <p className="font-medium">{selectedShipment.temperature_min || 'N/A'}°C</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Max</p>
                          <p className="font-medium">{selectedShipment.temperature_max || 'N/A'}°C</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Select a shipment from Tracking tab to view lifecycle</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {selectedShipment ? (
            <ShipmentTrackingHistory shipmentId={selectedShipment.id} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Select a shipment from Tracking tab to view movement history</p>
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
