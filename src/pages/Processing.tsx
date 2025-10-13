import { Factory, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/StatusBadge";
import { Progress } from "@/components/ui/progress";

const processingUnits = [
  {
    id: "PU-01",
    name: "Processing Unit Alpha",
    batch: "BATCH-2024-002",
    status: "processing" as const,
    progress: 65,
    output: "1,170 kg",
  },
  {
    id: "PU-02",
    name: "Processing Unit Beta",
    batch: "BATCH-2024-001",
    status: "completed" as const,
    progress: 100,
    output: "2,500 kg",
  },
];

export default function Processing() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Processing Management</h1>
        <p className="text-muted-foreground mt-1">
          Track tobacco processing and transformation stages
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Units
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Factory className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">8</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Processing Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-success" />
              <span className="text-2xl font-bold">3,670 kg</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {processingUnits.map((unit) => (
          <Card key={unit.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Factory className="h-5 w-5" />
                  {unit.name}
                </CardTitle>
                <StatusBadge status={unit.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Processing Progress</span>
                <span className="text-muted-foreground">{unit.progress}%</span>
              </div>
              <Progress
                value={unit.progress}
                className={
                  unit.progress === 100
                    ? "bg-success/20 [&>div]:bg-success"
                    : "bg-primary/20 [&>div]:bg-primary"
                }
              />
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-sm font-medium">Batch ID</p>
                  <p className="text-sm text-muted-foreground">{unit.batch}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Output</p>
                  <p className="text-sm text-muted-foreground">{unit.output}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
