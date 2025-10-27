import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Package, CheckCircle, XCircle, AlertCircle, Truck, Calendar, ClipboardCheck } from 'lucide-react';
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
  validation_status: string;
  warehouse_id: string | null;
  inventory_verified: boolean;
  inventory_check_notes: string | null;
  quantity_confirmed: boolean;
  confirmed_quantity_kg: number | null;
  dispatch_scheduled_date: string | null;
  rejection_reason: string | null;
  validated_at: string | null;
  created_at: string;
}

interface Warehouse {
  id: string;
  name: string;
  location: string;
  current_stock_kg: number;
  max_capacity_kg: number;
}

interface ProcurementBatch {
  id: string;
  farmer_name: string;
  quantity_kg: number;
  grade: string;
  status: string;
}

interface DispatchSchedule {
  id: string;
  scheduled_dispatch_date: string;
  dispatch_status: string;
  vehicle_id: string | null;
  driver_name: string | null;
}

export function WarehouseERPValidation() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<ERPOrder[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [batches, setBatches] = useState<ProcurementBatch[]>([]);
  const [dispatchSchedules, setDispatchSchedules] = useState<Record<string, DispatchSchedule>>({});
  const [loading, setLoading] = useState(true);
  const [validatingOrder, setValidatingOrder] = useState<ERPOrder | null>(null);
  const [schedulingDispatch, setSchedulingDispatch] = useState<ERPOrder | null>(null);

  // Validation form state
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [inventoryVerified, setInventoryVerified] = useState(false);
  const [inventoryNotes, setInventoryNotes] = useState('');
  const [quantityConfirmed, setQuantityConfirmed] = useState(false);
  const [confirmedQuantity, setConfirmedQuantity] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Dispatch form state
  const [selectedBatch, setSelectedBatch] = useState('');
  const [dispatchDate, setDispatchDate] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverName, setDriverName] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');

  useEffect(() => {
    fetchData();

    const ordersChannel = supabase
      .channel('erp-validation-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'erp_procurement_orders' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'warehouse_dispatch_schedule' }, fetchDispatchSchedules)
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchOrders(),
      fetchWarehouses(),
      fetchBatches(),
      fetchDispatchSchedules(),
    ]);
    setLoading(false);
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('erp_procurement_orders')
      .select('*')
      .in('status', ['pending', 'approved'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching ERP orders:', error);
    } else {
      setOrders(data || []);
    }
  };

  const fetchWarehouses = async () => {
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('status', 'active')
      .order('name');

    if (error) {
      console.error('Error fetching warehouses:', error);
    } else {
      setWarehouses(data || []);
    }
  };

  const fetchBatches = async () => {
    const { data, error } = await supabase
      .from('procurement_batches')
      .select('*')
      .in('status', ['approved', 'delivered'])
      .order('procurement_date', { ascending: false });

    if (error) {
      console.error('Error fetching batches:', error);
    } else {
      setBatches(data || []);
    }
  };

  const fetchDispatchSchedules = async () => {
    const { data, error } = await supabase
      .from('warehouse_dispatch_schedule')
      .select('*');

    if (error) {
      console.error('Error fetching dispatch schedules:', error);
    } else {
      const schedulesMap = (data || []).reduce((acc, schedule) => {
        acc[schedule.erp_order_id] = schedule;
        return acc;
      }, {} as Record<string, DispatchSchedule>);
      setDispatchSchedules(schedulesMap);
    }
  };

  const handleValidateOrder = async (accepted: boolean) => {
    if (!validatingOrder || !user) return;

    try {
      const updates: any = {
        validation_status: accepted ? 'accepted' : 'rejected',
        validated_by: user.id,
        validated_at: new Date().toISOString(),
      };

      if (accepted) {
        if (!selectedWarehouse) {
          toast.error('Please select a warehouse');
          return;
        }
        if (!inventoryVerified) {
          toast.error('Please verify inventory availability');
          return;
        }
        if (!quantityConfirmed) {
          toast.error('Please confirm quantity');
          return;
        }

        updates.warehouse_id = selectedWarehouse;
        updates.inventory_verified = inventoryVerified;
        updates.inventory_check_notes = inventoryNotes;
        updates.quantity_confirmed = quantityConfirmed;
        updates.confirmed_quantity_kg = parseFloat(confirmedQuantity) || validatingOrder.quantity_kg;
      } else {
        if (!rejectionReason) {
          toast.error('Please provide a rejection reason');
          return;
        }
        updates.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('erp_procurement_orders')
        .update(updates)
        .eq('id', validatingOrder.id);

      if (error) throw error;

      toast.success(`Order ${accepted ? 'accepted' : 'rejected'} successfully`);
      setValidatingOrder(null);
      resetValidationForm();
      fetchOrders();
    } catch (error) {
      console.error('Error validating order:', error);
      toast.error('Failed to validate order');
    }
  };

  const handleScheduleDispatch = async () => {
    if (!schedulingDispatch || !user) return;

    try {
      if (!selectedBatch) {
        toast.error('Please select a batch to dispatch');
        return;
      }
      if (!dispatchDate) {
        toast.error('Please select dispatch date');
        return;
      }
      if (!vehicleId || !driverName) {
        toast.error('Please provide vehicle and driver information');
        return;
      }

      const { error } = await supabase
        .from('warehouse_dispatch_schedule')
        .insert({
          erp_order_id: schedulingDispatch.id,
          warehouse_id: schedulingDispatch.warehouse_id,
          batch_id: selectedBatch,
          scheduled_dispatch_date: dispatchDate,
          vehicle_id: vehicleId,
          driver_name: driverName,
          dispatch_notes: dispatchNotes,
          created_by: user.id,
        });

      if (error) throw error;

      // Update ERP order with dispatch date
      await supabase
        .from('erp_procurement_orders')
        .update({ dispatch_scheduled_date: dispatchDate })
        .eq('id', schedulingDispatch.id);

      toast.success('Dispatch scheduled successfully');
      setSchedulingDispatch(null);
      resetDispatchForm();
      fetchData();
    } catch (error) {
      console.error('Error scheduling dispatch:', error);
      toast.error('Failed to schedule dispatch');
    }
  };

  const handleStartDispatch = async (orderId: string) => {
    const schedule = dispatchSchedules[orderId];
    if (!schedule) return;

    try {
      const { error } = await supabase
        .from('warehouse_dispatch_schedule')
        .update({ 
          dispatch_status: 'in-progress',
          actual_dispatch_date: new Date().toISOString()
        })
        .eq('id', schedule.id);

      if (error) throw error;

      toast.success('Dispatch started - Shipment created automatically');
      fetchData();
    } catch (error) {
      console.error('Error starting dispatch:', error);
      toast.error('Failed to start dispatch');
    }
  };

  const resetValidationForm = () => {
    setSelectedWarehouse('');
    setInventoryVerified(false);
    setInventoryNotes('');
    setQuantityConfirmed(false);
    setConfirmedQuantity('');
    setRejectionReason('');
  };

  const resetDispatchForm = () => {
    setSelectedBatch('');
    setDispatchDate('');
    setVehicleId('');
    setDriverName('');
    setDispatchNotes('');
  };

  const getValidationStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: 'secondary', icon: AlertCircle, label: 'Pending Validation' },
      accepted: { variant: 'default', icon: CheckCircle, label: 'Accepted' },
      rejected: { variant: 'destructive', icon: XCircle, label: 'Rejected' },
      dispatched: { variant: 'default', icon: Truck, label: 'Dispatched' },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getWarehouseCapacity = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    if (!warehouse) return null;
    
    const availableSpace = warehouse.max_capacity_kg - warehouse.current_stock_kg;
    const capacityPercent = (warehouse.current_stock_kg / warehouse.max_capacity_kg) * 100;

    return { warehouse, availableSpace, capacityPercent };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Warehouse Order Validation</h2>
          <p className="text-muted-foreground">
            Validate ERP orders, check inventory, and schedule dispatch
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Package className="h-4 w-4 mr-2" />
            {orders.filter(o => o.validation_status === 'pending').length} Pending
          </Badge>
          <Badge variant="default" className="text-lg px-4 py-2">
            <CheckCircle className="h-4 w-4 mr-2" />
            {orders.filter(o => o.validation_status === 'accepted').length} Accepted
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            <AlertCircle className="h-4 w-4 mr-2" />
            Pending Validation
          </TabsTrigger>
          <TabsTrigger value="accepted">
            <CheckCircle className="h-4 w-4 mr-2" />
            Accepted Orders
          </TabsTrigger>
          <TabsTrigger value="rejected">
            <XCircle className="h-4 w-4 mr-2" />
            Rejected Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
          ) : orders.filter(o => o.validation_status === 'pending').length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No pending orders to validate</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {orders.filter(o => o.validation_status === 'pending').map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">PO #{order.po_number}</CardTitle>
                        <CardDescription>
                          {order.source_system} • Received {format(new Date(order.created_at), 'PPp')}
                        </CardDescription>
                      </div>
                      {getValidationStatusBadge(order.validation_status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Product Type</p>
                        <p className="font-medium">{order.product_type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Quantity Required</p>
                        <p className="font-medium">{order.quantity_kg} kg</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Delivery Date</p>
                        <p className="font-medium">{format(new Date(order.delivery_date), 'PP')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Processing Unit</p>
                        <p className="font-medium">{order.processing_unit_id || 'Not specified'}</p>
                      </div>
                    </div>

                    <Dialog open={validatingOrder?.id === order.id} onOpenChange={(open) => !open && setValidatingOrder(null)}>
                      <DialogTrigger asChild>
                        <Button onClick={() => setValidatingOrder(order)}>
                          <ClipboardCheck className="h-4 w-4 mr-2" />
                          Validate Order
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Validate Order - PO #{order.po_number}</DialogTitle>
                          <DialogDescription>
                            Check inventory availability and confirm quantity
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Select Warehouse</Label>
                              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose warehouse" />
                                </SelectTrigger>
                                <SelectContent>
                                  {warehouses.map((warehouse) => {
                                    const capacity = getWarehouseCapacity(warehouse.id);
                                    return (
                                      <SelectItem key={warehouse.id} value={warehouse.id}>
                                        {warehouse.name} - {warehouse.location}
                                        {capacity && ` (${capacity.availableSpace.toFixed(0)}kg available)`}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </div>

                            {selectedWarehouse && (
                              <div className="bg-muted p-4 rounded-md">
                                {(() => {
                                  const capacity = getWarehouseCapacity(selectedWarehouse);
                                  if (!capacity) return null;
                                  const canFulfill = capacity.availableSpace >= order.quantity_kg;
                                  return (
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Warehouse Capacity</span>
                                        <Badge variant={canFulfill ? 'default' : 'destructive'}>
                                          {canFulfill ? 'Sufficient' : 'Insufficient'}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        Available: {capacity.availableSpace.toFixed(0)} kg / Required: {order.quantity_kg} kg
                                      </p>
                                      <div className="w-full bg-background rounded-full h-2">
                                        <div
                                          className="bg-primary h-2 rounded-full"
                                          style={{ width: `${Math.min(capacity.capacityPercent, 100)}%` }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}

                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="inventory-verified"
                                checked={inventoryVerified}
                                onChange={(e) => setInventoryVerified(e.target.checked)}
                                className="rounded"
                              />
                              <Label htmlFor="inventory-verified">
                                Inventory availability verified
                              </Label>
                            </div>

                            <div className="space-y-2">
                              <Label>Inventory Check Notes</Label>
                              <Textarea
                                placeholder="Add notes about inventory check..."
                                value={inventoryNotes}
                                onChange={(e) => setInventoryNotes(e.target.value)}
                              />
                            </div>

                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="quantity-confirmed"
                                checked={quantityConfirmed}
                                onChange={(e) => setQuantityConfirmed(e.target.checked)}
                                className="rounded"
                              />
                              <Label htmlFor="quantity-confirmed">
                                Quantity confirmed
                              </Label>
                            </div>

                            {quantityConfirmed && (
                              <div className="space-y-2">
                                <Label>Confirmed Quantity (kg)</Label>
                                <Input
                                  type="number"
                                  placeholder={order.quantity_kg.toString()}
                                  value={confirmedQuantity}
                                  onChange={(e) => setConfirmedQuantity(e.target.value)}
                                />
                              </div>
                            )}

                            <div className="space-y-2">
                              <Label>Rejection Reason (if rejecting)</Label>
                              <Textarea
                                placeholder="Provide reason if rejecting this order..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleValidateOrder(true)}
                              disabled={!inventoryVerified || !quantityConfirmed || !selectedWarehouse}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Accept Order
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleValidateOrder(false)}
                              disabled={!rejectionReason}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject Order
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="accepted" className="space-y-4">
          {orders.filter(o => o.validation_status === 'accepted' || o.validation_status === 'dispatched').length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No accepted orders</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {orders.filter(o => o.validation_status === 'accepted' || o.validation_status === 'dispatched').map((order) => {
                const dispatch = dispatchSchedules[order.id];
                return (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-xl">PO #{order.po_number}</CardTitle>
                          <CardDescription>
                            Warehouse: {warehouses.find(w => w.id === order.warehouse_id)?.name || 'N/A'}
                          </CardDescription>
                        </div>
                        {getValidationStatusBadge(order.validation_status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Product Type</p>
                          <p className="font-medium">{order.product_type}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Confirmed Quantity</p>
                          <p className="font-medium">{order.confirmed_quantity_kg || order.quantity_kg} kg</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Delivery Date</p>
                          <p className="font-medium">{format(new Date(order.delivery_date), 'PP')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Inventory Verified</p>
                          <Badge variant={order.inventory_verified ? 'default' : 'secondary'}>
                            {order.inventory_verified ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                      </div>

                      {order.inventory_check_notes && (
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-sm font-medium mb-1">Inventory Notes:</p>
                          <p className="text-sm text-muted-foreground">{order.inventory_check_notes}</p>
                        </div>
                      )}

                      {dispatch && (
                        <div className="bg-primary/10 p-3 rounded-md">
                          <div className="flex items-center gap-2 mb-2">
                            <Truck className="h-4 w-4 text-primary" />
                            <p className="text-sm font-medium">Dispatch Schedule</p>
                            <Badge variant="outline">{dispatch.dispatch_status}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Scheduled Date:</p>
                              <p className="font-medium">{format(new Date(dispatch.scheduled_dispatch_date), 'PPp')}</p>
                            </div>
                            {dispatch.vehicle_id && (
                              <div>
                                <p className="text-muted-foreground">Vehicle:</p>
                                <p className="font-medium">{dispatch.vehicle_id}</p>
                              </div>
                            )}
                            {dispatch.driver_name && (
                              <div>
                                <p className="text-muted-foreground">Driver:</p>
                                <p className="font-medium">{dispatch.driver_name}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {!dispatch && order.validation_status === 'accepted' && (
                          <Dialog open={schedulingDispatch?.id === order.id} onOpenChange={(open) => !open && setSchedulingDispatch(null)}>
                            <DialogTrigger asChild>
                              <Button onClick={() => setSchedulingDispatch(order)}>
                                <Calendar className="h-4 w-4 mr-2" />
                                Schedule Dispatch
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Schedule Dispatch - PO #{order.po_number}</DialogTitle>
                                <DialogDescription>
                                  Select batch and schedule dispatch details
                                </DialogDescription>
                              </DialogHeader>

                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Select Batch to Dispatch</Label>
                                  <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Choose batch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {batches.map((batch) => (
                                        <SelectItem key={batch.id} value={batch.id}>
                                          {batch.id} - {batch.farmer_name} ({batch.quantity_kg}kg, Grade: {batch.grade})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label>Dispatch Date & Time</Label>
                                  <Input
                                    type="datetime-local"
                                    value={dispatchDate}
                                    onChange={(e) => setDispatchDate(e.target.value)}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Vehicle ID</Label>
                                  <Input
                                    placeholder="e.g., VH-001"
                                    value={vehicleId}
                                    onChange={(e) => setVehicleId(e.target.value)}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Driver Name</Label>
                                  <Input
                                    placeholder="Driver name"
                                    value={driverName}
                                    onChange={(e) => setDriverName(e.target.value)}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Dispatch Notes</Label>
                                  <Textarea
                                    placeholder="Additional notes..."
                                    value={dispatchNotes}
                                    onChange={(e) => setDispatchNotes(e.target.value)}
                                  />
                                </div>

                                <Button onClick={handleScheduleDispatch} className="w-full">
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Confirm Schedule
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}

                        {dispatch && dispatch.dispatch_status === 'scheduled' && (
                          <Button onClick={() => handleStartDispatch(order.id)}>
                            <Truck className="h-4 w-4 mr-2" />
                            Start Dispatch
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {orders.filter(o => o.validation_status === 'rejected').length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No rejected orders</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {orders.filter(o => o.validation_status === 'rejected').map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">PO #{order.po_number}</CardTitle>
                        <CardDescription>{order.source_system}</CardDescription>
                      </div>
                      {getValidationStatusBadge(order.validation_status)}
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
                        <p className="text-sm text-muted-foreground">Rejected At</p>
                        <p className="font-medium">
                          {order.validated_at ? format(new Date(order.validated_at), 'PP') : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {order.rejection_reason && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                        <p className="text-sm font-medium text-destructive mb-1">Rejection Reason:</p>
                        <p className="text-sm text-destructive/80">{order.rejection_reason}</p>
                      </div>
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