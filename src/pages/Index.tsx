import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Package, Users, Factory, Warehouse, Truck, BarChart3, Settings, Shield, Activity, FileText, MapPin, Route } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();

  const features = [
    { title: 'Dashboard', description: 'System overview & analytics', icon: BarChart3, path: '/', color: 'bg-primary' },
    { title: 'Farmers', description: 'Manage farmer database', icon: Users, path: '/farmers', color: 'bg-green-500' },
    { title: 'Procurement', description: 'Track batch purchases', icon: Package, path: '/procurement', color: 'bg-blue-500' },
    { title: 'Logistics', description: 'Real-time shipment tracking', icon: Truck, path: '/logistics', color: 'bg-purple-500' },
    { title: 'Journey Simulation', description: 'End-to-end batch tracking', icon: Route, path: '/logistics-journey', color: 'bg-cyan-500' },
    { title: 'Warehouse', description: 'Inventory management', icon: Warehouse, path: '/warehouse', color: 'bg-yellow-500' },
    { title: 'Processing', description: 'Manufacturing workflow', icon: Factory, path: '/processing', color: 'bg-orange-500' },
    { title: 'Compliance', description: 'Audits & certifications', icon: Shield, path: '/compliance', color: 'bg-red-500' },
    { title: 'IoT Devices', description: 'Monitor sensors', icon: Activity, path: '/iot-devices', color: 'bg-indigo-500' },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">LeafTrace AI</h1>
        <p className="text-xl text-muted-foreground">
          Digital Tobacco Supply Chain Management Platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card 
            key={index}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(feature.path)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${feature.color}`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <span>{feature.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Index;
