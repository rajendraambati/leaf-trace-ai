import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, QrCode, Scale, Droplets, Wifi, Radio, Globe } from "lucide-react";

export default function IoTDevices() {
  const devices = [
    {
      name: "GPS Trackers",
      icon: MapPin,
      protocol: "HTTP/HTTPS",
      description: "Real-time vehicle and shipment tracking with geolocation",
      dataPoints: ["Latitude/Longitude", "Speed", "Heading", "Timestamp"],
      integration: "REST API endpoints receiving JSON payloads every 30 seconds",
      example: `{
  "device_id": "GPS-001",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "speed": 45.5,
  "timestamp": "2025-01-14T10:30:00Z"
}`
    },
    {
      name: "QR Code Scanners",
      icon: QrCode,
      protocol: "HTTP/HTTPS",
      description: "Batch tracking and verification at checkpoints",
      dataPoints: ["Batch ID", "Scanner Location", "Scan Time", "Operator ID"],
      integration: "Mobile/handheld scanners POST data to webhook endpoints",
      example: `{
  "scanner_id": "QR-SCAN-05",
  "batch_id": "BATCH-1736857200000",
  "location": "Warehouse-A",
  "timestamp": "2025-01-14T10:30:00Z"
}`
    },
    {
      name: "Weighbridges",
      icon: Scale,
      protocol: "MQTT",
      description: "Automated weight measurement with timestamp and batch tagging",
      dataPoints: ["Weight (kg)", "Batch ID", "Tare Weight", "Net Weight"],
      integration: "MQTT broker subscribing to topics: weighbridge/{station_id}/data",
      example: `Topic: weighbridge/WB-01/data
Payload: {
  "gross_weight": 2450.5,
  "tare_weight": 450.0,
  "net_weight": 2000.5,
  "batch_id": "BATCH-1736857200000",
  "timestamp": "2025-01-14T10:30:00Z"
}`
    },
    {
      name: "Soil Sensors",
      icon: Droplets,
      protocol: "MQTT",
      description: "Agricultural monitoring: moisture, pH, NPK levels",
      dataPoints: ["Soil Moisture", "pH Level", "Temperature", "NPK Values"],
      integration: "MQTT topics: farm/{farm_id}/soil/{sensor_id}",
      example: `Topic: farm/FARM-001/soil/SENSOR-12
Payload: {
  "moisture": 45.2,
  "ph": 6.8,
  "temperature": 28.5,
  "nitrogen": 42,
  "phosphorus": 18,
  "potassium": 35,
  "timestamp": "2025-01-14T10:30:00Z"
}`
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">IoT Devices & Integration</h1>
        <p className="text-muted-foreground mt-1">
          Connected devices, protocols, and data flow architecture
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            Integration Protocols
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Wifi className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">MQTT Protocol</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Lightweight pub/sub messaging for high-frequency sensor data
              </p>
              <div className="space-y-1 text-xs">
                <p><span className="font-medium">Broker:</span> Eclipse Mosquitto / AWS IoT Core</p>
                <p><span className="font-medium">QoS:</span> Level 1 (At least once delivery)</p>
                <p><span className="font-medium">Security:</span> TLS 1.2+ with X.509 certificates</p>
                <p><span className="font-medium">Devices:</span> Weighbridges, Soil Sensors</p>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-5 w-5 text-success" />
                <h3 className="font-semibold">HTTP/HTTPS</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                RESTful APIs for request/response device communication
              </p>
              <div className="space-y-1 text-xs">
                <p><span className="font-medium">Protocol:</span> HTTPS (TLS 1.3)</p>
                <p><span className="font-medium">Format:</span> JSON payloads</p>
                <p><span className="font-medium">Auth:</span> API Keys + OAuth 2.0</p>
                <p><span className="font-medium">Devices:</span> GPS Trackers, QR Scanners</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {devices.map((device, idx) => {
          const Icon = device.icon;
          return (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {device.name}
                </CardTitle>
                <Badge variant="outline" className="w-fit">
                  {device.protocol}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{device.description}</p>
                
                <div>
                  <h4 className="text-sm font-semibold mb-2">Data Points</h4>
                  <div className="flex flex-wrap gap-1">
                    {device.dataPoints.map((point, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {point}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Integration</h4>
                  <p className="text-xs text-muted-foreground">{device.integration}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Example Payload</h4>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                    <code>{device.example}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Flow Architecture</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
              <h3 className="font-semibold mb-2 text-sm">1. Device Layer</h3>
              <p className="text-xs text-muted-foreground">
                IoT devices collect real-time data → Sensors transmit via MQTT/HTTP
              </p>
            </div>
            <div className="p-4 rounded-lg border border-success/20 bg-success/5">
              <h3 className="font-semibold mb-2 text-sm">2. Gateway Layer</h3>
              <p className="text-xs text-muted-foreground">
                Edge Functions process incoming data → Validation, transformation, authentication
              </p>
            </div>
            <div className="p-4 rounded-lg border border-accent/20 bg-accent/5">
              <h3 className="font-semibold mb-2 text-sm">3. Storage Layer</h3>
              <p className="text-xs text-muted-foreground">
                Supabase Database stores validated data → Real-time subscriptions notify clients
              </p>
            </div>
            <div className="p-4 rounded-lg border border-warning/20 bg-warning/5">
              <h3 className="font-semibold mb-2 text-sm">4. Application Layer</h3>
              <p className="text-xs text-muted-foreground">
                Dashboard visualizes data → AI models analyze patterns → Users take action
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
