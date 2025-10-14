import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Camera, MapPin, Bell, CloudUpload, QrCode } from "lucide-react";

export default function MobileAppFeatures() {
  const features = [
    {
      icon: Camera,
      title: "Photo Capture",
      description: "Capture and upload batch photos for AI grading",
      status: "Active",
    },
    {
      icon: QrCode,
      title: "QR Scanning",
      description: "Scan batch QR codes for instant tracking",
      status: "Active",
    },
    {
      icon: MapPin,
      title: "GPS Tracking",
      description: "Real-time location tracking for shipments",
      status: "Active",
    },
    {
      icon: Bell,
      title: "Push Notifications",
      description: "Instant alerts for critical events",
      status: "Active",
    },
    {
      icon: CloudUpload,
      title: "Offline Sync",
      description: "Work offline and sync when connected",
      status: "Active",
    },
    {
      icon: Smartphone,
      title: "Responsive UI",
      description: "Optimized for all mobile devices",
      status: "Active",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Mobile App Features</h2>
        <p className="text-muted-foreground mt-2">
          Access all functionality on-the-go with our mobile-optimized interface
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <feature.icon className="h-8 w-8 text-primary" />
                <Badge>{feature.status}</Badge>
              </div>
              <CardTitle className="mt-4">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Learn More
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
