import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Package, CheckCircle, XCircle, Clock, Bell, Warehouse } from 'lucide-react';
import { format } from 'date-fns';

interface ERPOrder {
  id: string;
  po_number: string;
  product_type: string;
  quantity_kg: number;
  delivery_date: string;
  processing_unit_id: string | null;
  source_system: string;
  status: string;
  validation_errors: any;
  created_at: string;
}

interface WarehouseNotification {
  id: string;
  warehouse_id: string;
  order_id: string;
  notification_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  warehouses?: {
    name: string;
  };
}

export function ERPOrdersDashboard() {
  const [orders, setOrders] = useState<ERPOrder[]>([]);
  const [notifications, setNotifications] = useState<WarehouseNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    fetchNotifications();

    const ordersChannel = supabase
      .channel('erp-orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'erp_procurement_orders' }, fetchOrders)
      .subscribe();

    const notificationsChannel = supabase
      .channel('warehouse-notifications-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'warehouse_notifications' }, fetchNotifications)
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('erp_procurement_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching ERP orders:', error);
      toast.error('Failed to fetch ERP orders');
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('warehouse_notifications')
      .select('*, warehouses(name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
    } else {
      setNotifications(data || []);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('erp_procurement_orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      toast.error('Failed to update order status');
    } else {
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('warehouse_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
    } else {
      fetchNotifications();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      pending: { variant: 'secondary', icon: Clock },
      approved: { variant: 'default', icon: CheckCircle },
      rejected: { variant: 'destructive', icon: XCircle },
      fulfilled: { variant: 'default', icon: CheckCircle },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">ERP Integration</h2>
          <p className="text-muted-foreground">
            Manage procurement orders from third-party ERP systems
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Package className="h-4 w-4 mr-2" />
            {orders.length} Total Orders
          </Badge>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-lg px-4 py-2">
              <Bell className="h-4 w-4 mr-2" />
              {unreadCount} Unread
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">
            <Package className="h-4 w-4 mr-2" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No ERP orders received yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">PO #{order.po_number}</CardTitle>
                        <CardDescription>
                          From {order.source_system} • {format(new Date(order.created_at), 'PPp')}
                        </CardDescription>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Product Type</p>
                        <p className="font-medium">{order.product_type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Quantity</p>
                        <p className="font-medium">{order.quantity_kg} kg</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Delivery Date</p>
                        <p className="font-medium">{format(new Date(order.delivery_date), 'PP')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Processing Unit</p>
                        <p className="font-medium">{order.processing_unit_id || 'Not assigned'}</p>
                      </div>
                    </div>

                    {order.validation_errors && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                        <p className="text-sm font-medium text-destructive mb-1">Validation Errors:</p>
                        <ul className="text-sm text-destructive/80 list-disc list-inside">
                          {order.validation_errors.errors?.map((error: string, idx: number) => (
                            <li key={idx}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {order.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'approved')}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateOrderStatus(order.id, 'rejected')}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No notifications yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={notification.is_read ? 'opacity-60' : ''}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Warehouse className="h-5 w-5 mt-1 text-primary" />
                        <div className="space-y-1">
                          <CardTitle className="text-base">
                            {notification.warehouses?.name || 'Warehouse'}
                          </CardTitle>
                          <CardDescription>
                            {format(new Date(notification.created_at), 'PPp')}
                          </CardDescription>
                        </div>
                      </div>
                      {!notification.is_read && (
                        <Badge variant="destructive">New</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm">{notification.message}</p>
                    {!notification.is_read && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        Mark as Read
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}