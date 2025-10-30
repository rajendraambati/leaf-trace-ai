import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
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
  Radio,
  FileText,
  TrendingUp,
  MessageSquare,
  GraduationCap,
  Navigation,
  UserCircle,
  MapPin,
  Package,
  BarChart3,
  Route,
  QrCode,
  Activity,
  UserCheck,
  Building2,
  Globe,
  Monitor,
  Car,
  Database,
  FileBarChart,
  FileSignature,
  ClipboardList,
  Store,
  TrendingUp as Sales,
  Megaphone,
  RefreshCw,
  UserPlus,
  Download,
  Layers,
  Network,
  ShieldCheck,
  Smartphone,
  LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Client Portal", href: "/client-portal", icon: UserCircle },
  { name: "Farmers", href: "/farmers", icon: Users },
  { name: "Procurement", href: "/procurement", icon: ShoppingCart },
  { name: "Logistics", href: "/logistics", icon: Truck },
  { name: "AI Vehicle Tracking", href: "/ai-vehicle-tracking", icon: Car },
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
  { name: "Predictive Analytics", href: "/predictive-analytics", icon: BarChart3 },
  { name: "System Monitoring", href: "/system-monitoring", icon: Monitor },
  { name: "Training & Support", href: "/training-support", icon: GraduationCap },
  { name: "ERP Integration", href: "/erp-integration", icon: Database },
  { name: "Serialization", href: "/serialization", icon: Package },
  { name: "Document Verification", href: "/document-verification", icon: FileSignature },
  { name: "Document Templates", href: "/document-templates", icon: ClipboardList },
  { name: "Automated Reports", href: "/automated-reports", icon: FileBarChart },
  { name: "Regulatory Reporting", href: "/regulatory-reporting", icon: FileBarChart },
  { name: "Retailer Onboarding", href: "/retailer-onboarding", icon: Store },
  { name: "Sales Rep Tracking", href: "/sales-rep-tracking", icon: Sales },
  { name: "Promotional Campaigns", href: "/promotional-campaigns", icon: Megaphone },
  { name: "Wholesaler Sync", href: "/wholesaler-sync", icon: RefreshCw },
  { name: "Driver App", href: "/driver-app", icon: Car },
  { name: "Mobile Hub", href: "/mobile", icon: Smartphone },
  { name: "QR Scanner", href: "/qr-scanner", icon: QrCode },
  { name: "Country Management", href: "/country-management", icon: Globe },
  { name: "Customer Management", href: "/customer-management", icon: Building2 },
  { name: "Admin Approvals", href: "/admin/approvals", icon: FileCheck },
  { name: "RBAC Matrix", href: "/rbac-matrix", icon: ShieldCheck },
  { name: "Install App", href: "/install", icon: Download },
  { name: "Track Shipment", href: "/track", icon: MapPin },
  { name: "Features", href: "/features", icon: Layers },
  { name: "Architecture", href: "/architecture", icon: Network },
];

function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();

  const isActive = (path: string) => location.pathname === path;
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <div className="flex h-16 items-center px-6 border-b border-border">
        {!isCollapsed && <h1 className="text-xl font-bold text-primary">TobaccoTrace</h1>}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <NavLink
                      to={item.href}
                      end={item.href === "/"}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-primary text-primary-foreground font-medium"
                          : "hover:bg-muted/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.name}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default function Layout({ children }: LayoutProps) {
  const { signOut, user } = useAuth();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />

        <div className="flex-1">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
            <SidebarTrigger />
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
    </SidebarProvider>
  );
}
