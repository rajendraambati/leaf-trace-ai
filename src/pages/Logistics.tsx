import { useEffect, useState } from "react";
import { Truck, MapPin, Clock, Thermometer, Route as RouteIcon, Activity, AlertTriangle, Navigation } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/StatCard";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import { IoTTracker } from "@/components/IoTTracker";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { MapView, Location } from "@/components/MapView";
import { ShipmentCreationForm } from "@/components/ShipmentCreationForm";
import { LiveShipmentTracker } from "@/components/LiveShipmentTracker";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuditLog } from "@/hooks/useAuditLog";

export default function Logistics() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
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
    
    // Fetch batches for moisture data
    const { data: batchData } = await supabase.from('procurement_batches').select('*');
    if (batchData) {
      setBatches(batchData);
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

  const inTransit = shipments.filter(s => s.status === 'in-transit').length;
  const delivered = shipments.filter(s => s.status === 'delivered').length;
  const totalShipments = shipments.length;

  const markInTransit = async (shipmentId: string) => {
    const { error } = await supabase
      .from('shipments')
      .update({ status: 'in-transit', departure_time: new Date().toISOString() })
      .eq('id', shipmentId);

    if (error) {
      toast.error('Failed to mark as in transit');
      return;
    }

    await logAction({
      action: 'shipment_in_transit',
      resource: 'shipment',
      resourceId: shipmentId
    });

    toast.success('Shipment marked as in transit! 🚚');
    fetchShipments();
  };

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
        <StatCard title="Total Shipments" value={totalShipments.toString()} icon={Truck} />
        <StatCard title="In Transit" value={inTransit.toString()} icon={MapPin} />
        <StatCard title="Delivered Today" value={delivered.toString()} icon={Clock} />
      </div>

      <Tabs defaultValue="tracking" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
          <TabsTrigger value="temperature">Temperature</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-4">
          <LiveShipmentTracker />
        </TabsContent>

        <TabsContent value="tracking" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  GPS Vehicle Tracking
                </CardTitle>
                <CardDescription>Real-time location monitoring of all active shipments</CardDescription>
              </CardHeader>
              <CardContent>
                <MapView locations={locations} />
              </CardContent>
            </Card>

            <div className="space-y-4">
              {shipments.map((shipment) => (
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
                      <div className="flex gap-2 mt-2">
                        <Button 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); markInTransit(shipment.id); }} 
                          className="flex-1"
                          disabled={shipment.status === 'in-transit' || shipment.status === 'delivered'}
                        >
                          Transit
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); confirmDelivery(shipment.id); }} 
                          className="flex-1"
                          disabled={shipment.status !== 'in-transit'}
                        >
                          Delivered
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {shipments.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No shipments available</p>
              )}
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

        <TabsContent value="temperature" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Temperature & Moisture Tracking</CardTitle>
              <CardDescription>Monitor temperature and moisture percentage for all shipments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shipments.map((shipment) => {
                  const batch = batches.find(b => b.id === shipment.batch_id);
                  return (
                    <div key={shipment.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Shipment: {shipment.id}</h3>
                        <StatusBadge status={shipment.status} />
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Temperature Range</p>
                          <p className="text-lg font-medium">
                            {shipment.temperature_min || 'N/A'}°C - {shipment.temperature_max || 'N/A'}°C
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Moisture Percentage</p>
                          <p className="text-lg font-medium">
                            {batch?.moisture_percentage ? `${batch.moisture_percentage}%` : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Batch ID: {shipment.batch_id}
                      </div>
                    </div>
                  );
                })}
                {shipments.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No shipments available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shipment Status Overview</CardTitle>
              <CardDescription>Track the status of all shipments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold">Shipment ID</th>
                      <th className="text-center p-4 font-semibold">In Transit</th>
                      <th className="text-center p-4 font-semibold">Delivered Today</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipments.map((shipment) => (
                      <tr key={shipment.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">{shipment.id}</td>
                        <td className="p-4 text-center">
                          {(shipment.status === 'in-transit' || shipment.status === 'delivered') && (
                            <span className="text-green-600 text-2xl">✓</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {shipment.status === 'delivered' && (
                            <span className="text-green-600 text-2xl">✓</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {shipments.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No shipments available</p>
                )}
              </div>
            </CardContent>
          </Card>
          <AnalyticsDashboard moduleType="logistics" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
