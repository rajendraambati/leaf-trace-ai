import { FileCheck, Shield, Award, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const complianceMetrics = [
  { name: "Quality Standards", score: 92, status: "success" },
  { name: "Safety Protocols", score: 88, status: "success" },
  { name: "Environmental Impact", score: 85, status: "success" },
  { name: "Documentation", score: 78, status: "warning" },
  { name: "Labor Standards", score: 94, status: "success" },
  { name: "Certifications", score: 95, status: "success" },
];

const certifications = [
  { name: "ISO 9001", status: "Active", expiry: "2025-12-31" },
  { name: "GAP Certification", status: "Active", expiry: "2025-06-30" },
  { name: "HACCP", status: "Active", expiry: "2025-09-15" },
];

export default function Compliance() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Compliance & ESG</h1>
        <p className="text-muted-foreground mt-1">
          Monitor regulatory compliance and sustainability metrics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overall Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-success" />
              <span className="text-2xl font-bold">88%</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-accent" />
              <span className="text-2xl font-bold">3</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              <span className="text-2xl font-bold">2</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Compliance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {complianceMetrics.map((metric) => (
              <div key={metric.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{metric.name}</span>
                  <span className="text-muted-foreground">{metric.score}%</span>
                </div>
                <Progress
                  value={metric.score}
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Active Certifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {certifications.map((cert) => (
              <div
                key={cert.name}
                className="flex items-center justify-between p-3 rounded-lg border border-border"
              >
                <div>
                  <p className="font-medium">{cert.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Status: {cert.status}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Expires</p>
                  <p className="text-sm text-muted-foreground">{cert.expiry}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
