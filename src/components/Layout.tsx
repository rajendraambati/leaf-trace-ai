import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  ShoppingCart, 
  Truck, 
  Warehouse, 
  LogOut,
  Factory,
  FileCheck,
  Sparkles,
  Menu,
  X,
  Layers,
  Network,
  Radio,
  Smartphone,
  ShieldCheck,
  FileText,
  TrendingUp,
  MessageSquare,
  GraduationCap,
  Navigation,
  UserCircle,
  AlertTriangle,
  BarChart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Client Portal", href: "/client-portal", icon: UserCircle },
  { name: "Farmers", href: "/farmers", icon: Users },
  { name: "Procurement", href: "/procurement", icon: ShoppingCart },
  { name: "Logistics", href: "/logistics", icon: Truck },
  { name: "AI Vehicle Tracking", href: "/ai-vehicle-tracking", icon: Sparkles },
  { name: "Dispatcher Dashboard", href: "/dispatcher", icon: Navigation },
  { name: "Warehouse", href: "/warehouse", icon: Warehouse },
  { name: "Processing", href: "/processing", icon: Factory },
  { name: "Compliance", href: "/compliance", icon: FileCheck },
  { name: "Document Management", href: "/document-management", icon: FileText },
  { name: "Compliance Management", href: "/compliance-management", icon: ShieldCheck },
  { name: "AI Grading", href: "/ai-grading", icon: Sparkles },
  { name: "IoT Devices", href: "/iot-devices", icon: Radio },
  { name: "Analytics", href: "/analytics", icon: TrendingUp },
  { name: "AI Insights", href: "/ai-insights", icon: MessageSquare },
  { name: "Training & Support", href: "/training-support", icon: GraduationCap },
  { name: "System Monitor", href: "/system-monitoring", icon: ShieldCheck },
  { name: "Automated Reports", href: "/automated-reports", icon: FileText },
  { name: "Mobile Apps", href: "/mobile", icon: Smartphone },
  { name: "RBAC Matrix", href: "/rbac-matrix", icon: ShieldCheck },
  { name: "Features", href: "/features", icon: Layers },
  { name: "Architecture", href: "/architecture", icon: Network },
  { name: "Logistics Journey", href: "/logistics-journey", icon: Network },
  { name: "Role Selection", href: "/role-selection", icon: Network },
  { name: "Admin", href: "/admin/approvals", icon: Network },
  { name: "ERP-Integration", href: "/erp-integration", icon: Network },
  { name: "AI Vechicle Tracking", href: "/ai-vehicle-tracking", icon: Network },
  { name: "Serialization", href: "/serialization", icon: Network },
  { name: "Predictive Analytics", href: "/predictive-analytics", icon: Network },
  { name: "Document Verification", href: "/document-verification", icon: Network },
  { name: "Docuemnt Templates", href: "/document-templates", icon: Network },
  { name: "Country Management", href: "/country-management", icon: Network },
  { name: "Customer-management", href: "/customer-management", icon: Network },
  { name: "Regulatory Reporting", href: "/regulatory-reporting", icon: Network },
  { name: "Retailer Onboarding", href: "/retailer-onboarding", icon: Network },
  { name: "Sales Rep Tracking", href: "/sales-rep-tracking", icon: Network },
  { name: "Promotional Campaigns", href: "/promotional-campaigns", icon: Network },
  { name: "Wholesales Sync", href: "/wholesaler-sync", icon: Network },
  { name: "Driver App", href: "/driver-app", icon: Network },
  { name: "Install", href: "/install", icon: Network },
  { name: "Track", href: "/track", icon: Network },
  { name: "Qr Scanner", href: "/qr-scanner", icon: Network },
  { name: "Anomaly Monitoring", href: "/anomaly-monitoring", icon: AlertTriangle },
  { name: "Contract Generation", href: "/contract-generation", icon: FileText },
  { name: "BI Reports", href: "/bi-reports", icon: BarChart },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden",
          sidebarOpen ? "block" : "hidden"
        )}
        onClick={() => setSidebarOpen(false)}
      >
        <div
          className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex h-16 items-center justify-between px-6 border-b border-border">
            <h1 className="text-xl font-bold text-primary">TobaccoTrace</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <ScrollArea className="h-[calc(100vh-4rem)]">
            <nav className="flex flex-col gap-1 p-4">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:block lg:w-64 lg:border-r lg:border-border lg:bg-card">
        <div className="flex h-16 items-center px-6 border-b border-border">
          <h1 className="text-xl font-bold text-primary">TobaccoTrace</h1>
        </div>
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <nav className="flex flex-col gap-1 p-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            {user && (
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user.email}
              </span>
            )}
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
