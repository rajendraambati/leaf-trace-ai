import { MapPin } from "lucide-react";

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
        <div className="flex-1 overflow-auto p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {locations.map((loc, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-border bg-background">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{loc.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {loc.lat.toFixed(6)}, {loc.lng.toFixed(6)}
                    </p>
                    {loc.status && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs rounded-full bg-success/10 text-success">
                        {loc.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
