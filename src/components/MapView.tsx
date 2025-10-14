// Simplified map component to avoid type issues
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
    <div className="h-[400px] w-full rounded-lg overflow-hidden bg-muted flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">Map View</p>
        <p className="text-sm text-muted-foreground mt-2">
          {locations.length} location(s) tracked
        </p>
      </div>
    </div>
  );
}
