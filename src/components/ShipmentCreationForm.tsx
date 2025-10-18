import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Truck } from "lucide-react";
import { useAuditLog } from "@/hooks/useAuditLog";

interface Batch {
  id: string;
  farmer_id: string;
  farmer_name: string;
  quantity_kg: number;
  status: string;
}

interface Warehouse {
  id: string;
  name: string;
  location: string;
  city: string;
  state: string;
}

export function ShipmentCreationForm() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const { logAction } = useAuditLog();

  const [formData, setFormData] = useState({
    batch_id: "",
    from_warehouse_id: "",
    to_warehouse_id: "",
    from_location: "",
    to_location: "",
    vehicle_id: "",
    driver_name: "",
    departure_time: "",
  });

  useEffect(() => {
    if (open) {
      fetchAvailableBatches();
      fetchWarehouses();
    }
  }, [open]);

  const fetchAvailableBatches = async () => {
    const { data, error } = await supabase
      .from("procurement_batches")
      .select("id, farmer_id, farmer_name, quantity_kg, status")
      .in("status", ["approved", "pending"])
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch batches");
      return;
    }

    setBatches(data || []);
  };

  const fetchWarehouses = async () => {
    const { data, error } = await supabase
      .from("warehouses")
      .select("id, name, location, city, state")
      .eq("status", "active")
      .order("name", { ascending: true });

    if (error) {
      toast.error("Failed to fetch warehouses");
      return;
    }

    setWarehouses(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return;
    setSubmitting(true);

    try {
      // Generate unique shipment ID
      const shipmentId = `SHP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create shipment
      const { error: shipmentError } = await supabase
        .from("shipments")
        .insert({
          id: shipmentId,
          batch_id: formData.batch_id,
          from_warehouse_id: formData.from_warehouse_id,
          to_warehouse_id: formData.to_warehouse_id,
          from_location: formData.from_location,
          to_location: formData.to_location,
          vehicle_id: formData.vehicle_id,
          driver_name: formData.driver_name,
          departure_time: formData.departure_time || new Date().toISOString(),
          status: "pending",
          eta: calculateETA(formData.departure_time),
        });

      if (shipmentError) throw shipmentError;

      // Note: Batch status is automatically updated by database trigger

      // Log the action
      await logAction({
        action: "shipment_created",
        resource: "shipment",
        resourceId: shipmentId,
        dataSnapshot: formData,
      });

      toast.success("Shipment created successfully!");
      setOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to create shipment");
    } finally {
      setSubmitting(false);
    }
  };

  const calculateETA = (departureTime: string) => {
    const departure = new Date(departureTime || Date.now());
    // Add 3 days as estimated transit time
    departure.setDate(departure.getDate() + 3);
    return departure.toISOString();
  };

  const resetForm = () => {
    setFormData({
      batch_id: "",
      from_warehouse_id: "",
      to_warehouse_id: "",
      from_location: "",
      to_location: "",
      vehicle_id: "",
      driver_name: "",
      departure_time: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Shipment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Create New Shipment
          </DialogTitle>
          <DialogDescription>
            Create a new shipment by selecting a batch and providing shipping details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="batch_id">Batch ID *</Label>
            <Select
              value={formData.batch_id}
              onValueChange={(value) => setFormData({ ...formData, batch_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a batch" />
              </SelectTrigger>
              <SelectContent>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.id} - {batch.farmer_name} ({batch.quantity_kg}kg) - {batch.status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from_warehouse_id">From Warehouse *</Label>
              <Select
                value={formData.from_warehouse_id}
                onValueChange={(value) => {
                  const warehouse = warehouses.find(w => w.id === value);
                  setFormData({ 
                    ...formData, 
                    from_warehouse_id: value,
                    from_location: warehouse ? `${warehouse.name}, ${warehouse.city}` : ""
                  });
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} - {warehouse.city}, {warehouse.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="to_warehouse_id">To Warehouse *</Label>
              <Select
                value={formData.to_warehouse_id}
                onValueChange={(value) => {
                  const warehouse = warehouses.find(w => w.id === value);
                  setFormData({ 
                    ...formData, 
                    to_warehouse_id: value,
                    to_location: warehouse ? `${warehouse.name}, ${warehouse.city}` : ""
                  });
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} - {warehouse.city}, {warehouse.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle_id">Vehicle ID *</Label>
              <Input
                id="vehicle_id"
                value={formData.vehicle_id}
                onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                placeholder="e.g., TRK-001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="driver_name">Driver Name *</Label>
              <Input
                id="driver_name"
                value={formData.driver_name}
                onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                placeholder="e.g., John Doe"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="departure_time">Departure Time</Label>
            <Input
              id="departure_time"
              type="datetime-local"
              value={formData.departure_time}
              onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use current time
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? "Creating..." : "Create Shipment"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
