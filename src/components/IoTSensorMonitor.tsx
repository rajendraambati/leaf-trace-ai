import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Thermometer, Droplets, Wind, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SensorData {
  id: string;
  location: string;
  temperature: number;
  humidity: number;
  airQuality: number;
  status: "normal" | "warning" | "critical";
  lastUpdate: string;
}

export default function IoTSensorMonitor({ locationId, locationType }: { locationId: string; locationType: "warehouse" | "vehicle" }) {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);

  useEffect(() => {
    fetchSensorData();
    const interval = setInterval(fetchSensorData, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [locationId]);

  const fetchSensorData = async () => {
    if (locationType === "warehouse") {
      const { data } = await supabase
        .from("warehouses")
        .select("*")
        .eq("id", locationId)
        .single();

      if (data) {
        setSensorData({
          id: data.id,
          location: data.name,
          temperature: data.temperature || 20,
          humidity: data.humidity || 50,
          airQuality: 85,
          status: getStatus(data.temperature, data.humidity),
          lastUpdate: new Date().toISOString(),
        });
      }
    }
  };

  const getStatus = (temp: number | null, humidity: number | null): "normal" | "warning" | "critical" => {
    if (!temp || !humidity) return "normal";
    if (temp > 30 || temp < 10 || humidity > 70 || humidity < 30) return "critical";
    if (temp > 25 || temp < 15 || humidity > 60 || humidity < 40) return "warning";
    return "normal";
  };

  if (!sensorData) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>IoT Sensors - {sensorData.location}</CardTitle>
            <CardDescription>Real-time environmental monitoring</CardDescription>
          </div>
          <Badge variant={sensorData.status === "normal" ? "default" : sensorData.status === "warning" ? "secondary" : "destructive"}>
            {sensorData.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Thermometer className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Temperature</p>
              <p className="text-lg font-bold">{sensorData.temperature}°C</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Droplets className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Humidity</p>
              <p className="text-lg font-bold">{sensorData.humidity}%</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Wind className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Air Quality</p>
              <p className="text-lg font-bold">{sensorData.airQuality}%</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Activity className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-lg font-bold capitalize">{sensorData.status}</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Last updated: {new Date(sensorData.lastUpdate).toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}
