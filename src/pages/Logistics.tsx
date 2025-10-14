import { useEffect, useState } from "react";
import { Truck, MapPin, Clock, Thermometer } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/StatCard";
import IoTSensorMonitor from "@/components/IoTSensorMonitor";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import { supabase } from "@/integrations/supabase/client";

export default function Logistics() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (data) setShipments(data);
    setLoading(false);
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tracking">Shipment Tracking</TabsTrigger>
          <TabsTrigger value="iot">Temperature Monitoring</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="tracking" className="space-y-6">
          <div className="grid gap-6">
            {shipments.map((shipment) => (
              <Card key={shipment.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5" />
                        {shipment.id}
                      </CardTitle>
                      <CardDescription>Batch: {shipment.batch_id} | Driver: {shipment.driver_name}</CardDescription>
                    </div>
                    <StatusBadge status={shipment.status as any} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Route</p>
                        <p className="text-sm text-muted-foreground">
                          {shipment.from_location} → {shipment.to_location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">ETA</p>
                        <p className="text-sm text-muted-foreground">
                          {shipment.eta ? new Date(shipment.eta).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Thermometer className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Temperature Range</p>
                        <p className="text-sm text-muted-foreground">
                          {shipment.temperature_min || 'N/A'}°C - {shipment.temperature_max || 'N/A'}°C
                        </p>
                      </div>
                    </div>
                  </div>
                  {shipment.gps_latitude && shipment.gps_longitude && (
                    <div className="mt-4 pt-4 border-t">
                      <Badge variant="outline">
                        GPS: {shipment.gps_latitude}, {shipment.gps_longitude}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
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
