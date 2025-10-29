import { useState, useEffect, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
}

interface UseGPSTrackingOptions {
  trackingInterval?: number; // milliseconds
  vehicleId?: string;
  shipmentId?: string;
  enableBackgroundTracking?: boolean;
}

export function useGPSTracking(options: UseGPSTrackingOptions = {}) {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<GPSPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<string | null>(null);

  const {
    trackingInterval = 30000, // Default 30 seconds
    vehicleId,
    shipmentId,
    enableBackgroundTracking = false
  } = options;

  const checkPermissions = async () => {
    try {
      const permission = await Geolocation.checkPermissions();
      
      if (permission.location !== 'granted') {
        const request = await Geolocation.requestPermissions();
        return request.location === 'granted';
      }
      
      return true;
    } catch (err) {
      console.error('Permission check error:', err);
      setError('Failed to check location permissions');
      return false;
    }
  };

  const logPosition = async (position: GPSPosition, batteryLevel?: number) => {
    if (!user) return;

    try {
      // Check if moving (speed > 0.5 m/s = ~1.8 km/h)
      const isMoving = position.speed ? position.speed > 0.5 : false;

      const { error: logError } = await supabase
        .from('gps_tracking_logs')
        .insert({
          driver_id: user.id,
          vehicle_id: vehicleId,
          shipment_id: shipmentId,
          latitude: position.latitude,
          longitude: position.longitude,
          accuracy: position.accuracy,
          altitude: position.altitude,
          speed: position.speed,
          heading: position.heading,
          battery_level: batteryLevel,
          is_moving: isMoving,
          timestamp: new Date().toISOString()
        });

      if (logError) {
        console.error('Error logging GPS position:', logError);
      }
    } catch (err) {
      console.error('Error in logPosition:', err);
    }
  };

  const getCurrentPosition = async () => {
    try {
      const hasPermission = await checkPermissions();
      if (!hasPermission) {
        setError('Location permission denied');
        return null;
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });

      const gpsPosition: GPSPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude || undefined,
        speed: position.coords.speed || undefined,
        heading: position.coords.heading || undefined
      };

      setCurrentPosition(gpsPosition);
      return gpsPosition;
    } catch (err: any) {
      console.error('Error getting position:', err);
      setError(err.message || 'Failed to get current position');
      return null;
    }
  };

  const startTracking = useCallback(async () => {
    try {
      const hasPermission = await checkPermissions();
      if (!hasPermission) {
        setError('Location permission denied');
        return false;
      }

      setIsTracking(true);
      setError(null);

      // Get initial position
      const initialPos = await getCurrentPosition();
      if (initialPos) {
        await logPosition(initialPos);
      }

      // Set up continuous tracking
      const id = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        },
        async (position, err) => {
          if (err) {
            console.error('Watch position error:', err);
            setError(err.message);
            return;
          }

          if (position) {
            const gpsPosition: GPSPosition = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude || undefined,
              speed: position.coords.speed || undefined,
              heading: position.coords.heading || undefined
            };

            setCurrentPosition(gpsPosition);
            await logPosition(gpsPosition);
          }
        }
      );

      setWatchId(id);
      return true;
    } catch (err: any) {
      console.error('Error starting tracking:', err);
      setError(err.message || 'Failed to start tracking');
      setIsTracking(false);
      return false;
    }
  }, [user, vehicleId, shipmentId]);

  const stopTracking = useCallback(async () => {
    if (watchId) {
      await Geolocation.clearWatch({ id: watchId });
      setWatchId(null);
    }
    setIsTracking(false);
  }, [watchId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId) {
        Geolocation.clearWatch({ id: watchId });
      }
    };
  }, [watchId]);

  return {
    isTracking,
    currentPosition,
    error,
    startTracking,
    stopTracking,
    getCurrentPosition,
    checkPermissions
  };
}