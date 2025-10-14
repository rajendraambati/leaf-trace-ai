import MobileAppFeatures from "@/components/MobileAppFeatures";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, ShoppingCart, Truck, Warehouse, Factory, 
  FileCheck, Brain, Thermometer, BarChart3, Shield 
} from "lucide-react";

export default function Features() {
  const modules = [
    {
      icon: Users,
      name: "Farmer Management",
      features: [
        "Farmer registration & profiles",
        "Farm location mapping (GPS)",
        "Certification tracking",
        "Document management",
        "Training records",
        "Performance analytics",
        "Communication system",
        "ESG scoring"
      ]
    },
    {
      icon: ShoppingCart,
      name: "Procurement",
      features: [
        "Batch creation & tracking",
        "QR code generation",
        "AI grading with Lovable AI",
        "Price management",
        "Quality testing",
        "Payment tracking",
        "Supplier analytics",
        "Mobile procurement app"
      ]
    },
    {
      icon: Truck,
      name: "Logistics",
      features: [
        "Real-time shipment tracking",
        "GPS monitoring",
        "Temperature monitoring (IoT)",
        "Route optimization",
        "Vehicle management",
        "Delivery verification",
        "Driver management",
        "Logistics analytics"
      ]
    },
    {
      icon: Warehouse,
      name: "Warehouse",
      features: [
        "Inventory management",
        "Storage optimization",
        "Temperature/humidity monitoring (IoT)",
        "Stock alerts",
        "FIFO/LIFO tracking",
        "Capacity planning",
        "Real-time updates",
        "Warehouse analytics"
      ]
    },
    {
      icon: Factory,
      name: "Processing",
      features: [
        "Batch processing tracking",
        "Quality control",
        "Equipment monitoring",
        "Production analytics",
        "Waste tracking",
        "Efficiency metrics",
        "Output forecasting",
        "Process optimization"
      ]
    },
    {
      icon: FileCheck,
      name: "Compliance",
      features: [
        "Audit management",
        "Certification tracking",
        "ESG scoring",
        "Report generation",
        "Document compliance",
        "Regulatory updates",
        "Risk assessment",
        "Compliance analytics"
      ]
    }
  ];

  const crossCuttingFeatures = [
    {
      icon: Brain,
      name: "AI Analytics",
      description: "AI-powered grading, quality assessment, and predictive analytics using Lovable AI"
    },
    {
      icon: Thermometer,
      name: "IoT Integration",
      description: "Real-time sensor monitoring for temperature, humidity, and environmental conditions"
    },
    {
      icon: BarChart3,
      name: "Advanced Analytics",
      description: "Comprehensive dashboards with charts, trends, and performance metrics"
    },
    {
      icon: Shield,
      name: "Role-Based Permissions",
      description: "Secure access control with granular permissions for different user roles"
    }
  ];

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Platform Features</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive tobacco supply chain management system
        </p>
      </div>

      <section className="space-y-6">
        <h2 className="text-3xl font-bold">Module Features</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <module.icon className="h-8 w-8 text-primary" />
                  <CardTitle>{module.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {module.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-bold">Cross-Cutting Features</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {crossCuttingFeatures.map((feature, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <feature.icon className="h-8 w-8 text-primary" />
                    <CardTitle>{feature.name}</CardTitle>
                  </div>
                  <Badge>Active</Badge>
                </div>
                <CardDescription className="mt-4">{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <MobileAppFeatures />
      </section>
    </div>
  );
}
