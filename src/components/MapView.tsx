import { useEffect, useMemo, useRef } from "react";
import { MapPin } from "lucide-react";
import L from "leaflet";
import type React from "react";


export interface Location {
  lat: number;
  lng: number;
  name: string;
  status?: string;
}

interface MapViewProps {
  locations: Location[];
}


export function MapView({ locations }: MapViewProps) {
  const points = Array.isArray(locations) ? locations : [];
  const hasPoints = points.length > 0;
  const center = hasPoints ? [points[0].lat, points[0].lng] : [20, 0];

  const polyline = useMemo(() => points.map((l) => [l.lat, l.lng]) as [number, number][], [points]);
  const statusColor = (s?: string) =>
    s === "warning" ? "hsl(var(--warning))" : s === "danger" ? "hsl(var(--destructive))" : "hsl(var(--success))";

  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet map once
  useEffect(() => {
    if (leafletMapRef.current || !mapDivRef.current) return;
    const m = L.map(mapDivRef.current).setView(center as any, 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(m);
    layerRef.current = L.layerGroup().addTo(m);
    leafletMapRef.current = m;

    return () => {
      m.remove();
      leafletMapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // Draw markers/polyline and fit bounds when points change
  useEffect(() => {
    const m = leafletMapRef.current;
    const group = layerRef.current;
    if (!m || !group) return;

    group.clearLayers();
    const latlngs: L.LatLngExpression[] = [];

    points.forEach((loc) => {
      const marker = L.circleMarker([loc.lat, loc.lng], {
        radius: 8,
        color: statusColor(loc.status),
        fillColor: statusColor(loc.status),
        fillOpacity: 0.85,
        weight: 2,
      }).bindPopup(`
        <div>
          <p><strong>${loc.name}</strong></p>
          <p class="text-xs">${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}</p>
          ${loc.status ? `<span>${loc.status}</span>` : ""}
        </div>
      `);
      marker.addTo(group);
      latlngs.push([loc.lat, loc.lng]);
    });

    if (latlngs.length === 1) {
      m.setView(latlngs[0] as any, 15, { animate: true });
    } else if (latlngs.length > 1) {
      L.polyline(latlngs as any, { color: "hsl(var(--primary))", weight: 4, opacity: 0.6 }).addTo(group);
      const bounds = L.latLngBounds(latlngs as any);
      m.fitBounds(bounds, { padding: [40, 40] } as any);
    }
  }, [points]);

  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden border border-border bg-card">
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Location Tracking
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {points.length} location(s) being tracked
          </p>
        </div>
        <div className="flex-1">
          <div ref={mapDivRef} className="h-full w-full" aria-label="Leaflet map" />
        </div>
      </div>
    </div>
  );
}

