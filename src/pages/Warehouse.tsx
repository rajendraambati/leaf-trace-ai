import { useEffect, useState } from "react";
import { Package, Warehouse as WarehouseIcon, AlertTriangle, TrendingUp, Thermometer, Droplets } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatCard from "@/components/StatCard";
import IoTSensorMonitor from "@/components/IoTSensorMonitor";
import WarehouseAnalytics from "@/components/WarehouseAnalytics";
import WarehouseInventoryTracker from "@/components/WarehouseInventoryTracker";
import { supabase } from "@/integrations/supabase/client";
import { WarehouseCreationForm } from "@/components/WarehouseCreationForm";
import { toast } from "sonner";

export default function Warehouse() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWarehouses();
    fetchInventory();

    const channel = supabase
      .channel('warehouse-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'warehouses' }, fetchWarehouses)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'warehouse_inventory' }, fetchInventory)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'iot_events',
        filter: 'event_type=eq.temperature_alert'
      }, handleIoTAlert)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleIoTAlert = (payload: any) => {
    const eventData = payload.new;
    
    // Check if the alert is related to a warehouse (via shipment)
    if (eventData.shipment_id) {
      const alertMessage = `${eventData.event_type.toUpperCase()}: ${eventData.event_data?.message || 'IoT sensor alert detected'}`;
      
      toast.error(alertMessage, {
        description: `Device: ${eventData.device_id} | Temperature: ${eventData.temperature}°C`,
        duration: 8000,
      });
    }
  };

  const fetchWarehouses = async () => {
    const { data } = await supabase.from('warehouses').select('*');
    if (data) setWarehouses(data);
    setLoading(false);
  };

  const fetchInventory = async () => {
    const { data } = await supabase.from('warehouse_inventory').select('*');
    if (data) setInventory(data);
  };

  const totalStock = warehouses.reduce((sum, w) => sum + (w.current_stock_kg || 0), 0);
  const totalCapacity = warehouses.reduce((sum, w) => sum + (w.max_capacity_kg || 0), 0);
  const availableSpace = totalCapacity - totalStock;
  const avgCapacity = totalCapacity > 0 ? Math.round((totalStock / totalCapacity) * 100) : 0;
  const alerts = warehouses.filter(w => (w.current_stock_kg / w.max_capacity_kg) > 0.9).length;
  const activeWarehouses = warehouses.filter(w => w.status === 'active').length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Warehouse Management</h1>
          <p className="text-muted-foreground mt-2">
            Monitor storage facilities, inventory levels, and IoT sensors
          </p>
        </div>
        <WarehouseCreationForm />
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <StatCard
          title="Total Stock"
          value={`${totalStock.toLocaleString()} kg`}
          icon={Package}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Available Space"
          value={`${availableSpace.toLocaleString()} kg`}
          icon={Package}
          trend={{ value: avgCapacity, isPositive: avgCapacity < 80 }}
        />
        <StatCard
          title="Active Warehouses"
          value={`${activeWarehouses} / ${warehouses.length}`}
          icon={WarehouseIcon}
        />
        <StatCard
          title="Capacity Alerts"
          value={alerts.toString()}
          icon={AlertTriangle}
          className={alerts > 0 ? "border-destructive" : ""}
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="iot">IoT Sensors</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6">
            {warehouses.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{item.name}</CardTitle>
                      <CardDescription>
                        ID: {item.id} | {item.address && `${item.address}, `}
                        {item.city}{item.district && `, ${item.district}`}, {item.state}, {item.country}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                        {item.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant={
                        (item.current_stock_kg / item.max_capacity_kg * 100) > 90 ? "destructive" : 
                        (item.current_stock_kg / item.max_capacity_kg * 100) > 75 ? "secondary" : "default"
                      }>
                        {Math.round((item.current_stock_kg / item.max_capacity_kg) * 100)}% Capacity
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={(item.current_stock_kg / item.max_capacity_kg) * 100} />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Stock: {item.current_stock_kg?.toLocaleString() || 0} kg</span>
                    <span className="text-muted-foreground">Max: {item.max_capacity_kg?.toLocaleString() || 0} kg</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Thermometer className="w-4 h-4" />
                        Temperature
                      </p>
                      <p className="text-lg font-semibold">{item.temperature || 'N/A'}°C</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Droplets className="w-4 h-4" />
                        Humidity
                      </p>
                      <p className="text-lg font-semibold">{item.humidity || 'N/A'}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Available Space</p>
                      <p className="text-lg font-semibold">
                        {(item.max_capacity_kg - item.current_stock_kg).toLocaleString()} kg
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="iot" className="space-y-6">
          {warehouses.map((warehouse) => (
            <IoTSensorMonitor key={warehouse.id} />
          ))}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <WarehouseAnalytics />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <WarehouseInventoryTracker />
        </TabsContent>
      </Tabs>
    </div>
  );
}
