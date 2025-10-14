import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Package, Scale, Activity } from 'lucide-react';

interface RealtimeData {
  gps: Array<{ id: string; latitude: number; longitude: number; timestamp: string }>;
  scans: Array<{ id: string; qrCode: string; timestamp: string }>;
  weights: Array<{ id: string; weight: number; timestamp: string }>;
}

export default function IoTDashboard() {
  const [realtimeData, setRealtimeData] = useState<RealtimeData>({
    gps: [],
    scans: [],
    weights: [],
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Subscribe to shipment updates (GPS data)
    const shipmentsChannel = supabase
      .channel('shipments-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shipments',
        },
        (payload) => {
          console.log('GPS update received:', payload);
          if (payload.new.gps_latitude && payload.new.gps_longitude) {
            setRealtimeData(prev => ({
              ...prev,
              gps: [
                {
                  id: payload.new.id,
                  latitude: payload.new.gps_latitude,
                  longitude: payload.new.gps_longitude,
                  timestamp: new Date().toISOString(),
                },
                ...prev.gps.slice(0, 9), // Keep last 10 updates
              ],
            }));
          }
        }
      )
      .subscribe((status) => {
        console.log('Shipments channel status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Subscribe to procurement batch updates (weighbridge data)
    const batchesChannel = supabase
      .channel('batches-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'procurement_batches',
        },
        (payload) => {
          console.log('Weighbridge update received:', payload);
          if (payload.new.quantity_kg) {
            setRealtimeData(prev => ({
              ...prev,
              weights: [
                {
                  id: payload.new.id,
                  weight: payload.new.quantity_kg,
                  timestamp: new Date().toISOString(),
                },
                ...prev.weights.slice(0, 9),
              ],
            }));
          }
        }
      )
      .subscribe((status) => {
        console.log('Batches channel status:', status);
      });

    return () => {
      shipmentsChannel.unsubscribe();
      batchesChannel.unsubscribe();
    };
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">IoT Device Dashboard</h1>
        <div className="flex items-center gap-2">
          <Activity className={isConnected ? 'text-green-500 animate-pulse' : 'text-gray-400'} />
          <span className="text-sm text-muted-foreground">
            {isConnected ? 'Connected' : 'Connecting...'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* GPS Tracking Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              GPS Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {realtimeData.gps.length === 0 ? (
                <p className="text-sm text-muted-foreground">No GPS updates yet</p>
              ) : (
                realtimeData.gps.map((gps, idx) => (
                  <div key={idx} className="border-b pb-2">
                    <p className="text-sm font-medium">{gps.id}</p>
                    <p className="text-xs text-muted-foreground">
                      Lat: {gps.latitude.toFixed(6)}, Lng: {gps.longitude.toFixed(6)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(gps.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* QR Scanner Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              QR Scans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {realtimeData.scans.length === 0 ? (
                <p className="text-sm text-muted-foreground">No scans yet</p>
              ) : (
                realtimeData.scans.map((scan, idx) => (
                  <div key={idx} className="border-b pb-2">
                    <p className="text-sm font-medium truncate">{scan.qrCode}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(scan.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Weighbridge Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Weighbridge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {realtimeData.weights.length === 0 ? (
                <p className="text-sm text-muted-foreground">No weight readings yet</p>
              ) : (
                realtimeData.weights.map((weight, idx) => (
                  <div key={idx} className="border-b pb-2">
                    <p className="text-sm font-medium">{weight.id}</p>
                    <p className="text-lg font-bold">{weight.weight} kg</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(weight.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle>MQTT Integration Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Send GPS Data:</h3>
            <code className="block bg-muted p-3 rounded text-sm">
              {`POST /functions/v1/mqtt-handler
{
  "topic": "iot/gps",
  "deviceType": "gps",
  "payload": {
    "deviceId": "VEHICLE-001",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "timestamp": "2025-10-14T10:00:00Z"
  }
}`}
            </code>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Send QR Scan Data:</h3>
            <code className="block bg-muted p-3 rounded text-sm">
              {`POST /functions/v1/mqtt-handler
{
  "topic": "iot/qr-scan",
  "deviceType": "qr_scanner",
  "payload": {
    "scannerId": "SCANNER-001",
    "qrCode": "BATCH-123456",
    "timestamp": "2025-10-14T10:00:00Z"
  }
}`}
            </code>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Send Weighbridge Data:</h3>
            <code className="block bg-muted p-3 rounded text-sm">
              {`POST /functions/v1/mqtt-handler
{
  "topic": "iot/weighbridge",
  "deviceType": "weighbridge",
  "payload": {
    "weighbridgeId": "WB-001",
    "weight": 1500,
    "unit": "kg",
    "batchId": "BATCH-123456",
    "timestamp": "2025-10-14T10:00:00Z"
  }
}`}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
