import { Package, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const inventory = [
  { id: "WH-A", name: "Warehouse A", capacity: 80, stock: "64,000 kg", max: "80,000 kg" },
  { id: "WH-B", name: "Warehouse B", capacity: 65, stock: "52,000 kg", max: "80,000 kg" },
  { id: "WH-C", name: "Warehouse C", capacity: 45, stock: "36,000 kg", max: "80,000 kg" },
];

export default function Warehouse() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Warehouse Management</h1>
        <p className="text-muted-foreground mt-1">
          Monitor inventory levels and warehouse capacity
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">152,000 kg</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Capacity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <span className="text-2xl font-bold">63%</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <span className="text-2xl font-bold">1</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {inventory.map((warehouse) => (
          <Card key={warehouse.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                <span className="text-sm text-muted-foreground">ID: {warehouse.id}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Capacity Utilization</span>
                <span className="text-muted-foreground">{warehouse.capacity}%</span>
              </div>
              <Progress
                value={warehouse.capacity}
                className={
                  warehouse.capacity > 75
                    ? "bg-warning/20 [&>div]:bg-warning"
                    : "bg-success/20 [&>div]:bg-success"
                }
              />
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-sm font-medium">Current Stock</p>
                  <p className="text-lg font-bold">{warehouse.stock}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Max Capacity</p>
                  <p className="text-lg font-bold">{warehouse.max}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
