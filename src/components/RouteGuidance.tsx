import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Navigation, ArrowRight, AlertTriangle, 
  Clock, MapPin, TrendingUp 
} from 'lucide-react';

interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
  type: 'turn' | 'straight' | 'roundabout' | 'destination';
}

interface RouteGuidanceProps {
  destination: string;
  currentLocation: { lat: number; lng: number } | null;
  destinationLocation: { lat: number; lng: number } | null;
}

export function RouteGuidance({ 
  destination, 
  currentLocation, 
  destinationLocation 
}: RouteGuidanceProps) {
  const [steps, setSteps] = useState<RouteStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [eta, setEta] = useState<string>('');
  const [distance, setDistance] = useState<string>('');

  useEffect(() => {
    if (currentLocation && destinationLocation) {
      calculateRoute();
    }
  }, [currentLocation, destinationLocation]);

  const calculateRoute = () => {
    if (!currentLocation || !destinationLocation) return;

    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = toRad(destinationLocation.lat - currentLocation.lat);
    const dLon = toRad(destinationLocation.lng - currentLocation.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(currentLocation.lat)) *
      Math.cos(toRad(destinationLocation.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    setDistance(`${distanceKm.toFixed(1)} km`);

    // Estimate travel time (assuming 50 km/h average)
    const hours = distanceKm / 50;
    const minutes = Math.round(hours * 60);
    setEta(`${minutes} min`);

    // Generate simplified route steps
    const routeSteps: RouteStep[] = [
      {
        instruction: 'Head towards destination',
        distance: `${distanceKm.toFixed(1)} km`,
        duration: `${minutes} min`,
        type: 'straight',
      },
      {
        instruction: `Arrive at ${destination}`,
        distance: '0 km',
        duration: '0 min',
        type: 'destination',
      },
    ];

    setSteps(routeSteps);
  };

  const toRad = (value: number) => (value * Math.PI) / 180;

  if (steps.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Navigation className="h-5 w-5" />
          <p>Calculating route...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      {/* Current Step */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            Step {currentStep + 1} of {steps.length}
          </Badge>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{eta} away</span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-1">
            {steps[currentStep].type === 'destination' ? (
              <MapPin className="h-6 w-6 text-primary" />
            ) : (
              <Navigation className="h-6 w-6 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-lg">
              {steps[currentStep].instruction}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {steps[currentStep].distance} • {steps[currentStep].duration}
            </p>
          </div>
        </div>
      </div>

      {/* Route Summary */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Total: {distance}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{destination}</span>
        </div>
      </div>

      {/* Next Steps Preview */}
      {currentStep < steps.length - 1 && (
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">Next:</p>
          <div className="flex items-center gap-2 text-sm">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span>{steps[currentStep + 1].instruction}</span>
          </div>
        </div>
      )}
    </Card>
  );
}
