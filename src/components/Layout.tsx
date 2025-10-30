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
  MapPin,
  Package,
  BarChart3,
  Settings,
  Route,
  QrCode,
  Activity,
  UserCheck,
  Building2,
  Globe,
  Target,
  BookOpen,
  Monitor,
  Zap,
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
  Eye,
  LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    title: "Core Modules",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Farmers", href: "/farmers", icon: Users },
      { name: "Procurement", href: "/procurement", icon: ShoppingCart },
      { name: "Logistics", href: "/logistics", icon: Truck },
      { name: "Logistics Journey", href: "/logistics-journey", icon: Route },
      { name: "Warehouse", href: "/warehouse", icon: Warehouse },
      { name: "Processing", href: "/processing", icon: Factory },
      { name: "Compliance", href: "/compliance", icon: FileCheck },
    ],
  },
  {
    title: "Mobile Features",
    items: [
      { name: "Mobile Hub", href: "/mobile", icon: Smartphone },
      { name: "Farmer Registration", href: "/mobile/farmer-registration", icon: UserPlus },
      { name: "Technician Activity", href: "/mobile/technician-activity", icon: Activity },
      { name: "QR Scanner", href: "/qr-scanner", icon: QrCode },
    ],
  },
  {
    title: "Authentication",
    items: [
      { name: "Sign In", href: "/signin", icon: UserCheck },
      { name: "Register", href: "/register", icon: UserPlus },
      { name: "Role Selection", href: "/role-selection", icon: Users },
    ],
  },
  {
    title: "Admin & Management",
    items: [
      { name: "Admin Approvals", href: "/admin/approvals", icon: FileCheck },
      { name: "RBAC Matrix", href: "/rbac-matrix", icon: ShieldCheck },
      { name: "Country Management", href: "/country-management", icon: Globe },
      { name: "Customer Management", href: "/customer-management", icon: Building2 },
    ],
  },
  {
    title: "Analytics & Insights",
    items: [
      { name: "Analytics", href: "/analytics", icon: TrendingUp },
      { name: "AI Insights", href: "/ai-insights", icon: MessageSquare },
      { name: "AI Grading", href: "/ai-grading", icon: Sparkles },
      { name: "Predictive Analytics", href: "/predictive-analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Monitoring & Tracking",
    items: [
      { name: "System Monitoring", href: "/system-monitoring", icon: Monitor },
      { name: "Training & Support", href: "/training-support", icon: GraduationCap },
      { name: "ERP Integration", href: "/erp-integration", icon: Database },
      { name: "AI Vehicle Tracking", href: "/ai-vehicle-tracking", icon: Car },
      { name: "Dispatcher", href: "/dispatcher", icon: Navigation },
      { name: "Serialization", href: "/serialization", icon: Package },
      { name: "IoT Devices", href: "/iot-devices", icon: Radio },
    ],
  },
  {
    title: "Documents",
    items: [
      { name: "Document Management", href: "/document-management", icon: FileText },
      { name: "Document Verification", href: "/document-verification", icon: FileSignature },
      { name: "Document Templates", href: "/document-templates", icon: ClipboardList },
      { name: "Compliance Management", href: "/compliance-management", icon: ShieldCheck },
      { name: "Automated Reports", href: "/automated-reports", icon: FileBarChart },
    ],
  },
  {
    title: "Sales & Distribution",
    items: [
      { name: "Regulatory Reporting", href: "/regulatory-reporting", icon: FileBarChart },
      { name: "Retailer Onboarding", href: "/retailer-onboarding", icon: Store },
      { name: "Sales Rep Tracking", href: "/sales-rep-tracking", icon: Sales },
      { name: "Promotional Campaigns", href: "/promotional-campaigns", icon: Megaphone },
      { name: "Wholesaler Sync", href: "/wholesaler-sync", icon: RefreshCw },
    ],
  },
  {
    title: "Portal & Apps",
    items: [
      { name: "Client Portal", href: "/client-portal", icon: UserCircle },
      { name: "Driver App", href: "/driver-app", icon: Car },
      { name: "Install App", href: "/install", icon: Download },
      { name: "Track Shipment", href: "/track", icon: MapPin },
    ],
  },
  {
    title: "System",
    items: [
      { name: "Features", href: "/features", icon: Layers },
      { name: "Architecture", href: "/architecture", icon: Network },
    ],
  },
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
        {navigationGroups.map((group) => (
          <Collapsible key={group.title} defaultOpen={true} className="group/collapsible">
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1.5 flex items-center justify-between">
                  {!isCollapsed && (
                    <>
                      <span>{group.title}</span>
                      <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </>
                  )}
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
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
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
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
