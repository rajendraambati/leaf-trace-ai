import { Users, Package, Truck, Factory, TrendingUp, AlertCircle } from "lucide-react";
import StatCard from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import StatusBadge from "@/components/StatusBadge";

const recentBatches = [
  { id: "BATCH-2024-001", farmer: "John Smith", quantity: "2,500 kg", status: "in-transit" as const },
  { id: "BATCH-2024-002", farmer: "Maria Garcia", quantity: "1,800 kg", status: "processing" as const },
  { id: "BATCH-2024-003", farmer: "Ahmed Hassan", quantity: "3,200 kg", status: "delivered" as const },
  { id: "BATCH-2024-004", farmer: "Li Wei", quantity: "2,100 kg", status: "approved" as const },
];

const complianceMetrics = [
  { name: "ESG Score", value: 85, status: "success" as const },
  { name: "Quality Standards", value: 92, status: "success" as const },
  { name: "Documentation", value: 78, status: "warning" as const },
  { name: "Certifications", value: 95, status: "success" as const },
];

export default function Dashboard() {
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
          value="1,284"
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Batches in Transit"
          value="47"
          icon={Truck}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Warehouse Stock"
          value="156.4T"
          icon={Package}
          trend={{ value: 3, isPositive: false }}
        />
        <StatCard
          title="Processing Units"
          value="8"
          icon={Factory}
          trend={{ value: 2, isPositive: true }}
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
      <Card className="border-warning/50 bg-warning/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-warning">
            <AlertCircle className="h-5 w-5" />
            Active Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">• 3 batches require quality inspection</p>
            <p className="text-sm">• Documentation pending for 5 shipments</p>
            <p className="text-sm">• Warehouse capacity at 78%</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
