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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5" />
            Create New Processing Unit
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
              placeholder="e.g., Processing Unit A, Factory 1"
              required
            />
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
