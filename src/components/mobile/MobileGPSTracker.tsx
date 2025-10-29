import { useState, useEffect, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { MapPin, Navigation, Loader2, Play, Square } from 'lucide-react';

interface MobileGPSTrackerProps {
  shipmentId?: string;
  vehicleId?: string;
}

export function MobileGPSTracker({ shipmentId, vehicleId }: MobileGPSTrackerProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(0);
  const [watchId, setWatchId] = useState<string | null>(null);
  const { toast } = useToast();
  const { isOnline, queueOperation } = useOfflineSync();

  const logLocation = useCallback(async (position: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const locationData = {
        driver_id: user.id,
        shipment_id: shipmentId || null,
        vehicle_id: vehicleId || null,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed || 0,
        heading: position.coords.heading || null,
        is_moving: (position.coords.speed || 0) > 1,
        timestamp: new Date().toISOString()
      };

      if (isOnline) {
        // Try to sync immediately if online
        const { error } = await supabase.from('gps_tracking_logs').insert(locationData);
        
        if (error) {
          // If sync fails, queue it
          await queueOperation('gps_tracking_logs', 'INSERT', locationData);
        }
      } else {
        // Queue for later if offline
        await queueOperation('gps_tracking_logs', 'INSERT', locationData);
      }

      setCurrentLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
      setAccuracy(position.coords.accuracy);
      setSpeed(position.coords.speed || 0);
    } catch (error) {
      console.error('Error logging location:', error);
    }
  }, [shipmentId, vehicleId, isOnline, queueOperation]);

  const startTracking = async () => {
    try {
      // Request permissions
      const permission = await Geolocation.requestPermissions();
      
      if (permission.location !== 'granted') {
        toast({
          title: 'Permission Denied',
          description: 'Location permission is required for GPS tracking',
          variant: 'destructive'
        });
        return;
      }

      // Start watching position
      const id = await Geolocation.watchPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }, (position, err) => {
        if (err) {
          console.error('GPS error:', err);
          return;
        }

        if (position) {
          logLocation(position);
        }
      });

      setWatchId(id);
      setIsTracking(true);

      toast({
        title: 'Tracking Started',
        description: 'GPS tracking is now active'
      });
    } catch (error) {
      console.error('Error starting GPS tracking:', error);
      toast({
        title: 'Tracking Error',
        description: 'Failed to start GPS tracking',
        variant: 'destructive'
      });
    }
  };

  const stopTracking = async () => {
    if (watchId) {
      await Geolocation.clearWatch({ id: watchId });
      setWatchId(null);
      setIsTracking(false);

      toast({
        title: 'Tracking Stopped',
        description: 'GPS tracking has been stopped'
      });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId) {
        Geolocation.clearWatch({ id: watchId });
      }
    };
  }, [watchId]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              GPS Tracking
            </CardTitle>
            <CardDescription>Real-time location tracking</CardDescription>
          </div>
          <Badge variant={isTracking ? 'default' : 'outline'}>
            {isTracking ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Location */}
        {currentLocation && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Position</span>
              <Badge variant={isOnline ? 'default' : 'secondary'}>
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Lat:</span>
                <span className="font-mono">{currentLocation.lat.toFixed(6)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Lng:</span>
                <span className="font-mono">{currentLocation.lng.toFixed(6)}</span>
              </div>
              {accuracy > 0 && (
                <div className="text-xs text-muted-foreground">
                  Accuracy: ±{accuracy.toFixed(0)}m
                </div>
              )}
              {speed > 0 && (
                <div className="text-xs text-muted-foreground">
                  Speed: {(speed * 3.6).toFixed(1)} km/h
                </div>
              )}
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="space-y-2">
          {!isTracking ? (
            <Button onClick={startTracking} className="w-full gap-2">
              <Play className="h-4 w-4" />
              Start Tracking
            </Button>
          ) : (
            <Button onClick={stopTracking} variant="destructive" className="w-full gap-2">
              <Square className="h-4 w-4" />
              Stop Tracking
            </Button>
          )}
        </div>

        {!isOnline && (
          <div className="text-sm text-muted-foreground bg-warning/10 p-3 rounded-lg border border-warning/20">
            <strong>Offline Mode:</strong> Location data is being saved locally and will sync when connection is restored.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
