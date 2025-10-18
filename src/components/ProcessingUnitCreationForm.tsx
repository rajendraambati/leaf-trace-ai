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
import { Plus, Factory } from "lucide-react";

export function ProcessingUnitCreationForm() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    district: "",
    state: "",
    country: "",
    capacity_kg_per_day: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return;
    setSubmitting(true);

    try {
      const unitId = `PU-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

      const { error } = await supabase.from("processing_units").insert({
        id: unitId,
        name: formData.name,
        location: `${formData.city}, ${formData.state}`,
        address: formData.address,
        city: formData.city,
        district: formData.district,
        state: formData.state,
        country: formData.country,
        capacity_kg_per_day: parseFloat(formData.capacity_kg_per_day),
        status: "idle",
      });

      if (error) throw error;

      toast.success("Processing unit created successfully!");
      setOpen(false);
      resetForm();
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Failed to create processing unit");
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
      capacity_kg_per_day: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Processing Unit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5" />
            Create New Processing Unit (Factory)
          </DialogTitle>
          <DialogDescription>
            Add a new processing unit (factory) for tobacco processing
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Processing Unit Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Factory A, Processing Unit 1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g., 456 Industrial Avenue"
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
                placeholder="e.g., Bangalore"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="district">District *</Label>
              <Input
                id="district"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                placeholder="e.g., Bangalore Urban"
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
                placeholder="e.g., Karnataka"
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
            <Label htmlFor="capacity_kg_per_day">Processing Capacity (kg/day) *</Label>
            <Input
              id="capacity_kg_per_day"
              type="number"
              step="0.01"
              value={formData.capacity_kg_per_day}
              onChange={(e) => setFormData({ ...formData, capacity_kg_per_day: e.target.value })}
              placeholder="e.g., 5000"
              required
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? "Creating..." : "Create Processing Unit"}
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
