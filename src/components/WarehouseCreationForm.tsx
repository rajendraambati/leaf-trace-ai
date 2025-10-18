import { useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Warehouse } from "lucide-react";

export function WarehouseCreationForm() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    district: "",
    state: "",
    country: "",
    max_capacity_kg: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return;
    setSubmitting(true);

    try {
      const warehouseId = `WH-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

      const { error } = await supabase.from("warehouses").insert({
        id: warehouseId,
        name: formData.name,
        location: `${formData.city}, ${formData.state}`,
        address: formData.address,
        city: formData.city,
        district: formData.district,
        state: formData.state,
        country: formData.country,
        max_capacity_kg: parseFloat(formData.max_capacity_kg),
        current_stock_kg: 0,
        status: "active",
      });

      if (error) throw error;

      toast.success("Warehouse created successfully!");
      setOpen(false);
      resetForm();
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Failed to create warehouse");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      city: "",
      district: "",
      state: "",
      country: "",
      max_capacity_kg: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Warehouse
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Create New Warehouse
          </DialogTitle>
          <DialogDescription>
            Add a new warehouse for storing tobacco shipment stock
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Warehouse Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Central Warehouse"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g., 123 Main Street"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g., Mumbai"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="district">District *</Label>
              <Input
                id="district"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                placeholder="e.g., Mumbai Suburban"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="e.g., Maharashtra"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="e.g., India"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_capacity_kg">Max Capacity (kg) *</Label>
            <Input
              id="max_capacity_kg"
              type="number"
              step="0.01"
              value={formData.max_capacity_kg}
              onChange={(e) => setFormData({ ...formData, max_capacity_kg: e.target.value })}
              placeholder="e.g., 50000"
              required
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? "Creating..." : "Create Warehouse"}
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
