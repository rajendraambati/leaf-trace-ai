import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, Truck, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface Warehouse {
  id: string;
  name: string;
  location: string;
  current_stock_kg: number;
  max_capacity_kg: number;
  status: string;
}

interface Shipment {
  id: string;
  batch_id: string;
  from_location: string;
  to_location: string;
  status: string;
  actual_arrival: string;
}

interface InventoryItem {
  id: string;
  batch_id: string;
  quantity_kg: number;
  entry_date: string;
  exit_date: string | null;
}

type ViewMode = 'warehouses' | 'shipments' | 'batches';

export default function WarehouseAnalytics() {
  const [viewMode, setViewMode] = useState<ViewMode>('warehouses');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWarehouses();

    // Real-time subscription for warehouses
    const warehouseChannel = supabase
      .channel('warehouse-analytics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'warehouses' }, () => {
        fetchWarehouses();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'warehouse_inventory' }, () => {
        if (selectedWarehouse) {
          fetchInventory(selectedWarehouse.id);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, () => {
        if (selectedWarehouse) {
          fetchShipments(selectedWarehouse.id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(warehouseChannel);
    };
  }, [selectedWarehouse]);

  const fetchWarehouses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .order('name');
    
    if (error) {
      toast.error('Failed to fetch warehouses');
      console.error(error);
    } else {
      setWarehouses(data || []);
    }
    setLoading(false);
  };

  const fetchShipments = async (warehouseId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('to_warehouse_id', warehouseId)
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('Failed to fetch shipments');
      console.error(error);
    } else {
      setShipments(data || []);
    }
    setLoading(false);
  };

  const fetchInventory = async (warehouseId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('warehouse_inventory')
      .select('*')
      .eq('warehouse_id', warehouseId)
      .is('exit_date', null)
      .order('entry_date', { ascending: false });
    
    if (error) {
      toast.error('Failed to fetch inventory');
      console.error(error);
    } else {
      setInventoryItems(data || []);
    }
    setLoading(false);
  };

  const handleWarehouseClick = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setViewMode('shipments');
    fetchShipments(warehouse.id);
    fetchInventory(warehouse.id);
  };

  const handleShipmentClick = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setViewMode('batches');
  };

  const handleBack = () => {
    if (viewMode === 'batches') {
      setViewMode('shipments');
      setSelectedShipment(null);
    } else if (viewMode === 'shipments') {
      setViewMode('warehouses');
      setSelectedWarehouse(null);
      setShipments([]);
      setInventoryItems([]);
    }
  };

  const getCapacityPercentage = (current: number, max: number) => {
    return max > 0 ? Math.round((current / max) * 100) : 0;
  };

  const getCapacityVariant = (percentage: number) => {
    if (percentage > 90) return 'destructive';
    if (percentage > 75) return 'secondary';
    return 'default';
  };

  if (loading && viewMode === 'warehouses') {
    return <div className="text-center p-8">Loading warehouses...</div>;
  }

  return (
    <div className="space-y-6">
      {viewMode !== 'warehouses' && (
        <Button onClick={handleBack} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      )}

      {viewMode === 'warehouses' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {warehouses.map((warehouse) => {
            const capacityPercentage = getCapacityPercentage(
              warehouse.current_stock_kg,
              warehouse.max_capacity_kg
            );
            return (
              <Card
                key={warehouse.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleWarehouseClick(warehouse)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                    <Badge variant={warehouse.status === 'active' ? 'default' : 'secondary'}>
                      {warehouse.status}
                    </Badge>
                  </div>
                  <CardDescription>{warehouse.location}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Capacity</span>
                        <Badge variant={getCapacityVariant(capacityPercentage)}>
                          {capacityPercentage}%
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {warehouse.current_stock_kg.toLocaleString()} kg / {warehouse.max_capacity_kg.toLocaleString()} kg
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="w-4 h-4" />
                      <span>Available: {(warehouse.max_capacity_kg - warehouse.current_stock_kg).toLocaleString()} kg</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {viewMode === 'shipments' && selectedWarehouse && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{selectedWarehouse.name} - Shipments & Inventory</CardTitle>
              <CardDescription>
                Stock: {selectedWarehouse.current_stock_kg.toLocaleString()} kg / {selectedWarehouse.max_capacity_kg.toLocaleString()} kg
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Delivered Shipments
                  </h3>
                  <div className="space-y-3">
                    {shipments.filter(s => s.status === 'delivered').map((shipment) => (
                      <Card
                        key={shipment.id}
                        className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => handleShipmentClick(shipment)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-sm">{shipment.id}</p>
                              <p className="text-xs text-muted-foreground">From: {shipment.from_location}</p>
                            </div>
                            <Badge>{shipment.status}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Current Inventory
                  </h3>
                  <div className="space-y-3">
                    {inventoryItems.map((item) => (
                      <Card key={item.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-sm">Batch: {item.batch_id}</p>
                              <p className="text-xs text-muted-foreground">
                                Entered: {new Date(item.entry_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{item.quantity_kg} kg</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {viewMode === 'batches' && selectedShipment && (
        <Card>
          <CardHeader>
            <CardTitle>Shipment Details: {selectedShipment.id}</CardTitle>
            <CardDescription>Batch information for this shipment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Batch ID</p>
                  <p className="font-semibold">{selectedShipment.batch_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge>{selectedShipment.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">From Location</p>
                  <p className="font-semibold">{selectedShipment.from_location}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">To Warehouse</p>
                  <p className="font-semibold">{selectedShipment.to_location}</p>
                </div>
                {selectedShipment.actual_arrival && (
                  <div>
                    <p className="text-sm text-muted-foreground">Delivered At</p>
                    <p className="font-semibold">
                      {new Date(selectedShipment.actual_arrival).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
              
              {inventoryItems.filter(item => item.batch_id === selectedShipment.batch_id).map(item => (
                <Card key={item.id} className="border-primary">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Stored in {selectedWarehouse?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Entry: {new Date(item.entry_date).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{item.quantity_kg} kg</p>
                        <p className="text-sm text-muted-foreground">Quantity</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
