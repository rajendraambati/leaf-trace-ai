import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Truck, Plus } from "lucide-react";

const formSchema = z.object({
  from_warehouse_id: z.string().min(1, "Source warehouse is required"),
  to_processing_unit_id: z.string().min(1, "Destination processing unit is required"),
  batch_id: z.string().min(1, "Batch ID is required"),
  vehicle_id: z.string().optional(),
  driver_name: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function WarehouseDeliveryShipmentForm() {
  const [open, setOpen] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [processingUnits, setProcessingUnits] = useState<any[]>([]);
  const [allBatches, setAllBatches] = useState<any[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      from_warehouse_id: "",
      to_processing_unit_id: "",
      batch_id: "",
      vehicle_id: "",
      driver_name: "",
    },
  });

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    const [warehousesRes, unitsRes, batchesRes] = await Promise.all([
      supabase.from('warehouses').select('*').eq('status', 'active'),
      supabase.from('processing_units').select('*'),
      supabase.from('warehouse_inventory').select('batch_id, warehouse_id').is('exit_date', null)
    ]);

    if (warehousesRes.data) setWarehouses(warehousesRes.data);
    if (unitsRes.data) setProcessingUnits(unitsRes.data);
    if (batchesRes.data) {
      setAllBatches(batchesRes.data);
    }
  };

  // Watch for warehouse selection changes and filter batches
  const selectedWarehouse = form.watch("from_warehouse_id");
  
  useEffect(() => {
    if (selectedWarehouse) {
      const warehouseBatches = allBatches
        .filter(b => b.warehouse_id === selectedWarehouse)
        .map(b => ({ id: b.batch_id }));
      
      // Remove duplicates
      const uniqueBatches = Array.from(
        new Map(warehouseBatches.map(item => [item.id, item])).values()
      );
      
      setFilteredBatches(uniqueBatches);
      
      // Reset batch selection if it's not in the filtered list
      const currentBatch = form.getValues("batch_id");
      if (currentBatch && !uniqueBatches.some(b => b.id === currentBatch)) {
        form.setValue("batch_id", "");
      }
    } else {
      setFilteredBatches([]);
      form.setValue("batch_id", "");
    }
  }, [selectedWarehouse, allBatches]);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const warehouse = warehouses.find(w => w.id === values.from_warehouse_id);
      const unit = processingUnits.find(u => u.id === values.to_processing_unit_id);

      const shipmentId = `WD-${Date.now()}`;

      const { error } = await supabase.from('shipments').insert({
        id: shipmentId,
        batch_id: values.batch_id,
        from_warehouse_id: values.from_warehouse_id,
        to_processing_unit_id: values.to_processing_unit_id,
        from_location: warehouse?.name || warehouse?.location,
        to_location: unit?.name || 'Processing Unit',
        vehicle_id: values.vehicle_id || null,
        driver_name: values.driver_name || null,
        status: 'pending',
        departure_time: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success("Warehouse delivery shipment created successfully");
      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast.error("Failed to create shipment: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Delivery Shipment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Create Warehouse to Processing Unit Shipment
          </DialogTitle>
          <DialogDescription>
            Create a new shipment from warehouse to processing unit
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="from_warehouse_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From Warehouse</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source warehouse" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name} - {warehouse.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="to_processing_unit_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To Processing Unit</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination processing unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {processingUnits.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name} ({unit.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="batch_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Batch ID</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select batch" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredBatches.length === 0 ? (
                        <div className="px-2 py-3 text-sm text-muted-foreground">
                          {selectedWarehouse ? "No batches available in this warehouse" : "Please select a warehouse first"}
                        </div>
                      ) : (
                        filteredBatches.map((batch) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.id}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vehicle_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle ID (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., VH-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="driver_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Driver Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Driver name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Shipment"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
