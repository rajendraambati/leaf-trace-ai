import { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { MapPin, Navigation, Clock, Thermometer } from "lucide-react";
import { toast } from "sonner";

interface ShipmentData {
  id: string;
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
  const [shipmentId, setShipmentId] = useState("");
  const [shipmentData, setShipmentData] = useState<ShipmentData | null>(null);
  const [tracking, setTracking] = useState(false);
  const [mapboxToken, setMapboxToken] = useState("");
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    // Check for Mapbox token
    const token = localStorage.getItem("mapbox_token");
    if (token) {
      setMapboxToken(token);
      mapboxgl.accessToken = token;
    }
  }, []);

  const initializeMap = (lat: number, lng: number) => {
    if (!mapContainer.current || !mapboxToken) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [lng, lat],
      zoom: 13,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");

    // Create custom marker
    const el = document.createElement("div");
    el.className = "custom-marker";
    el.style.backgroundImage = "url(https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png)";
    el.style.width = "32px";
    el.style.height = "40px";
    el.style.backgroundSize = "100%";

    marker.current = new mapboxgl.Marker(el)
      .setLngLat([lng, lat])
      .addTo(map.current);
  };

  const updateMarkerPosition = (lat: number, lng: number) => {
    if (marker.current && map.current) {
      marker.current.setLngLat([lng, lat]);
      map.current.flyTo({
        center: [lng, lat],
        zoom: 14,
        essential: true,
      });
    }
  };

  const startTracking = async () => {
    if (!shipmentId.trim()) {
      toast.error("Please enter a shipment ID");
      return;
    }

    if (!mapboxToken) {
      toast.error("Please enter your Mapbox token first");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("shipments")
        .select("*")
        .eq("id", shipmentId.trim())
        .single();

      if (error) throw error;

      if (!data) {
        toast.error("Shipment not found");
        return;
      }

      setShipmentData(data);
      setTracking(true);

      if (data.gps_latitude && data.gps_longitude) {
        initializeMap(data.gps_latitude, data.gps_longitude);
      } else {
        toast.error("No GPS data available for this shipment");
      }

      // Set up real-time subscription
      const channel = supabase
        .channel(`shipment-${shipmentId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "shipments",
            filter: `id=eq.${shipmentId}`,
          },
          (payload) => {
            const newData = payload.new as ShipmentData;
            setShipmentData(newData);
            
            if (newData.gps_latitude && newData.gps_longitude) {
              updateMarkerPosition(newData.gps_latitude, newData.gps_longitude);
              toast.success("Location updated");
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error: any) {
      toast.error(error.message || "Failed to load shipment");
    }
  };

  const stopTracking = () => {
    setTracking(false);
    setShipmentData(null);
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
    marker.current = null;
  };

  if (!mapboxToken) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Configure Mapbox</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Enter your Mapbox access token to enable live tracking.{" "}
          <a
            href="https://account.mapbox.com/access-tokens/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Get token here
          </a>
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="pk.eyJ1Ijo..."
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
          />
          <Button
            onClick={() => {
              if (mapboxToken.trim()) {
                localStorage.setItem("mapbox_token", mapboxToken.trim());
                mapboxgl.accessToken = mapboxToken.trim();
                toast.success("Mapbox token saved");
              }
            }}
          >
            Save
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter Shipment ID (e.g., SHIP-001)"
            value={shipmentId}
            onChange={(e) => setShipmentId(e.target.value)}
            disabled={tracking}
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

      {tracking && shipmentData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">From</p>
                <p className="font-medium">{shipmentData.from_location}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">To</p>
                <p className="font-medium">{shipmentData.to_location}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{shipmentData.status}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Temperature</p>
                <p className="font-medium">
                  {shipmentData.temperature_max ? `${shipmentData.temperature_max}°C` : "N/A"}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tracking && (
        <Card className="overflow-hidden">
          <div
            ref={mapContainer}
            className="h-[500px] w-full"
            style={{ minHeight: "500px" }}
          />
        </Card>
      )}
    </div>
  );
}
