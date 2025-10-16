import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Route, TrendingUp, Fuel, Clock, MapPin } from 'lucide-react';

interface RouteOptimizationProps {
  shipmentId: string;
  origin: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string };
  onOptimized?: (route: any) => void;
}

export function RouteOptimization({ shipmentId, origin, destination, onOptimized }: RouteOptimizationProps) {
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<any>(null);

  const optimizeRoute = async () => {
    setOptimizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('route-optimization', {
        body: {
          shipmentId,
          origin,
          destination,
          vehicleType: 'truck',
          priority: 'standard'
        }
      });

      if (error) throw error;

      setOptimizedRoute(data);
      onOptimized?.(data);
      toast.success('Route optimized successfully!');
    } catch (error) {
      console.error('Route optimization error:', error);
      toast.error('Failed to optimize route');
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-5 w-5" />
          AI Route Optimization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!optimizedRoute ? (
          <div className="text-center py-6">
            <Button onClick={optimizeRoute} disabled={optimizing}>
              {optimizing ? 'Optimizing Route...' : 'Optimize Route with AI'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Distance</p>
                  <p className="font-semibold">{optimizedRoute.distance} km</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Est. Time</p>
                  <p className="font-semibold">{optimizedRoute.estimatedTime} hrs</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Fuel className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Fuel</p>
                  <p className="font-semibold">{optimizedRoute.fuelEstimate} L</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Traffic</p>
                  <p className="font-semibold capitalize">{optimizedRoute.trafficConditions}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Waypoints</h4>
              <div className="space-y-2">
                {optimizedRoute.waypoints.map((wp: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                      {idx + 1}
                    </div>
                    <span>{wp.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">AI Recommendations</h4>
              <ul className="space-y-1 text-sm">
                {optimizedRoute.recommendations.map((rec: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button onClick={optimizeRoute} variant="outline" size="sm" className="w-full">
              Re-optimize Route
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
