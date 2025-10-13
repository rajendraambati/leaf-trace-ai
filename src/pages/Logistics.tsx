import { Truck, MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/StatusBadge";

const shipments = [
  {
    id: "SHIP-2024-001",
    batch: "BATCH-2024-001",
    from: "Virginia, USA",
    to: "Warehouse A",
    status: "in-transit" as const,
    eta: "2024-01-16 14:30",
    driver: "Robert Johnson",
  },
  {
    id: "SHIP-2024-002",
    batch: "BATCH-2024-003",
    from: "Kentucky, USA",
    to: "Processing Unit 2",
    status: "delivered" as const,
    eta: "2024-01-15 09:15",
    driver: "Sarah Williams",
  },
];

export default function Logistics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Logistics Tracking</h1>
        <p className="text-muted-foreground mt-1">
          Real-time tracking of tobacco shipments and deliveries
        </p>
      </div>

      <div className="grid gap-4">
        {shipments.map((shipment) => (
          <Card key={shipment.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  {shipment.id}
                </CardTitle>
                <StatusBadge status={shipment.status} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Route</p>
                    <p className="text-sm text-muted-foreground">
                      {shipment.from} → {shipment.to}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">ETA</p>
                    <p className="text-sm text-muted-foreground">{shipment.eta}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Driver</p>
                  <p className="text-sm text-muted-foreground">{shipment.driver}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Batch: {shipment.batch}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
