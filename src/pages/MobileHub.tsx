import { Link } from "react-router-dom";
import { UserPlus, ClipboardList, QrCode, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MobileHub() {
  const apps = [
    {
      title: "Farmer Registration",
      description: "Register new farmers with GPS location",
      icon: UserPlus,
      href: "/mobile/farmer-registration",
      color: "text-primary"
    },
    {
      title: "Technician Activity",
      description: "Log field activities and inspections",
      icon: ClipboardList,
      href: "/mobile/technician-activity",
      color: "text-success"
    },
    {
      title: "QR Scanner",
      description: "Scan batch QR codes for delivery confirmation",
      icon: QrCode,
      href: "/mobile/qr-scanner",
      color: "text-accent"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4 pb-20">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center pt-6 pb-4">
          <h1 className="text-3xl font-bold mb-2">Mobile Apps</h1>
          <p className="text-muted-foreground">
            Field-optimized tools for farmers and technicians
          </p>
        </div>

        <div className="grid gap-4">
          {apps.map((app, idx) => {
            const Icon = app.icon;
            return (
              <Link key={idx} to={app.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className={`h-8 w-8 ${app.color}`} />
                        <span className="text-lg">{app.title}</span>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{app.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">📱 Install as App</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              For the best experience, install this app to your home screen:
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-2 rounded bg-background">
                <p className="font-medium mb-1">iPhone/iPad:</p>
                <p className="text-muted-foreground">Safari → Share → Add to Home Screen</p>
              </div>
              <div className="p-2 rounded bg-background">
                <p className="font-medium mb-1">Android:</p>
                <p className="text-muted-foreground">Chrome → Menu (⋮) → Add to Home screen</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
