import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
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
  AlertTriangle,
  BarChart,
  Code,
  Key,
  Presentation,
  Package,
  QrCode,
  GitBranch,
  Store,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface LayoutProps {
  children: ReactNode;
}

const navigationGroups = [
  {
    label: "Core",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Client Portal", href: "/client-portal", icon: UserCircle },
    ]
  },
  {
    label: "Supply Chain",
    items: [
      { name: "Farmers", href: "/farmers", icon: Users },
      { name: "Procurement", href: "/procurement", icon: ShoppingCart },
      { name: "Processing", href: "/processing", icon: Factory },
      { name: "Warehouse", href: "/warehouse", icon: Warehouse },
    ]
  },
  {
    label: "Logistics & Transport",
    items: [
      { name: "Logistics", href: "/logistics", icon: Truck },
      { name: "AI Vehicle Tracking", href: "/ai-vehicle-tracking", icon: Sparkles },
      { name: "Dispatcher", href: "/dispatcher", icon: Navigation },
      { name: "Driver App", href: "/driver-app", icon: Truck },
      { name: "Logistics Journey", href: "/logistics-journey", icon: Network },
    ]
  },
  {
    label: "Compliance & Docs",
    items: [
      { name: "Compliance", href: "/compliance", icon: FileCheck },
      { name: "Compliance Mgmt", href: "/compliance-management", icon: ShieldCheck },
      { name: "Document Mgmt", href: "/document-management", icon: FileText },
      { name: "Document Verification", href: "/document-verification", icon: FileCheck },
      { name: "Document Templates", href: "/document-templates", icon: FileText },
      { name: "Regulatory Reports", href: "/regulatory-reporting", icon: FileText },
      { name: "Contract Generation", href: "/contract-generation", icon: FileText },
      { name: "Automated Reports", href: "/automated-reports", icon: FileText },
    ]
  },
  {
    label: "Quality & Tracking",
    items: [
      { name: "AI Grading", href: "/ai-grading", icon: Sparkles },
      { name: "Serialization", href: "/serialization", icon: Package },
      { name: "QR Scanner", href: "/qr-scanner", icon: QrCode },
      { name: "Track by Phone", href: "/track", icon: Smartphone },
    ]
  },
  {
    label: "IoT & Monitoring",
    items: [
      { name: "IoT Devices", href: "/iot-devices", icon: Radio },
      { name: "System Monitor", href: "/system-monitoring", icon: ShieldCheck },
      { name: "Anomaly Monitor", href: "/anomaly-monitoring", icon: AlertTriangle },
    ]
  },
  {
    label: "Analytics & Insights",
    items: [
      { name: "Analytics", href: "/analytics", icon: TrendingUp },
      { name: "AI Insights", href: "/ai-insights", icon: MessageSquare },
      { name: "Predictive Analytics", href: "/predictive-analytics", icon: TrendingUp },
      { name: "BI Reports", href: "/bi-reports", icon: BarChart },
    ]
  },
  {
    label: "Sales & Distribution",
    items: [
      { name: "Customer Mgmt", href: "/customer-management", icon: Users },
      { name: "Retailer Onboarding", href: "/retailer-onboarding", icon: Store },
      { name: "Sales Rep Tracking", href: "/sales-rep-tracking", icon: Users },
      { name: "Campaigns", href: "/promotional-campaigns", icon: MessageSquare },
      { name: "Wholesaler Sync", href: "/wholesaler-sync", icon: GitBranch },
    ]
  },
  {
    label: "Integration & API",
    items: [
      { name: "ERP Integration", href: "/erp-integration", icon: GitBranch },
      { name: "API Documentation", href: "/api-documentation", icon: Code },
      { name: "API Management", href: "/api-management", icon: Key },
    ]
  },
  {
    label: "System & Admin",
    items: [
      { name: "Admin Approvals", href: "/admin/approvals", icon: ShieldCheck },
      { name: "RBAC Matrix", href: "/rbac-matrix", icon: ShieldCheck },
      { name: "Country Mgmt", href: "/country-management", icon: Settings },
      { name: "Role Selection", href: "/role-selection", icon: Users },
    ]
  },
  {
    label: "Mobile & Support",
    items: [
      { name: "Mobile Apps", href: "/mobile", icon: Smartphone },
      { name: "Install App", href: "/install", icon: Smartphone },
      { name: "Training & Support", href: "/training-support", icon: GraduationCap },
      { name: "Demo Mode", href: "/demo-mode", icon: Presentation },
    ]
  },
  {
    label: "About",
    items: [
      { name: "Features", href: "/features", icon: Layers },
      { name: "Architecture", href: "/architecture", icon: Network },
    ]
  },
];

function AppSidebar() {
  const location = useLocation();
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b px-4 py-3">
        <h1 className={`font-bold text-primary transition-all ${open ? "text-lg" : "text-sm"}`}>
          {open ? "TobaccoTrace" : "TT"}
        </h1>
      </SidebarHeader>
      <SidebarContent>
        {navigationGroups.map((group, groupIndex) => {
          const hasActiveItem = group.items.some(item => location.pathname === item.href);
          
          return (
            <Collapsible key={groupIndex} defaultOpen={hasActiveItem || groupIndex === 0}>
              <SidebarGroup>
                <CollapsibleTrigger className="w-full">
                  <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1">
                    {group.label}
                    <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                          <SidebarMenuItem key={item.name}>
                            <SidebarMenuButton 
                              asChild 
                              isActive={isActive}
                              tooltip={item.name}
                            >
                              <a href={item.href}>
                                <item.icon className="h-4 w-4" />
                                <span>{item.name}</span>
                              </a>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}

export default function Layout({ children }: LayoutProps) {
  const { signOut, user } = useAuth();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4">
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
          <main className="flex-1 p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
