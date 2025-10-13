import { useState } from "react";
import { Plus, Search, MapPin, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const farmers = [
  {
    id: "F001",
    name: "John Smith",
    location: "Virginia, USA",
    phone: "+1 (555) 123-4567",
    email: "john.smith@email.com",
    acres: 45,
    status: "active" as const,
  },
  {
    id: "F002",
    name: "Maria Garcia",
    location: "North Carolina, USA",
    phone: "+1 (555) 234-5678",
    email: "maria.garcia@email.com",
    acres: 32,
    status: "active" as const,
  },
  {
    id: "F003",
    name: "Ahmed Hassan",
    location: "Kentucky, USA",
    phone: "+1 (555) 345-6789",
    email: "ahmed.hassan@email.com",
    acres: 58,
    status: "active" as const,
  },
  {
    id: "F004",
    name: "Li Wei",
    location: "Tennessee, USA",
    phone: "+1 (555) 456-7890",
    email: "li.wei@email.com",
    acres: 41,
    status: "inactive" as const,
  },
];

export default function Farmers() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFarmers = farmers.filter(
    (farmer) =>
      farmer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farmer.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Farmer Management</h1>
          <p className="text-muted-foreground mt-1">
            Register and manage tobacco farmers in your supply chain
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Register Farmer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Register New Farmer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Enter farmer name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="City, State" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="+1 (555) 000-0000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="farmer@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acres">Farm Size (acres)</Label>
                <Input id="acres" type="number" placeholder="0" />
              </div>
              <Button className="w-full">Register Farmer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search farmers by name or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredFarmers.map((farmer) => (
          <Card key={farmer.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{farmer.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">ID: {farmer.id}</p>
                </div>
                <StatusBadge status={farmer.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{farmer.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{farmer.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{farmer.email}</span>
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-sm font-medium">
                  Farm Size: <span className="text-muted-foreground">{farmer.acres} acres</span>
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
