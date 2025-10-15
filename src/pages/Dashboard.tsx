import { Users, Package, Truck, Factory, TrendingUp, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import StatCard from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  activeFarmers: number;
  batchesInTransit: number;
  warehouseStock: number;
  processingUnits: number;
}

interface RecentBatch {
  id: string;
  farmer: string;
  quantity: string;
  status: "pending" | "approved" | "processing" | "in-transit" | "delivered";
}

interface ComplianceMetric {
  name: string;
  value: number;
  status: "success" | "warning" | "error";
}

interface Alert {
  message: string;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    activeFarmers: 0,
    batchesInTransit: 0,
    warehouseStock: 0,
    processingUnits: 0,
  });
  const [recentBatches, setRecentBatches] = useState<RecentBatch[]>([]);
  const [complianceMetrics, setComplianceMetrics] = useState<ComplianceMetric[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch active farmers count
      const { count: farmersCount } = await supabase
        .from("farmers")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Fetch batches in transit
      const { count: transitCount } = await supabase
        .from("shipments")
        .select("*", { count: "exact", head: true })
        .eq("status", "in_transit");

      // Fetch warehouse stock
      const { data: warehouses } = await supabase
        .from("warehouses")
        .select("current_stock_kg");
      
      const totalStock = warehouses?.reduce((sum, w) => sum + (Number(w.current_stock_kg) || 0), 0) || 0;

      // Fetch processing units
      const { count: unitsCount } = await supabase
        .from("processing_units")
        .select("*", { count: "exact", head: true });

      setStats({
        activeFarmers: farmersCount || 0,
        batchesInTransit: transitCount || 0,
        warehouseStock: totalStock / 1000, // Convert to tons
        processingUnits: unitsCount || 0,
      });

      // Fetch recent batches
      const { data: batches } = await supabase
        .from("procurement_batches")
        .select(`
          id,
          quantity_kg,
          status,
          farmers (name)
        `)
        .order("created_at", { ascending: false })
        .limit(4);

      const formattedBatches: RecentBatch[] = (batches || []).map((batch: any) => ({
        id: batch.id,
        farmer: batch.farmers?.name || "Unknown Farmer",
        quantity: `${Number(batch.quantity_kg).toLocaleString()} kg`,
        status: batch.status || "pending",
      }));

      setRecentBatches(formattedBatches);

      // Fetch compliance metrics
      const { data: esgScores } = await supabase
        .from("esg_scores")
        .select("overall_score")
        .order("assessment_date", { ascending: false })
        .limit(10);

      const avgESG = esgScores?.length 
        ? Math.round(esgScores.reduce((sum, s) => sum + (Number(s.overall_score) || 0), 0) / esgScores.length)
        : 0;

      const { data: qualityTests } = await supabase
        .from("batch_quality_tests")
        .select("ai_confidence")
        .not("ai_confidence", "is", null)
        .order("test_date", { ascending: false })
        .limit(10);

      const avgQuality = qualityTests?.length
        ? Math.round(qualityTests.reduce((sum, t) => sum + (Number(t.ai_confidence) || 0), 0) / qualityTests.length * 100)
        : 0;

      const { data: certifications } = await supabase
        .from("compliance_certifications")
        .select("status");

      const activeCerts = certifications?.filter(c => c.status === "active").length || 0;
      const totalCerts = certifications?.length || 1;
      const certPercentage = Math.round((activeCerts / totalCerts) * 100);

      const { data: documents } = await supabase
        .from("farmer_documents")
        .select("id");

      const docScore = documents?.length ? Math.min(100, Math.round((documents.length / 100) * 100)) : 0;

      setComplianceMetrics([
        { name: "ESG Score", value: avgESG, status: avgESG >= 80 ? "success" : avgESG >= 60 ? "warning" : "error" },
        { name: "Quality Standards", value: avgQuality, status: avgQuality >= 80 ? "success" : avgQuality >= 60 ? "warning" : "error" },
        { name: "Documentation", value: docScore, status: docScore >= 80 ? "success" : docScore >= 60 ? "warning" : "error" },
        { name: "Certifications", value: certPercentage, status: certPercentage >= 80 ? "success" : certPercentage >= 60 ? "warning" : "error" },
      ]);

      // Calculate alerts
      const alertsList: Alert[] = [];

      const { data: pendingTests } = await supabase
        .from("batch_quality_tests")
        .select("id")
        .is("ai_grade", null);

      if (pendingTests && pendingTests.length > 0) {
        alertsList.push({ message: `${pendingTests.length} batches require quality inspection` });
      }

      const { data: pendingShipments } = await supabase
        .from("shipments")
        .select("id")
        .eq("status", "pending");

      if (pendingShipments && pendingShipments.length > 0) {
        alertsList.push({ message: `Documentation pending for ${pendingShipments.length} shipments` });
      }

      const { data: capacityCheck } = await supabase
        .from("warehouses")
        .select("current_stock_kg, max_capacity_kg");

      const totalCapacity = capacityCheck?.reduce((sum, w) => sum + (Number(w.max_capacity_kg) || 0), 0) || 1;
      const usedCapacity = capacityCheck?.reduce((sum, w) => sum + (Number(w.current_stock_kg) || 0), 0) || 0;
      const capacityPercent = Math.round((usedCapacity / totalCapacity) * 100);

      if (capacityPercent > 75) {
        alertsList.push({ message: `Warehouse capacity at ${capacityPercent}%` });
      }

      setAlerts(alertsList);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Supply Chain Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage your tobacco supply chain from farm to factory
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Supply Chain Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Monitor and manage your tobacco supply chain from farm to factory
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Farmers"
          value={stats.activeFarmers.toLocaleString()}
          icon={Users}
        />
        <StatCard
          title="Batches in Transit"
          value={stats.batchesInTransit}
          icon={Truck}
        />
        <StatCard
          title="Warehouse Stock"
          value={`${stats.warehouseStock.toFixed(1)}T`}
          icon={Package}
        />
        <StatCard
          title="Processing Units"
          value={stats.processingUnits}
          icon={Factory}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Batches */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Recent Batches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">{batch.id}</p>
                    <p className="text-sm text-muted-foreground">{batch.farmer}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{batch.quantity}</span>
                    <StatusBadge status={batch.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Compliance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Compliance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {complianceMetrics.map((metric) => (
                <div key={metric.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{metric.name}</span>
                    <span className="text-muted-foreground">{metric.value}%</span>
                  </div>
                  <Progress
                    value={metric.value}
                    className={
                      metric.status === "success"
                        ? "bg-success/20 [&>div]:bg-success"
                        : "bg-warning/20 [&>div]:bg-warning"
                    }
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertCircle className="h-5 w-5" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <p key={index} className="text-sm">• {alert.message}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
