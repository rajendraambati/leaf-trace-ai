import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Thermometer, Navigation, Battery } from 'lucide-react';

interface IoTData {
  deviceId: string;
  gpsLat: number;
  gpsLng: number;
  temperature: number;
  battery: number;
  signal: 'excellent' | 'good' | 'fair' | 'poor';
  lastUpdate: Date;
  speed?: number;
  heading?: number;
}

interface IoTTrackerProps {
  shipmentId: string;
  onLocationUpdate?: (lat: number, lng: number) => void;
}

export function IoTTracker({ shipmentId, onLocationUpdate }: IoTTrackerProps) {
  const [iotData, setIotData] = useState<IoTData | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Simulate IoT device connection
    setConnected(true);
    
    // Simulate real-time IoT updates
    const interval = setInterval(() => {
      const mockData: IoTData = {
        deviceId: `IOT-${shipmentId.slice(-8)}`,
        gpsLat: 17.4 + Math.random() * 0.1,
        gpsLng: 78.4 + Math.random() * 0.1,
        temperature: 20 + Math.random() * 5,
        battery: 85 + Math.random() * 10,
        signal: ['excellent', 'good', 'fair'][Math.floor(Math.random() * 3)] as any,
        lastUpdate: new Date(),
        speed: 40 + Math.random() * 20,
        heading: Math.random() * 360
      };
      
      setIotData(mockData);
      onLocationUpdate?.(mockData.gpsLat, mockData.gpsLng);
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [shipmentId, onLocationUpdate]);

  if (!connected || !iotData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WifiOff className="h-5 w-5" />
            IoT Tracker - Connecting...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'fair': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 70) return 'text-green-500';
    if (level > 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-green-500" />
            IoT Real-Time Tracking
          </span>
          <Badge variant="outline" className="gap-1">
            <span className={`h-2 w-2 rounded-full ${getSignalColor(iotData.signal)}`} />
            {iotData.signal}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Device ID</p>
            <p className="font-mono text-sm">{iotData.deviceId}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Last Update</p>
            <p className="text-sm">{iotData.lastUpdate.toLocaleTimeString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">GPS Position</p>
              <p className="text-sm font-medium">
                {iotData.gpsLat.toFixed(4)}, {iotData.gpsLng.toFixed(4)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Temperature</p>
              <p className="text-sm font-medium">{iotData.temperature.toFixed(1)}°C</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Battery className={`h-4 w-4 ${getBatteryColor(iotData.battery)}`} />
            <div>
              <p className="text-xs text-muted-foreground">Battery</p>
              <p className="text-sm font-medium">{iotData.battery.toFixed(0)}%</p>
            </div>
          </div>
          {iotData.speed && (
            <div>
              <p className="text-xs text-muted-foreground">Speed</p>
              <p className="text-sm font-medium">{iotData.speed.toFixed(0)} km/h</p>
            </div>
          )}
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Auto-updating every 5s</span>
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
