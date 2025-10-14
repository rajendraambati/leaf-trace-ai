import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  TrendingUp, 
  Truck, 
  Leaf, 
  AlertTriangle,
  DollarSign,
  Package,
  Calendar,
  MapPin
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import StatCard from "@/components/StatCard";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

const AnalyticsDashboard = () => {
  // Procurement Trends
  const { data: procurementData } = useQuery({
    queryKey: ['procurement-trends'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('procurement_batches')
        .select('*')
        .order('procurement_date', { ascending: true });
      
      if (error) throw error;

      // Group by month
      const monthlyData = data.reduce((acc: any, batch) => {
        const month = new Date(batch.procurement_date).toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        });
        
        if (!acc[month]) {
          acc[month] = { month, quantity: 0, revenue: 0, batches: 0 };
        }
        
        acc[month].quantity += Number(batch.quantity_kg);
        acc[month].revenue += Number(batch.total_price || 0);
        acc[month].batches += 1;
        
        return acc;
      }, {});

      return Object.values(monthlyData);
    }
  });

  // Grade Distribution
  const { data: gradeData } = useQuery({
    queryKey: ['grade-distribution'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('procurement_batches')
        .select('grade, quantity_kg');
      
      if (error) throw error;

      const distribution = data.reduce((acc: any, batch) => {
        if (!acc[batch.grade]) {
          acc[batch.grade] = { name: batch.grade, value: 0 };
        }
        acc[batch.grade].value += Number(batch.quantity_kg);
        return acc;
      }, {});

      return Object.values(distribution);
    }
  });

  // Delivery ETA Tracking
  const { data: deliveryData } = useQuery({
    queryKey: ['delivery-tracking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;

      // Calculate on-time performance
      const completed = data.filter(s => s.status === 'delivered');
      const onTime = completed.filter(s => {
        if (!s.eta || !s.actual_arrival) return false;
        return new Date(s.actual_arrival) <= new Date(s.eta);
      });

      const statusDistribution = data.reduce((acc: any, shipment) => {
        acc[shipment.status] = (acc[shipment.status] || 0) + 1;
        return acc;
      }, {});

      return {
        shipments: data,
        onTimePercentage: completed.length > 0 ? (onTime.length / completed.length) * 100 : 0,
        statusDistribution: Object.entries(statusDistribution).map(([name, value]) => ({
          name: name.replace(/-/g, ' ').toUpperCase(),
          value
        }))
      };
    }
  });

  // ESG Metrics
  const { data: esgData } = useQuery({
    queryKey: ['esg-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('esg_scores')
        .select('*')
        .order('assessment_date', { ascending: true });
      
      if (error) throw error;

      // Calculate averages and trends
      const avgScores = {
        environmental: data.reduce((sum, s) => sum + Number(s.environmental_score || 0), 0) / data.length,
        social: data.reduce((sum, s) => sum + Number(s.social_score || 0), 0) / data.length,
        governance: data.reduce((sum, s) => sum + Number(s.governance_score || 0), 0) / data.length,
        overall: data.reduce((sum, s) => sum + Number(s.overall_score || 0), 0) / data.length,
      };

      // Monthly trends
      const monthlyTrends = data.reduce((acc: any, score) => {
        const month = new Date(score.assessment_date).toLocaleDateString('en-US', { 
          month: 'short' 
        });
        
        if (!acc[month]) {
          acc[month] = {
            month,
            environmental: [],
            social: [],
            governance: []
          };
        }
        
        acc[month].environmental.push(Number(score.environmental_score || 0));
        acc[month].social.push(Number(score.social_score || 0));
        acc[month].governance.push(Number(score.governance_score || 0));
        
        return acc;
      }, {});

      const trendData = Object.values(monthlyTrends).map((m: any) => ({
        month: m.month,
        environmental: m.environmental.reduce((a: number, b: number) => a + b, 0) / m.environmental.length,
        social: m.social.reduce((a: number, b: number) => a + b, 0) / m.social.length,
        governance: m.governance.reduce((a: number, b: number) => a + b, 0) / m.governance.length,
      }));

      return { avgScores, trendData };
    }
  });

  // Anomaly Detection
  const { data: anomalies } = useQuery({
    queryKey: ['anomaly-detection'],
    queryFn: async () => {
      const alerts = [];

      // Check for delayed shipments
      const { data: delayedShipments } = await supabase
        .from('shipments')
        .select('*')
        .eq('status', 'in-transit');
      
      delayedShipments?.forEach(shipment => {
        if (shipment.eta && new Date(shipment.eta) < new Date()) {
          alerts.push({
            type: 'delivery_delay',
            severity: 'high',
            message: `Shipment ${shipment.id} is delayed`,
            resource: 'shipments',
            resource_id: shipment.id,
            timestamp: new Date().toISOString()
          });
        }
      });

      // Check for low ESG scores
      const { data: lowEsgScores } = await supabase
        .from('esg_scores')
        .select('*')
        .lt('overall_score', 50);
      
      lowEsgScores?.forEach(score => {
        alerts.push({
          type: 'low_esg_score',
          severity: 'medium',
          message: `Low ESG score (${score.overall_score}) for ${score.entity_type} ${score.entity_id}`,
          resource: 'esg_scores',
          resource_id: score.id,
          timestamp: score.assessment_date
        });
      });

      // Check for quality issues
      const { data: qualityIssues } = await supabase
        .from('ai_gradings')
        .select('*')
        .lt('quality_score', 60);
      
      qualityIssues?.forEach(grading => {
        alerts.push({
          type: 'quality_issue',
          severity: 'high',
          message: `Low quality score (${grading.quality_score}) detected in batch ${grading.batch_id}`,
          resource: 'ai_gradings',
          resource_id: grading.id,
          timestamp: grading.analyzed_at
        });
      });

      // Check warehouse capacity
      const { data: warehouses } = await supabase
        .from('warehouses')
        .select('*');
      
      warehouses?.forEach(warehouse => {
        const utilization = (Number(warehouse.current_stock_kg) / Number(warehouse.max_capacity_kg)) * 100;
        if (utilization > 90) {
          alerts.push({
            type: 'capacity_warning',
            severity: 'medium',
            message: `Warehouse ${warehouse.name} is at ${utilization.toFixed(1)}% capacity`,
            resource: 'warehouses',
            resource_id: warehouse.id,
            timestamp: new Date().toISOString()
          });
        }
      });

      return alerts.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    },
    refetchInterval: 60000, // Check every minute
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Comprehensive insights into procurement, logistics, ESG, and system health
        </p>
      </div>

      <Tabs defaultValue="procurement" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="procurement">Procurement Trends</TabsTrigger>
          <TabsTrigger value="logistics">Delivery & ETA</TabsTrigger>
          <TabsTrigger value="esg">ESG Metrics</TabsTrigger>
          <TabsTrigger value="anomalies">Anomaly Alerts</TabsTrigger>
        </TabsList>

        {/* Procurement Trends Tab */}
        <TabsContent value="procurement" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Total Procurement"
              value={`${(procurementData?.reduce((sum: number, d: any) => sum + d.quantity, 0) || 0).toLocaleString()} kg`}
              icon={Package}
            />
            <StatCard
              title="Total Revenue"
              value={`$${(procurementData?.reduce((sum: number, d: any) => sum + d.revenue, 0) || 0).toLocaleString()}`}
              icon={DollarSign}
            />
            <StatCard
              title="Total Batches"
              value={String(procurementData?.reduce((sum: number, d: any) => sum + d.batches, 0) || 0)}
              icon={Calendar}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Monthly Procurement Trends
                </CardTitle>
                <CardDescription>Quantity and revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={procurementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="quantity" 
                      stackId="1"
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
                <CardDescription>Quantity by tobacco grade</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={gradeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {gradeData?.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Logistics Tab */}
        <TabsContent value="logistics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Active Shipments"
              value={deliveryData?.shipments.filter((s: any) => s.status === 'in-transit').length || 0}
              icon={Truck}
            />
            <StatCard
              title="On-Time Delivery"
              value={`${deliveryData?.onTimePercentage.toFixed(1)}%`}
              icon={TrendingUp}
            />
            <StatCard
              title="Total Shipments"
              value={deliveryData?.shipments.length || 0}
              icon={Package}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipment Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={deliveryData?.statusDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Recent Shipments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {deliveryData?.shipments.slice(0, 10).map((shipment: any) => (
                    <div key={shipment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{shipment.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {shipment.from_location} → {shipment.to_location}
                        </p>
                      </div>
                      <Badge variant={
                        shipment.status === 'delivered' ? 'default' :
                        shipment.status === 'in-transit' ? 'secondary' : 'outline'
                      }>
                        {shipment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ESG Metrics Tab */}
        <TabsContent value="esg" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Environmental"
              value={esgData?.avgScores.environmental.toFixed(1) || 0}
              icon={Leaf}
            />
            <StatCard
              title="Social"
              value={esgData?.avgScores.social.toFixed(1) || 0}
              icon={Leaf}
            />
            <StatCard
              title="Governance"
              value={esgData?.avgScores.governance.toFixed(1) || 0}
              icon={Leaf}
            />
            <StatCard
              title="Overall ESG Score"
              value={esgData?.avgScores.overall.toFixed(1) || 0}
              icon={TrendingUp}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5" />
                ESG Score Trends
              </CardTitle>
              <CardDescription>Environmental, Social, and Governance metrics over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={esgData?.trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="environmental" 
                    stroke="hsl(142, 76%, 36%)" 
                    strokeWidth={2}
                    name="Environmental"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="social" 
                    stroke="hsl(221, 83%, 53%)" 
                    strokeWidth={2}
                    name="Social"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="governance" 
                    stroke="hsl(280, 83%, 53%)" 
                    strokeWidth={2}
                    name="Governance"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anomalies Tab */}
        <TabsContent value="anomalies" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Total Alerts"
              value={anomalies?.length || 0}
              icon={AlertTriangle}
            />
            <StatCard
              title="High Priority"
              value={anomalies?.filter((a: any) => a.severity === 'high').length || 0}
              icon={AlertTriangle}
            />
            <StatCard
              title="Medium Priority"
              value={anomalies?.filter((a: any) => a.severity === 'medium').length || 0}
              icon={AlertTriangle}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Active Anomalies & Alerts
              </CardTitle>
              <CardDescription>Real-time system anomaly detection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {anomalies?.length === 0 ? (
                  <Alert>
                    <AlertTitle>All systems operational</AlertTitle>
                    <AlertDescription>No anomalies detected</AlertDescription>
                  </Alert>
                ) : (
                  anomalies?.map((anomaly: any, index: number) => (
                    <Alert key={index} variant={anomaly.severity === 'high' ? 'destructive' : 'default'}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
                        <span>{anomaly.type.replace(/_/g, ' ').toUpperCase()}</span>
                        <Badge variant={getSeverityColor(anomaly.severity) as any}>
                          {anomaly.severity}
                        </Badge>
                      </AlertTitle>
                      <AlertDescription>
                        {anomaly.message}
                        <span className="block text-xs text-muted-foreground mt-1">
                          {new Date(anomaly.timestamp).toLocaleString()}
                        </span>
                      </AlertDescription>
                    </Alert>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
