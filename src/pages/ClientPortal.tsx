import { useState } from 'react';
import Layout from '@/components/Layout';
import { useClientPortal } from '@/hooks/useClientPortal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Package, 
  Truck, 
  FileText, 
  DollarSign, 
  Bell, 
  CheckCircle,
  Clock,
  AlertCircle,
  MapPin,
  Download,
  Eye
} from 'lucide-react';

export default function ClientPortal() {
  const { portalData, isLoading, markAsRead, markAllAsRead } = useClientPortal();
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-6 space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!portalData) {
    return (
      <Layout>
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Portal Access</h3>
              <p className="text-muted-foreground">
                You don't have access to the client portal. Please contact your administrator.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const { access, stats, orders, shipments, documents, invoices, notifications } = portalData;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; label: string }> = {
      pending: { variant: 'default', label: 'Pending' },
      approved: { variant: 'default', label: 'Approved' },
      'in-transit': { variant: 'default', label: 'In Transit' },
      delivered: { variant: 'default', label: 'Delivered' },
      paid: { variant: 'default', label: 'Paid' },
      overdue: { variant: 'destructive', label: 'Overdue' },
    };
    const config = statusConfig[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Client Portal</h1>
            <p className="text-muted-foreground">
              Welcome to your {access.client_type.replace('_', ' ')} portal
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            {access.access_level}
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{stats.total_orders}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.pending_orders} pending
                  </p>
                </div>
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Shipments</p>
                  <p className="text-2xl font-bold">{stats.active_shipments}</p>
                </div>
                <Truck className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Invoices</p>
                  <p className="text-2xl font-bold">{stats.pending_invoices}</p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Notifications</p>
                  <p className="text-2xl font-bold">{stats.unread_notifications}</p>
                  <p className="text-xs text-muted-foreground mt-1">unread</p>
                </div>
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            {access.allowed_modules.includes('orders') && (
              <TabsTrigger value="orders">Orders</TabsTrigger>
            )}
            {access.allowed_modules.includes('tracking') && (
              <TabsTrigger value="tracking">Tracking</TabsTrigger>
            )}
            {access.allowed_modules.includes('documents') && (
              <TabsTrigger value="documents">Documents</TabsTrigger>
            )}
            {access.allowed_modules.includes('invoices') && (
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
            )}
            <TabsTrigger value="notifications">
              Notifications
              {stats.unread_notifications > 0 && (
                <Badge variant="destructive" className="ml-2 px-2 py-0.5 text-xs">
                  {stats.unread_notifications}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {orders.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No orders found</p>
                    ) : (
                      orders.map((order: any) => (
                        <Card key={order.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">
                                    {order.order_number || order.erp_order_id || order.id}
                                  </h4>
                                  {getStatusBadge(order.status || order.validation_status)}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Quantity: {order.quantity_kg || order.total_quantity_kg} kg
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Date: {new Date(order.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">
                                  ${order.total_amount?.toFixed(2) || 'N/A'}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tracking Tab */}
          <TabsContent value="tracking" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Shipment Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {shipments.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No shipments found</p>
                    ) : (
                      shipments.map((shipment: any) => (
                        <Card key={shipment.id}>
                          <CardContent className="pt-6">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold">{shipment.id}</h4>
                                {getStatusBadge(shipment.status)}
                              </div>
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div className="text-sm">
                                  <p className="font-medium">From: {shipment.from_location}</p>
                                  <p className="font-medium">To: {shipment.to_location}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>
                                  ETA: {shipment.estimated_arrival 
                                    ? new Date(shipment.estimated_arrival).toLocaleString()
                                    : 'TBD'}
                                </span>
                              </div>
                              {shipment.driver_name && (
                                <p className="text-sm">Driver: {shipment.driver_name}</p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {documents.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No documents found</p>
                    ) : (
                      documents.map((doc: any) => (
                        <Card key={doc.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <h4 className="font-semibold">{doc.document_type}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {doc.document_number}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Issued: {new Date(doc.issue_date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {doc.document_url && (
                                  <>
                                    <Button size="sm" variant="outline">
                                      <Eye className="h-4 w-4 mr-2" />
                                      View
                                    </Button>
                                    <Button size="sm" variant="outline">
                                      <Download className="h-4 w-4 mr-2" />
                                      Download
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {invoices.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No invoices found</p>
                    ) : (
                      invoices.map((invoice: any) => (
                        <Card key={invoice.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">{invoice.invoice_number}</h4>
                                  {getStatusBadge(invoice.payment_status)}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Date: {new Date(invoice.invoice_date).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Due: {new Date(invoice.due_date).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right space-y-2">
                                <p className="text-2xl font-bold">
                                  {invoice.currency} {invoice.total_amount.toFixed(2)}
                                </p>
                                {invoice.pdf_url && (
                                  <Button size="sm" variant="outline">
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Notifications</CardTitle>
                  {stats.unread_notifications > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAllAsRead.mutate()}
                      disabled={markAllAsRead.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark All Read
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {notifications.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No notifications</p>
                    ) : (
                      notifications.map((notif: any) => (
                        <Card 
                          key={notif.id}
                          className={notif.is_read ? 'opacity-60' : ''}
                        >
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">{notif.title}</h4>
                                  {!notif.is_read && (
                                    <Badge variant="default" className="text-xs">New</Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    {notif.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{notif.message}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(notif.created_at).toLocaleString()}
                                </p>
                              </div>
                              {!notif.is_read && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => markAsRead.mutate(notif.id)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
