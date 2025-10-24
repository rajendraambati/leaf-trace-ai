import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Download, FileJson, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
];

interface BIReportData {
  farmers: any[];
  procurementBatches: any[];
  shipments: any[];
  warehouses: any[];
  warehouseInventory: any[];
  processingBatches: any[];
  processingUnits: any[];
}

export default function BIReportDashboard() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<BIReportData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [farmers, procurementBatches, shipments, warehouses, warehouseInventory, processingBatches, processingUnits] = await Promise.all([
        supabase.from('farmers').select('*'),
        supabase.from('procurement_batches').select('*'),
        supabase.from('shipments').select('*'),
        supabase.from('warehouses').select('*'),
        supabase.from('warehouse_inventory').select('*'),
        supabase.from('processing_batches').select('*'),
        supabase.from('processing_units').select('*'),
      ]);

      setReportData({
        farmers: farmers.data || [],
        procurementBatches: procurementBatches.data || [],
        shipments: shipments.data || [],
        warehouses: warehouses.data || [],
        warehouseInventory: warehouseInventory.data || [],
        processingBatches: processingBatches.data || [],
        processingUnits: processingUnits.data || [],
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch report data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = (format: 'json' | 'csv' | 'txt') => {
    if (!reportData) return;

    let content = '';
    let mimeType = '';
    let extension = '';

    if (format === 'json') {
      content = JSON.stringify(reportData, null, 2);
      mimeType = 'application/json';
      extension = 'json';
    } else if (format === 'csv') {
      // Convert to CSV format
      const sections = [
        { title: 'Farmers', data: reportData.farmers },
        { title: 'Procurement Batches', data: reportData.procurementBatches },
        { title: 'Shipments', data: reportData.shipments },
        { title: 'Warehouses', data: reportData.warehouses },
        { title: 'Warehouse Inventory', data: reportData.warehouseInventory },
        { title: 'Processing Batches', data: reportData.processingBatches },
        { title: 'Processing Units', data: reportData.processingUnits },
      ];

      content = sections
        .map((section) => {
          if (section.data.length === 0) return `${section.title}\nNo data\n\n`;
          const headers = Object.keys(section.data[0]).join(',');
          const rows = section.data.map((row) => Object.values(row).join(',')).join('\n');
          return `${section.title}\n${headers}\n${rows}\n\n`;
        })
        .join('');
      mimeType = 'text/csv';
      extension = 'csv';
    } else if (format === 'txt') {
      content = `BI REPORT SUMMARY\n${'='.repeat(50)}\n\n`;
      content += `Generated: ${new Date().toLocaleString()}\n\n`;
      content += `STATISTICS\n${'-'.repeat(50)}\n`;
      content += `Total Farmers: ${reportData.farmers.length}\n`;
      content += `Total Procurement Batches: ${reportData.procurementBatches.length}\n`;
      content += `Total Shipments: ${reportData.shipments.length}\n`;
      content += `Total Warehouses: ${reportData.warehouses.length}\n`;
      content += `Total Processing Units: ${reportData.processingUnits.length}\n`;
      mimeType = 'text/plain';
      extension = 'txt';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bi-report-${Date.now()}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: `Report downloaded as ${extension.toUpperCase()}`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!reportData) return null;

  // Process data for charts
  const farmersByLocation = reportData.farmers.reduce((acc: any, farmer) => {
    const location = farmer.location || 'Unknown';
    acc[location] = (acc[location] || 0) + 1;
    return acc;
  }, {});

  const locationData = Object.entries(farmersByLocation).map(([location, count]) => ({
    location,
    count,
  }));

  const batchesByGrade = reportData.procurementBatches.reduce((acc: any, batch) => {
    const grade = batch.grade || 'Unknown';
    acc[grade] = (acc[grade] || 0) + 1;
    return acc;
  }, {});

  const gradeData = Object.entries(batchesByGrade).map(([grade, count]) => ({
    grade,
    count,
  }));

  const shipmentsByStatus = reportData.shipments.reduce((acc: any, shipment) => {
    const status = shipment.status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const shipmentStatusData = Object.entries(shipmentsByStatus).map(([status, count]) => ({
    status,
    count,
  }));

  const warehouseCapacity = reportData.warehouses.map((warehouse) => ({
    name: warehouse.name,
    current: Number(warehouse.current_stock_kg) || 0,
    capacity: Number(warehouse.max_capacity_kg) || 0,
    utilization: ((Number(warehouse.current_stock_kg) / Number(warehouse.max_capacity_kg)) * 100).toFixed(1),
  }));

  const procurementVolume = reportData.procurementBatches
    .sort((a, b) => new Date(a.procurement_date).getTime() - new Date(b.procurement_date).getTime())
    .slice(-30)
    .map((batch) => ({
      date: new Date(batch.procurement_date).toLocaleDateString(),
      quantity: Number(batch.quantity_kg) || 0,
      value: Number(batch.total_price) || 0,
    }));

  const processingStatus = reportData.processingBatches.map((batch) => ({
    id: batch.id.slice(0, 8),
    progress: Number(batch.progress) || 0,
    input: Number(batch.input_quantity_kg) || 0,
    output: Number(batch.output_quantity_kg) || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Download Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Export Report</CardTitle>
          <CardDescription>Download the complete BI report in your preferred format</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => downloadReport('json')} variant="outline">
            <FileJson className="mr-2 h-4 w-4" />
            Download JSON
          </Button>
          <Button onClick={() => downloadReport('csv')} variant="outline">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
          <Button onClick={() => downloadReport('txt')} variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Download TXT
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="farmers">Farmers</TabsTrigger>
          <TabsTrigger value="procurement">Procurement</TabsTrigger>
          <TabsTrigger value="logistics">Logistics</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Farmers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{reportData.farmers.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Procurement Batches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{reportData.procurementBatches.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Shipments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {reportData.shipments.filter((s) => s.status === 'in-transit').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Warehouses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{reportData.warehouses.length}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Shipment Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    count: { label: 'Count', color: 'hsl(var(--primary))' },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={shipmentStatusData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label>
                        {shipmentStatusData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Warehouse Capacity Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    current: { label: 'Current Stock (kg)', color: 'hsl(var(--primary))' },
                    capacity: { label: 'Max Capacity (kg)', color: 'hsl(var(--secondary))' },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={warehouseCapacity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="current" fill="hsl(var(--primary))" />
                      <Bar dataKey="capacity" fill="hsl(var(--secondary))" opacity={0.5} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="farmers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Farmers by Location</CardTitle>
              <CardDescription>Distribution of registered farmers across locations</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: { label: 'Number of Farmers', color: 'hsl(var(--primary))' },
                }}
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={locationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="location" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="procurement" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Batches by Grade</CardTitle>
                <CardDescription>Quality distribution of procurement batches</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    count: { label: 'Count', color: 'hsl(var(--primary))' },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={gradeData} dataKey="count" nameKey="grade" cx="50%" cy="50%" outerRadius={80} label>
                        {gradeData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Procurement Volume Trend</CardTitle>
                <CardDescription>Last 30 procurement transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    quantity: { label: 'Quantity (kg)', color: 'hsl(var(--primary))' },
                    value: { label: 'Value', color: 'hsl(var(--secondary))' },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={procurementVolume}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Area type="monotone" dataKey="quantity" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="value" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logistics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shipment Status Overview</CardTitle>
              <CardDescription>Current status of all shipments in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: { label: 'Shipments', color: 'hsl(var(--primary))' },
                }}
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={shipmentStatusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processing Batch Progress</CardTitle>
              <CardDescription>Input vs Output for active processing batches</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  input: { label: 'Input (kg)', color: 'hsl(var(--primary))' },
                  output: { label: 'Output (kg)', color: 'hsl(var(--secondary))' },
                  progress: { label: 'Progress (%)', color: 'hsl(var(--accent))' },
                }}
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={processingStatus.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="id" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="input" fill="hsl(var(--primary))" />
                    <Bar dataKey="output" fill="hsl(var(--secondary))" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
