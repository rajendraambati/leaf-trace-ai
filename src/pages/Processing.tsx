import { useEffect, useState } from "react";
import { Factory, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatusBadge from "@/components/StatusBadge";
import { Progress } from "@/components/ui/progress";
import StatCard from "@/components/StatCard";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import { supabase } from "@/integrations/supabase/client";
import { ProcessingUnitCreationForm } from "@/components/ProcessingUnitCreationForm";

export default function Processing() {
  const [units, setUnits] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('processing-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'processing_units' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'processing_batches' }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    const { data: unitsData } = await supabase.from('processing_units').select('*');
    const { data: batchesData } = await supabase.from('processing_batches').select('*');
    if (unitsData) setUnits(unitsData);
    if (batchesData) setBatches(batchesData);
    setLoading(false);
  };

  const activeUnits = units.filter(u => u.status === 'processing').length;
  const todayOutput = batches.reduce((sum, b) => sum + (b.output_quantity_kg || 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Processing Management</h1>
          <p className="text-muted-foreground mt-2">
            Track tobacco processing, quality control, and equipment monitoring
          </p>
        </div>
        <ProcessingUnitCreationForm />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <StatCard
          title="Active Units"
          value={activeUnits.toString()}
          icon={Factory}
        />
        <StatCard
          title="Processing Today"
          value={`${todayOutput.toLocaleString()} kg`}
          icon={Activity}
        />
      </div>

      <Tabs defaultValue="units" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="units">Processing Units</TabsTrigger>
          <TabsTrigger value="batches">Batches</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="units" className="space-y-6">
          <div className="grid gap-6">
            {units.map((unit) => (
              <Card key={unit.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Factory className="h-5 w-5" />
                        {unit.name}
                      </CardTitle>
                      <CardDescription>ID: {unit.id} | Capacity: {unit.capacity_kg_per_day} kg/day</CardDescription>
                    </div>
                    <StatusBadge status={unit.status as any} />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="batches" className="space-y-6">
          <div className="grid gap-6">
            {batches.map((batch) => (
              <Card key={batch.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Batch {batch.batch_id}</CardTitle>
                      <CardDescription>Unit: {batch.unit_id}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Progress</span>
                    <span className="text-muted-foreground">{batch.progress}%</span>
                  </div>
                  <Progress value={batch.progress || 0} />
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Input</p>
                      <p className="text-lg font-semibold">{batch.input_quantity_kg} kg</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Output</p>
                      <p className="text-lg font-semibold">{batch.output_quantity_kg || 0} kg</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsDashboard moduleType="processing" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
