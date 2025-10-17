import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { MapPin, Navigation, Clock, Thermometer, Package } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface ShipmentData {
  id: string;
  batch_id: string;
  status: string;
  from_location: string;
  to_location: string;
  gps_latitude: number | null;
  gps_longitude: number | null;
  temperature_max: number | null;
  vehicle_id: string | null;
  driver_name: string | null;
  eta: string | null;
  departure_time: string | null;
}

export function LiveShipmentTracker() {
  const [searchId, setSearchId] = useState("");
  const [searchType, setSearchType] = useState<"shipment" | "batch">("shipment");
  const [shipmentData, setShipmentData] = useState<ShipmentData[]>([]);
  const [tracking, setTracking] = useState(false);

  const startTracking = async () => {
    if (!searchId.trim()) {
      toast.error(`Please enter a ${searchType} ID`);
      return;
    }

    try {
      let query = supabase.from("shipments").select("*");
      
      if (searchType === "shipment") {
        query = query.eq("id", searchId.trim());
      } else {
        query = query.eq("batch_id", searchId.trim());
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error(`No shipments found for this ${searchType} ID`);
        return;
      }

      setShipmentData(data);
      setTracking(true);
      toast.success(`Tracking ${data.length} shipment(s)`);

      // Set up real-time subscription for all shipments
      const shipmentIds = data.map(s => s.id);
      const channel = supabase
        .channel(`tracking-${searchId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "shipments",
          },
          (payload) => {
            const updatedShipment = payload.new as ShipmentData;
            if (shipmentIds.includes(updatedShipment.id)) {
              setShipmentData(prev => 
                prev.map(s => s.id === updatedShipment.id ? updatedShipment : s)
              );
              toast.success(`${updatedShipment.id} location updated`);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error: any) {
      toast.error(error.message || "Failed to load shipment data");
    }
  };

  const stopTracking = () => {
    setTracking(false);
    setShipmentData([]);
  };

  const getMapUrl = (lat: number, lng: number) => {
    // OpenStreetMap with marker
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lng}`;
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <Tabs value={searchType} onValueChange={(v) => setSearchType(v as "shipment" | "batch")}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="shipment">Track by Shipment ID</TabsTrigger>
            <TabsTrigger value="batch">Track by Batch ID</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex gap-2">
          <Input
            placeholder={`Enter ${searchType === "shipment" ? "Shipment ID (e.g., SHP-001)" : "Batch ID (e.g., BATCH-001)"}`}
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            disabled={tracking}
            onKeyPress={(e) => e.key === "Enter" && startTracking()}
          />
          {!tracking ? (
            <Button onClick={startTracking}>Track</Button>
          ) : (
            <Button variant="destructive" onClick={stopTracking}>
              Stop
            </Button>
          )}
        </div>
      </Card>

      {tracking && shipmentData.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Tracking</p>
                  <p className="font-medium">{shipmentData.length} Shipment(s)</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">In Transit</p>
                  <p className="font-medium">
                    {shipmentData.filter(s => s.status === "in-transit").length}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Delivered</p>
                  <p className="font-medium">
                    {shipmentData.filter(s => s.status === "delivered").length}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Temp</p>
                  <p className="font-medium">
                    {shipmentData.some(s => s.temperature_max) 
                      ? `${Math.round(shipmentData.filter(s => s.temperature_max).reduce((acc, s) => acc + (s.temperature_max || 0), 0) / shipmentData.filter(s => s.temperature_max).length)}°C`
                      : "N/A"}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            {shipmentData.map((shipment) => (
              <Card key={shipment.id} className="overflow-hidden">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{shipment.id}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      shipment.status === "delivered" ? "bg-success/10 text-success" :
                      shipment.status === "in-transit" ? "bg-primary/10 text-primary" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {shipment.status}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Batch ID</p>
                      <p className="font-medium">{shipment.batch_id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Vehicle</p>
                      <p className="font-medium">{shipment.vehicle_id || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">From</p>
                      <p className="font-medium">{shipment.from_location}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">To</p>
                      <p className="font-medium">{shipment.to_location}</p>
                    </div>
                    {shipment.driver_name && (
                      <div>
                        <p className="text-muted-foreground">Driver</p>
                        <p className="font-medium">{shipment.driver_name}</p>
                      </div>
                    )}
                    {shipment.temperature_max && (
                      <div>
                        <p className="text-muted-foreground">Temperature</p>
                        <p className="font-medium">{shipment.temperature_max}°C</p>
                      </div>
                    )}
                  </div>
                  
                  {shipment.gps_latitude && shipment.gps_longitude ? (
                    <>
                      <div className="flex items-center gap-2 text-sm text-success">
                        <MapPin className="h-4 w-4" />
                        <span>GPS: {shipment.gps_latitude.toFixed(4)}, {shipment.gps_longitude.toFixed(4)}</span>
                      </div>
                      <div className="h-64 w-full rounded border overflow-hidden">
                        <iframe
                          title={`Map for ${shipment.id}`}
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          scrolling="no"
                          src={getMapUrl(shipment.gps_latitude, shipment.gps_longitude)}
                          className="border-0"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(`https://www.google.com/maps?q=${shipment.gps_latitude},${shipment.gps_longitude}`, '_blank')}
                          className="flex-1"
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          Open in Google Maps
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(`https://www.openstreetmap.org/?mlat=${shipment.gps_latitude}&mlon=${shipment.gps_longitude}&zoom=15`, '_blank')}
                          className="flex-1"
                        >
                          <Navigation className="h-3 w-3 mr-1" />
                          Open in OSM
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="h-64 flex items-center justify-center bg-muted rounded border">
                      <div className="text-center text-muted-foreground">
                        <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No GPS data available</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
