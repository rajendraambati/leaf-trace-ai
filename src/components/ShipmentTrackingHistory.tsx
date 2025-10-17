import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Clock, Package, Thermometer, Navigation } from "lucide-react";

interface TrackingEvent {
  id: string;
  timestamp: Date;
  event_type: string;
  location?: { lat: number; lng: number };
  temperature?: number;
  event_data: any;
}

interface ShipmentTrackingHistoryProps {
  shipmentId: string;
}

export function ShipmentTrackingHistory({ shipmentId }: ShipmentTrackingHistoryProps) {
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrackingHistory();

    // Subscribe to real-time events
    const channel = supabase
      .channel(`tracking-${shipmentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "iot_events",
          filter: `shipment_id=eq.${shipmentId}`,
        },
        () => {
          fetchTrackingHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shipmentId]);

  const fetchTrackingHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("iot_events")
      .select("*")
      .eq("shipment_id", shipmentId)
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Failed to fetch tracking history:", error);
      setLoading(false);
      return;
    }

    const formattedEvents: TrackingEvent[] = (data || []).map((event) => ({
      id: event.id,
      timestamp: new Date(event.timestamp),
      event_type: event.event_type,
      location:
        event.gps_latitude && event.gps_longitude
          ? { lat: event.gps_latitude, lng: event.gps_longitude }
          : undefined,
      temperature: event.temperature || undefined,
      event_data: event.event_data,
    }));

    setEvents(formattedEvents);
    setLoading(false);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "gps_update":
        return <Navigation className="h-4 w-4" />;
      case "temperature_reading":
        return <Thermometer className="h-4 w-4" />;
      case "checkpoint":
        return <MapPin className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "gps_update":
        return "bg-blue-500/10 text-blue-500";
      case "temperature_reading":
        return "bg-orange-500/10 text-orange-500";
      case "checkpoint":
        return "bg-green-500/10 text-green-500";
      case "anomaly":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Tracking History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">Loading tracking history...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Tracking History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No tracking events recorded yet</p>
        ) : (
          <div className="space-y-4">
            {events.map((event, index) => (
              <div
                key={event.id}
                className="flex gap-4 pb-4 border-b last:border-b-0 last:pb-0"
              >
                <div className="flex flex-col items-center">
                  <div className={`p-2 rounded-full ${getEventColor(event.event_type)}`}>
                    {getEventIcon(event.event_type)}
                  </div>
                  {index < events.length - 1 && (
                    <div className="w-px h-full bg-border mt-2" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="capitalize">
                      {event.event_type.replace("_", " ")}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {event.timestamp.toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm">
                    {event.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>
                          {event.location.lat.toFixed(4)}, {event.location.lng.toFixed(4)}
                        </span>
                      </div>
                    )}

                    {event.temperature !== undefined && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Thermometer className="h-3 w-3" />
                        <span>{event.temperature.toFixed(1)}°C</span>
                      </div>
                    )}

                    {event.event_data?.message && (
                      <p className="text-muted-foreground">{event.event_data.message}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
