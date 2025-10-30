import { useState } from 'react';
import { subDays } from 'date-fns';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  TrendingDown,
  Download, 
  Share2, 
  Calendar as CalendarIcon,
  MapPin,
  Building2,
  Package,
  Truck,
  CheckCircle2,
  FileText,
  BarChart3,
  Clock
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import StatCard from '@/components/StatCard';
import { useBIReports, useCreateReportShare, useReportShares, BIFilters } from '@/hooks/useBIReports';
import { generateBIReportPDF } from '@/utils/pdfGenerator';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function BIReports() {
  const [filters, setFilters] = useState<BIFilters>({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
  });
  
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareName, setShareName] = useState('');
  const [shareExpiry, setShareExpiry] = useState('7');

  const { data, isLoading } = useBIReports(filters);
  const createShare = useCreateReportShare();
  const { data: shares } = useReportShares();

  const handleDateSelect = (field: 'startDate' | 'endDate', date: Date | undefined) => {
    if (date) {
      setFilters({ ...filters, [field]: date });
    }
  };

  const handleExportPDF = async () => {
    if (!data) return;
    try {
      await generateBIReportPDF({
        metrics: data.metrics,
        filters,
        trendData: data.trendData,
      });
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
      console.error(error);
    }
  };

  const handleCreateShare = async () => {
    if (!shareName.trim()) {
      toast.error('Please enter a share name');
      return;
    }

    try {
      const share = await createShare.mutateAsync({
        reportName: shareName,
        reportConfig: { filters, metrics: data?.metrics },
        expiresInDays: parseInt(shareExpiry),
      });

      const shareUrl = `${window.location.origin}/shared-report/${share.share_token}`;
      await navigator.clipboard.writeText(shareUrl);
      
      toast.success('Share link copied to clipboard!');
      setShareDialogOpen(false);
      setShareName('');
    } catch (error) {
      toast.error('Failed to create share link');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading BI Reports...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const metrics = data?.metrics || {
    dispatchSuccessRate: 0,
    complianceScore: 0,
    inventoryTurnover: 0,
    fleetUtilization: 0,
    totalShipments: 0,
    onTimeDeliveries: 0,
    avgDeliveryTime: 0,
    complianceReports: 0,
    totalInventory: 0,
    activeVehicles: 0,
  };

  const complianceData = [
    { name: 'Compliant', value: Math.round((metrics.complianceScore / 100) * metrics.complianceReports) },
    { name: 'Non-Compliant', value: Math.round(((100 - metrics.complianceScore) / 100) * metrics.complianceReports) },
  ];

  const fleetData = [
    { name: 'Active', value: metrics.activeVehicles },
    { name: 'Idle', value: Math.round((metrics.activeVehicles / (metrics.fleetUtilization / 100)) - metrics.activeVehicles) },
  ];

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-8 w-8" />
              Business Intelligence Reports
            </h1>
            <p className="text-muted-foreground mt-2">
              Comprehensive KPI dashboards with filters, exports, and secure sharing
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Report
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share BI Report</DialogTitle>
                  <DialogDescription>
                    Create a secure, time-limited share link for this report
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="shareName">Report Name</Label>
                    <Input
                      id="shareName"
                      value={shareName}
                      onChange={(e) => setShareName(e.target.value)}
                      placeholder="Q1 2024 Performance Report"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiry">Expires In</Label>
                    <Select value={shareExpiry} onValueChange={setShareExpiry}>
                      <SelectTrigger id="expiry">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Day</SelectItem>
                        <SelectItem value="7">7 Days</SelectItem>
                        <SelectItem value="14">14 Days</SelectItem>
                        <SelectItem value="30">30 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateShare} disabled={createShare.isPending}>
                    {createShare.isPending ? 'Creating...' : 'Create Share Link'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Refine your report data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(filters.startDate, 'PP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.startDate}
                      onSelect={(date) => handleDateSelect('startDate', date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(filters.endDate, 'PP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.endDate}
                      onSelect={(date) => handleDateSelect('endDate', date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Region</Label>
                <Select value={filters.region || 'all'} onValueChange={(v) => setFilters({ ...filters, region: v === 'all' ? undefined : v })}>
                  <SelectTrigger>
                    <MapPin className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    <SelectItem value="north">North</SelectItem>
                    <SelectItem value="south">South</SelectItem>
                    <SelectItem value="east">East</SelectItem>
                    <SelectItem value="west">West</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Product Type</Label>
                <Select value={filters.productType || 'all'} onValueChange={(v) => setFilters({ ...filters, productType: v === 'all' ? undefined : v })}>
                  <SelectTrigger>
                    <Package className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="tobacco">Tobacco</SelectItem>
                    <SelectItem value="processed">Processed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Dispatch Success Rate"
            value={`${metrics.dispatchSuccessRate.toFixed(1)}%`}
            icon={Truck}
            trend={{
              value: 5.2,
              isPositive: true,
            }}
          />
          <StatCard
            title="Compliance Score"
            value={`${metrics.complianceScore.toFixed(1)}%`}
            icon={FileText}
            trend={{
              value: 2.1,
              isPositive: true,
            }}
          />
          <StatCard
            title="Inventory Turnover"
            value={metrics.inventoryTurnover.toFixed(2)}
            icon={Package}
            trend={{
              value: 8.3,
              isPositive: true,
            }}
          />
          <StatCard
            title="Fleet Utilization"
            value={`${metrics.fleetUtilization.toFixed(1)}%`}
            icon={BarChart3}
            trend={{
              value: 3.5,
              isPositive: false,
            }}
          />
        </div>

        {/* Detailed Metrics */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="dispatch">Dispatch</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="fleet">Fleet & Inventory</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Shipment Trends</CardTitle>
                  <CardDescription>Daily shipment activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data?.trendData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="shipments" stroke="hsl(var(--primary))" name="Total" />
                      <Line type="monotone" dataKey="delivered" stroke="hsl(var(--success))" name="Delivered" />
                      <Line type="monotone" dataKey="delayed" stroke="hsl(var(--destructive))" name="Delayed" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Key Metrics Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm font-medium">Total Shipments</span>
                    <Badge variant="secondary">{metrics.totalShipments}</Badge>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm font-medium">On-Time Deliveries</span>
                    <Badge variant="default">{metrics.onTimeDeliveries}</Badge>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm font-medium">Avg Delivery Time</span>
                    <Badge variant="outline">{metrics.avgDeliveryTime.toFixed(1)}h</Badge>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm font-medium">Active Vehicles</span>
                    <Badge variant="secondary">{metrics.activeVehicles}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Inventory</span>
                    <Badge variant="outline">{metrics.totalInventory.toFixed(0)} kg</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Dispatch Tab */}
          <TabsContent value="dispatch" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Total Shipments"
                value={metrics.totalShipments}
                icon={Package}
              />
              <StatCard
                title="On-Time Deliveries"
                value={metrics.onTimeDeliveries}
                icon={CheckCircle2}
              />
              <StatCard
                title="Avg Delivery Time"
                value={`${metrics.avgDeliveryTime.toFixed(1)}h`}
                icon={Clock}
              />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Dispatch Performance Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={data?.trendData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="delivered" fill="hsl(var(--success))" name="Delivered" />
                    <Bar dataKey="delayed" fill="hsl(var(--destructive))" name="Delayed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={complianceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                      >
                        {complianceData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm font-medium">Compliance Score</span>
                    <Badge variant="default">{metrics.complianceScore.toFixed(1)}%</Badge>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm font-medium">Total Reports</span>
                    <Badge variant="secondary">{metrics.complianceReports}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Submitted</span>
                    <Badge variant="outline">{Math.round((metrics.complianceScore / 100) * metrics.complianceReports)}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Fleet Tab */}
          <TabsContent value="fleet" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Fleet Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={fleetData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                      >
                        {fleetData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm font-medium">Total Inventory</span>
                    <Badge variant="secondary">{metrics.totalInventory.toFixed(0)} kg</Badge>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm font-medium">Turnover Rate</span>
                    <Badge variant="default">{metrics.inventoryTurnover.toFixed(2)}</Badge>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm font-medium">Fleet Utilization</span>
                    <Badge variant="outline">{metrics.fleetUtilization.toFixed(1)}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Active Vehicles</span>
                    <Badge variant="secondary">{metrics.activeVehicles}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Active Shares */}
        {shares && shares.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Active Shared Reports</CardTitle>
              <CardDescription>Manage your shared BI reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {shares.map((share) => (
                  <div key={share.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{share.report_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Expires: {format(new Date(share.expires_at), 'PPP')} • Accessed {share.access_count} times
                      </p>
                    </div>
                    <Badge variant={share.is_active ? 'default' : 'secondary'}>
                      {share.is_active ? 'Active' : 'Expired'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
