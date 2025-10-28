import { useEffect, useMemo } from "react";
import { MapPin } from "lucide-react";
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from "react-leaflet";
import type React from "react";

const AnyMapContainer = MapContainer as unknown as React.ComponentType<any>;
const AnyTileLayer = TileLayer as unknown as React.ComponentType<any>;
const AnyCircleMarker = CircleMarker as unknown as React.ComponentType<any>;
const AnyPolyline = Polyline as unknown as React.ComponentType<any>;


export interface Location {
  lat: number;
  lng: number;
  name: string;
  status?: string;
}

interface MapViewProps {
  locations: Location[];
}

function FitToMarkers({ points }: { points: { lat: number; lng: number }[] }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 15, { animate: true });
      return;
    }
    const bounds = points.map((p) => [p.lat, p.lng]) as [number, number][];
    map.fitBounds(bounds as any, { padding: [40, 40] } as any);
  }, [points, map]);
  return null;
}

export function MapView({ locations }: MapViewProps) {
  const hasPoints = locations && locations.length > 0;
  const center = hasPoints ? [locations[0].lat, locations[0].lng] : [20, 0];

  const polyline = useMemo(() => locations.map((l) => [l.lat, l.lng]) as [number, number][], [locations]);

  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden border border-border bg-card">
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Location Tracking
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {locations.length} location(s) being tracked
          </p>
        </div>
        <div className="flex-1">
          <AnyMapContainer center={center as any} zoom={13} className="h-full w-full">
            <>
              <AnyTileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitToMarkers points={locations.map((l) => ({ lat: l.lat, lng: l.lng }))} />
              {hasPoints && polyline.length > 1 && (
                <AnyPolyline positions={polyline as any} pathOptions={{ color: "hsl(var(--primary))", weight: 4, opacity: 0.6 }} />
              )}
              {locations.map((loc, idx) => (
                <AnyCircleMarker
                  key={idx}
                  center={[loc.lat, loc.lng] as any}
                  radius={8}
                  pathOptions={{
                    color: loc.status === "warning" ? "hsl(var(--warning))" : loc.status === "danger" ? "hsl(var(--destructive))" : "hsl(var(--success))",
                    fillColor: loc.status === "warning" ? "hsl(var(--warning))" : loc.status === "danger" ? "hsl(var(--destructive))" : "hsl(var(--success))",
                    fillOpacity: 0.85,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{loc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {loc.lat.toFixed(6)}, {loc.lng.toFixed(6)}
                      </p>
                      {loc.status && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-success/10 text-success">
                          {loc.status}
                        </span>
                      )}
                    </div>
                  </Popup>
                </AnyCircleMarker>
              ))}
            </>
          </AnyMapContainer>
        </div>
      </div>
    </div>
  );
}

