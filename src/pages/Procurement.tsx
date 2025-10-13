import { useState } from "react";
import { Plus, Calendar, Weight, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const procurements = [
  {
    id: "BATCH-2024-001",
    farmer: "John Smith",
    date: "2024-01-15",
    quantity: "2,500 kg",
    grade: "Premium",
    price: "$12,500",
    status: "approved" as const,
  },
  {
    id: "BATCH-2024-002",
    farmer: "Maria Garcia",
    date: "2024-01-14",
    quantity: "1,800 kg",
    grade: "Standard",
    price: "$8,100",
    status: "pending" as const,
  },
  {
    id: "BATCH-2024-003",
    farmer: "Ahmed Hassan",
    date: "2024-01-13",
    quantity: "3,200 kg",
    grade: "Premium",
    price: "$16,000",
    status: "approved" as const,
  },
  {
    id: "BATCH-2024-004",
    farmer: "Li Wei",
    date: "2024-01-12",
    quantity: "2,100 kg",
    grade: "Standard",
    price: "$9,450",
    status: "processing" as const,
  },
];

export default function Procurement() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Procurement Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage tobacco purchases from farmers
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Batch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Procurement Batch</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="farmer">Select Farmer</Label>
                <Select>
                  <SelectTrigger id="farmer">
                    <SelectValue placeholder="Choose farmer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="f1">John Smith</SelectItem>
                    <SelectItem value="f2">Maria Garcia</SelectItem>
                    <SelectItem value="f3">Ahmed Hassan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity (kg)</Label>
                <Input id="quantity" type="number" placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Select>
                  <SelectTrigger id="grade">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price per kg ($)</Label>
                <Input id="price" type="number" step="0.01" placeholder="0.00" />
              </div>
              <Button className="w-full" onClick={() => setOpen(false)}>
                Create Batch
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Procured
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Weight className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">9,600 kg</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-success" />
              <span className="text-2xl font-bold">$46,050</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent" />
              <span className="text-2xl font-bold">4 Batches</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Procurement Batches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {procurements.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="font-semibold">{item.id}</p>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{item.farmer}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-medium">{item.quantity}</p>
                    <p className="text-xs text-muted-foreground">{item.grade}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{item.price}</p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
