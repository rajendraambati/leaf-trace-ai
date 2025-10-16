import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import AILogisticsMonitor from "@/components/AILogisticsMonitor";
import { Brain, TrendingUp, AlertTriangle, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AIInsights() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [aiUsage, setAiUsage] = useState<any[]>([]);

  useEffect(() => {
    fetchShipments();
    fetchAIUsage();
  }, []);

  const fetchShipments = async () => {
    const { data } = await supabase
      .from('shipments')
      .select('*')
      .in('status', ['in_transit', 'assigned'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setShipments(data);
      if (data.length > 0 && !selectedShipment) {
        setSelectedShipment(data[0]);
      }
    }
  };

  const fetchAIUsage = async () => {
    const { data } = await supabase
      .from('ai_usage_analytics')
      .select('*')
      .like('feature_type', 'logistics_%')
      .order('created_at', { ascending: false })
      .limit(20);

    setAiUsage(data || []);
  };

  const totalAICalls = aiUsage.length;
  const successRate = aiUsage.length > 0 
    ? ((aiUsage.filter(u => u.success).length / aiUsage.length) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
          <Brain className="h-10 w-10 text-primary" />
          AI Insights
        </h1>
        <p className="text-muted-foreground mt-2">
          AI-powered route optimization, anomaly detection, and delivery predictions
        </p>
      </div>

      {/* AI Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              AI Analyses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalAICalls}</p>
            <p className="text-sm text-muted-foreground">Total predictions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{successRate}%</p>
            <p className="text-sm text-muted-foreground">AI accuracy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" />
              Active Shipments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{shipments.length}</p>
            <p className="text-sm text-muted-foreground">Being monitored</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="monitor" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="monitor">AI Monitor</TabsTrigger>
          <TabsTrigger value="usage">Usage History</TabsTrigger>
        </TabsList>

        <TabsContent value="monitor" className="space-y-6">
          {/* Shipment Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Shipment to Monitor</CardTitle>
              <CardDescription>Choose an active shipment for AI analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {shipments.map((shipment) => (
                  <div
                    key={shipment.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedShipment?.id === shipment.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedShipment(shipment)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">{shipment.id}</span>
                      <Badge variant="outline">{shipment.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {shipment.from_location} → {shipment.to_location}
                    </p>
                  </div>
                ))}
              </div>

              {shipments.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No active shipments available for monitoring
                </p>
              )}
            </CardContent>
          </Card>

          {/* AI Monitor Component */}
          {selectedShipment && (
            <AILogisticsMonitor
              shipmentId={selectedShipment.id}
              origin={{
                lat: 17.4,
                lng: 78.4,
                name: selectedShipment.from_location
              }}
              destination={{
                lat: 17.5,
                lng: 78.5,
                name: selectedShipment.to_location
              }}
              currentLocation={
                selectedShipment.gps_latitude && selectedShipment.gps_longitude
                  ? { 
                      lat: selectedShipment.gps_latitude, 
                      lng: selectedShipment.gps_longitude 
                    }
                  : undefined
              }
            />
          )}
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Usage History</CardTitle>
              <CardDescription>Recent AI analysis requests and results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {aiUsage.map((usage) => (
                  <div key={usage.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="capitalize">
                        {usage.feature_type.replace('logistics_', '').replace('_', ' ')}
                      </Badge>
                      <Badge variant={usage.success ? 'default' : 'destructive'}>
                        {usage.success ? 'Success' : 'Failed'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Model:</span>
                        <span className="ml-2">{usage.model_name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Time:</span>
                        <span className="ml-2">{usage.execution_time_ms || 0}ms</span>
                      </div>
                    </div>

                    {usage.confidence_score && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Confidence:</span>
                        <span className="ml-2 font-medium">
                          {(usage.confidence_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      {new Date(usage.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}

                {aiUsage.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No AI usage data yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
