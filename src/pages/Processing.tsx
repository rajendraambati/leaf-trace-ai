import { useEffect, useState } from "react";
import { Factory, Activity, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { Progress } from "@/components/ui/progress";
import StatCard from "@/components/StatCard";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import { supabase } from "@/integrations/supabase/client";
import { ProcessingUnitCreationForm } from "@/components/ProcessingUnitCreationForm";

export default function Processing() {
  const [units, setUnits] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [batchesByUnit, setBatchesByUnit] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);

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
    const { data: unitsData, error: unitsError } = await supabase.from('processing_units').select('*');
    const { data: batchesData, error: batchesError } = await supabase
      .from('processing_batches')
      .select(`
        *,
        procurement_batches!processing_batches_batch_id_fkey (
          id,
          farmer_name,
          quantity_kg,
          grade
        )
      `);

    if (unitsError) console.error('Error fetching units:', unitsError);
    if (batchesError) console.error('Error fetching processing batches:', batchesError);
    
    if (unitsData) setUnits(unitsData);
    if (batchesData) {
      setBatches(batchesData);
      // Group batches by unit_id
      const grouped = batchesData.reduce((acc: Record<string, any[]>, batch: any) => {
        if (!acc[batch.unit_id]) {
          acc[batch.unit_id] = [];
        }
        acc[batch.unit_id].push(batch);
        return acc;
      }, {} as Record<string, any[]>);
      setBatchesByUnit(grouped);
    } else {
      setBatches([]);
      setBatchesByUnit({});
    }
    setLoading(false);
  };

  // Count total available processing units
  const activeUnits = units.length;
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
            {units.map((unit) => {
              const unitBatches = batchesByUnit[unit.id] || [];
              return (
                <Card key={unit.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Factory className="h-5 w-5" />
                          {unit.name}
                        </CardTitle>
                        <CardDescription>
                          ID: {unit.id} | {unit.address && `${unit.address}, `}
                          {unit.city}{unit.district && `, ${unit.district}`}, {unit.state}, {unit.country} | Capacity: {unit.capacity_kg_per_day} kg/day
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Batches</p>
                          <p className="text-2xl font-bold">{unitBatches.length}</p>
                        </div>
                        <StatusBadge status={unit.status as any} />
                      </div>
                    </div>
                  </CardHeader>
                  {unitBatches.length > 0 && (
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Available Batches</p>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedUnit(unit)}>
                                <Package className="h-4 w-4 mr-2" />
                                View All ({unitBatches.length})
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Batches in {unit.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 mt-4">
                                {unitBatches.map((batch) => (
                                  <Card key={batch.id}>
                                    <CardHeader>
                                      <div className="flex items-center justify-between">
                                        <CardTitle className="text-base">Batch {batch.batch_id}</CardTitle>
                                        {batch.procurement_batches && (
                                          <StatusBadge status={batch.procurement_batches.grade as any} />
                                        )}
                                      </div>
                                      {batch.procurement_batches && (
                                        <CardDescription>
                                          Farmer: {batch.procurement_batches.farmer_name} | 
                                          Original Qty: {batch.procurement_batches.quantity_kg} kg
                                        </CardDescription>
                                      )}
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">Progress</span>
                                        <span className="text-muted-foreground">{batch.progress}%</span>
                                      </div>
                                      <Progress value={batch.progress || 0} />
                                      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                                        <div>
                                          <p className="text-sm text-muted-foreground">Input</p>
                                          <p className="text-lg font-semibold">{batch.input_quantity_kg} kg</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-muted-foreground">Output</p>
                                          <p className="text-lg font-semibold">{batch.output_quantity_kg || 0} kg</p>
                                        </div>
                                        {batch.quality_score && (
                                          <div>
                                            <p className="text-sm text-muted-foreground">Quality</p>
                                            <p className="text-lg font-semibold">{batch.quality_score}</p>
                                          </div>
                                        )}
                                      </div>
                                      {batch.start_time && (
                                        <div className="pt-2 border-t">
                                          <p className="text-xs text-muted-foreground">
                                            Started: {new Date(batch.start_time).toLocaleString()}
                                          </p>
                                          {batch.end_time && (
                                            <p className="text-xs text-muted-foreground">
                                              Completed: {new Date(batch.end_time).toLocaleString()}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {unitBatches.slice(0, 2).map((batch) => (
                            <div key={batch.id} className="border rounded-lg p-3">
                              <p className="text-sm font-medium">Batch {batch.batch_id}</p>
                              <Progress value={batch.progress || 0} className="mt-2" />
                              <p className="text-xs text-muted-foreground mt-1">{batch.progress}% complete</p>
                            </div>
                          ))}
                        </div>
                        {unitBatches.length > 2 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{unitBatches.length - 2} more batches
                          </p>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="batches" className="space-y-6">
          {units.some((u) => (batchesByUnit[u.id]?.length || 0) > 0) ? (
            <div className="grid gap-6">
              {units.map((unit) => {
                const unitBatches = batchesByUnit[unit.id] || [];
                if (unitBatches.length === 0) return null;
                
                return (
                  <Card key={unit.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <Factory className="h-5 w-5" />
                            {unit.name}
                          </CardTitle>
                          <CardDescription>
                            {unit.address && `${unit.address}, `}
                            {unit.city}{unit.district && `, ${unit.district}`}, {unit.state}, {unit.country}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Batches</p>
                            <p className="text-2xl font-bold">{unitBatches.length}</p>
                          </div>
                          <StatusBadge status={unit.status as any} />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {unitBatches.map((batch) => (
                          <Card key={batch.id} className="border-muted">
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base">Batch {batch.batch_id}</CardTitle>
                                {batch.procurement_batches && (
                                  <span className="text-xs text-muted-foreground">Grade: {batch.procurement_batches.grade}</span>
                                )}
                              </div>
                              {batch.procurement_batches && (
                                <CardDescription>
                                  Farmer: {batch.procurement_batches.farmer_name ?? '—'} | 
                                  Original Qty: {batch.procurement_batches.quantity_kg} kg
                                </CardDescription>
                              )}
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Progress</span>
                                <span className="text-muted-foreground">{batch.progress}%</span>
                              </div>
                              <Progress value={batch.progress || 0} />
                              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                                <div>
                                  <p className="text-sm text-muted-foreground">Input</p>
                                  <p className="text-lg font-semibold">{batch.input_quantity_kg} kg</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Output</p>
                                  <p className="text-lg font-semibold">{batch.output_quantity_kg || 0} kg</p>
                                </div>
                                {batch.quality_score && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">Quality</p>
                                    <p className="text-lg font-semibold">{batch.quality_score}</p>
                                  </div>
                                )}
                              </div>
                              {batch.start_time && (
                                <div className="pt-2 border-t">
                                  <p className="text-xs text-muted-foreground">
                                    Started: {new Date(batch.start_time).toLocaleString()}
                                  </p>
                                  {batch.end_time && (
                                    <p className="text-xs text-muted-foreground">
                                      Completed: {new Date(batch.end_time).toLocaleString()}
                                    </p>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No delivered batches available yet. Deliver shipments to a processing unit to see them here.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsDashboard moduleType="processing" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
