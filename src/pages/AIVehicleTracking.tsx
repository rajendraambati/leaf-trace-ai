import { RealTimeVehicleMap } from '@/components/RealTimeVehicleMap';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIVehicleTracker } from '@/components/AIVehicleTracker';
import { Map, Brain } from 'lucide-react';

export default function AIVehicleTracking() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Vehicle Tracking & AI Insights</h1>
        <p className="text-muted-foreground">
          Real-time GPS tracking with AI-powered analytics and driver wellbeing monitoring
        </p>
      </div>

      <Tabs defaultValue="map" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Live Map
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-4">
          <RealTimeVehicleMap />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <AIVehicleTracker />
        </TabsContent>
      </Tabs>
    </div>
  );
}
