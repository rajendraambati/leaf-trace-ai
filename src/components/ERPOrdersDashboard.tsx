import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Package, CheckCircle, XCircle, Clock, Bell, Warehouse, AlertTriangle, Filter } from 'lucide-react';
import { format, differenceInHours } from 'date-fns';

interface ERPOrder {
  id: string;
  po_number: string;
  product_type: string;
  quantity_kg: number;
  delivery_date: string;
  processing_unit_id: string | null;
  source_system: string;
  status: string;
  validation_status: string;
  validation_errors: any;
  validation_sla_hours: number;
  created_at: string;
  validated_at: string | null;
}

interface DispatchSchedule {
  id: string;
  erp_order_id: string;
  dispatch_status: string;
  scheduled_dispatch_date: string;
  actual_dispatch_date: string | null;
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
  const [dispatchSchedules, setDispatchSchedules] = useState<DispatchSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [filterProcessingUnit, setFilterProcessingUnit] = useState<string>('all');
  const [filterProduct, setFilterProduct] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [processingUnits, setProcessingUnits] = useState<string[]>([]);
  const [productTypes, setProductTypes] = useState<string[]>([]);

  useEffect(() => {
    fetchOrders();
    fetchNotifications();
    fetchDispatchSchedules();
    fetchFilterOptions();

    const ordersChannel = supabase
      .channel('erp-orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'erp_procurement_orders' }, fetchOrders)
      .subscribe();

    const notificationsChannel = supabase
      .channel('warehouse-notifications-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'warehouse_notifications' }, fetchNotifications)
      .subscribe();

    const dispatchChannel = supabase
      .channel('dispatch-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'warehouse_dispatch_schedule' }, fetchDispatchSchedules)
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(dispatchChannel);
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

  const fetchDispatchSchedules = async () => {
    const { data, error } = await supabase
      .from('warehouse_dispatch_schedule')
      .select('*');

    if (error) {
      console.error('Error fetching dispatch schedules:', error);
    } else {
      setDispatchSchedules(data || []);
    }
  };

  const fetchFilterOptions = async () => {
    const { data } = await supabase
      .from('erp_procurement_orders')
      .select('processing_unit_id, product_type');

    if (data) {
      const units = [...new Set(data.map(d => d.processing_unit_id).filter(Boolean))];
      const products = [...new Set(data.map(d => d.product_type).filter(Boolean))];
      setProcessingUnits(units as string[]);
      setProductTypes(products);
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

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (filterProcessingUnit !== 'all' && order.processing_unit_id !== filterProcessingUnit) return false;
    if (filterProduct !== 'all' && order.product_type !== filterProduct) return false;
    if (filterStatus !== 'all' && order.validation_status !== filterStatus) return false;
    if (filterDateFrom && new Date(order.delivery_date) < new Date(filterDateFrom)) return false;
    if (filterDateTo && new Date(order.delivery_date) > new Date(filterDateTo)) return false;
    return true;
  });

  // Calculate alerts
  const delayedValidations = orders.filter(order => {
    if (order.validation_status !== 'pending') return false;
    const hoursSinceCreation = differenceInHours(new Date(), new Date(order.created_at));
    return hoursSinceCreation > (order.validation_sla_hours || 24);
  });

  const failedDispatches = dispatchSchedules.filter(
    schedule => schedule.dispatch_status === 'failed' || 
    (schedule.dispatch_status === 'scheduled' && 
     new Date(schedule.scheduled_dispatch_date) < new Date())
  );

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const alertCount = delayedValidations.length + failedDispatches.length;

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
          {alertCount > 0 && (
            <Badge variant="destructive" className="text-lg px-4 py-2">
              <AlertTriangle className="h-4 w-4 mr-2" />
              {alertCount} Alerts
            </Badge>
          )}
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Bell className="h-4 w-4 mr-2" />
              {unreadCount} Unread
            </Badge>
          )}
        </div>
      </div>

      {/* Alerts Section */}
      {alertCount > 0 && (
        <div className="space-y-3">
          {delayedValidations.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Delayed Validations ({delayedValidations.length})</AlertTitle>
              <AlertDescription>
                The following orders have exceeded their validation SLA:
                <ul className="mt-2 space-y-1">
                  {delayedValidations.slice(0, 3).map(order => (
                    <li key={order.id} className="text-sm">
                      PO #{order.po_number} - Pending for {differenceInHours(new Date(), new Date(order.created_at))} hours
                    </li>
                  ))}
                  {delayedValidations.length > 3 && (
                    <li className="text-sm font-medium">...and {delayedValidations.length - 3} more</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {failedDispatches.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Failed/Overdue Dispatches ({failedDispatches.length})</AlertTitle>
              <AlertDescription>
                The following dispatches have failed or are overdue:
                <ul className="mt-2 space-y-1">
                  {failedDispatches.slice(0, 3).map(schedule => {
                    const order = orders.find(o => o.id === schedule.erp_order_id);
                    return (
                      <li key={schedule.id} className="text-sm">
                        {order ? `PO #${order.po_number}` : 'Unknown Order'} - 
                        {schedule.dispatch_status === 'failed' ? ' Failed' : ' Overdue'}
                      </li>
                    );
                  })}
                  {failedDispatches.length > 3 && (
                    <li className="text-sm font-medium">...and {failedDispatches.length - 3} more</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

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
          {/* Filters Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>Processing Unit</Label>
                  <Select value={filterProcessingUnit} onValueChange={setFilterProcessingUnit}>
                    <SelectTrigger>
                      <SelectValue placeholder="All units" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Units</SelectItem>
                      {processingUnits.map(unit => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Product Type</Label>
                  <Select value={filterProduct} onValueChange={setFilterProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="All products" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Products</SelectItem>
                      {productTypes.map(product => (
                        <SelectItem key={product} value={product}>{product}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="dispatched">Dispatched</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Delivery From</Label>
                  <Input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Delivery To</Label>
                  <Input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                  />
                </div>
              </div>

              {(filterProcessingUnit !== 'all' || filterProduct !== 'all' || filterStatus !== 'all' || filterDateFrom || filterDateTo) && (
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setFilterProcessingUnit('all');
                      setFilterProduct('all');
                      setFilterStatus('all');
                      setFilterDateFrom('');
                      setFilterDateTo('');
                    }}
                  >
                    Clear Filters
                  </Button>
                  <span className="ml-3 text-sm text-muted-foreground">
                    Showing {filteredOrders.length} of {orders.length} orders
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No ERP orders received yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredOrders.map((order) => {
                const isDelayed = delayedValidations.some(d => d.id === order.id);
                return (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl">PO #{order.po_number}</CardTitle>
                          {isDelayed && (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Delayed
                            </Badge>
                          )}
                        </div>
                        <CardDescription>
                          From {order.source_system} • {format(new Date(order.created_at), 'PPp')}
                        </CardDescription>
                      </div>
                      {getStatusBadge(order.validation_status)}
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

                    {order.validation_status === 'pending' && (
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
                );
              })}
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