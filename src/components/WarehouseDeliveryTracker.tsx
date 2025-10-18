import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Truck, Package, MapPin, Clock, CheckCircle } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

export default function WarehouseDeliveryTracker() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShipments();

    const channel = supabase
      .channel('warehouse-delivery-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'shipments',
        filter: 'to_processing_unit_id=neq.null'
      }, fetchShipments)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchShipments = async () => {
    const { data, error } = await supabase
      .from('shipments')
      .select(`
        *,
        warehouses!shipments_from_warehouse_id_fkey(name, location),
        processing_units(name)
      `)
      .not('to_processing_unit_id', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Failed to fetch shipments");
      console.error(error);
    } else {
      setShipments(data || []);
    }
    setLoading(false);
  };

  const updateShipmentStatus = async (shipmentId: string, status: 'in-transit' | 'delivered') => {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'in-transit') {
      updateData.departure_time = new Date().toISOString();
    } else if (status === 'delivered') {
      updateData.actual_arrival = new Date().toISOString();
    }

    const { error } = await supabase
      .from('shipments')
      .update(updateData)
      .eq('id', shipmentId);

    if (error) {
      toast.error(`Failed to update shipment status: ${error.message}`);
    } else {
      toast.success(`Shipment marked as ${status === 'in-transit' ? 'In Transit' : 'Delivered'}`);
      fetchShipments();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading shipments...
        </CardContent>
      </Card>
    );
  }

  if (shipments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No warehouse delivery shipments found. Create one to get started.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {shipments.map((shipment) => (
        <Card key={shipment.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipment {shipment.id}
                </CardTitle>
                <CardDescription>
                  Batch: {shipment.batch_id}
                </CardDescription>
              </div>
              <StatusBadge status={shipment.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">From:</span>
                  <span>{shipment.warehouses?.name || shipment.from_location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">To:</span>
                  <span>{shipment.processing_units?.name || shipment.to_location}</span>
                </div>
              </div>

              <div className="space-y-2">
                {shipment.vehicle_id && (
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">Vehicle:</span>
                    <span>{shipment.vehicle_id}</span>
                  </div>
                )}
                {shipment.driver_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">Driver:</span>
                    <span>{shipment.driver_name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-sm">
                <p className="text-muted-foreground flex items-center gap-1 mb-1">
                  <Clock className="h-4 w-4" />
                  Created
                </p>
                <p className="font-medium">
                  {new Date(shipment.created_at).toLocaleString()}
                </p>
              </div>
              
              {shipment.departure_time && (
                <div className="text-sm">
                  <p className="text-muted-foreground flex items-center gap-1 mb-1">
                    <Clock className="h-4 w-4" />
                    Departed
                  </p>
                  <p className="font-medium">
                    {new Date(shipment.departure_time).toLocaleString()}
                  </p>
                </div>
              )}

              {shipment.actual_arrival && (
                <div className="text-sm">
                  <p className="text-muted-foreground flex items-center gap-1 mb-1">
                    <CheckCircle className="h-4 w-4" />
                    Delivered
                  </p>
                  <p className="font-medium">
                    {new Date(shipment.actual_arrival).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {shipment.status !== 'delivered' && (
              <div className="flex gap-3 pt-4 border-t">
                {shipment.status === 'pending' && (
                  <Button
                    onClick={() => updateShipmentStatus(shipment.id, 'in-transit')}
                    variant="outline"
                    size="sm"
                  >
                    Mark as In Transit
                  </Button>
                )}
                {(shipment.status === 'in-transit' || shipment.status === 'pending') && (
                  <Button
                    onClick={() => updateShipmentStatus(shipment.id, 'delivered')}
                    size="sm"
                  >
                    Mark as Delivered
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
