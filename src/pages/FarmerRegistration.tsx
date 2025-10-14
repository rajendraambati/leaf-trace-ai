import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, MapPin, Phone, Mail, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function FarmerRegistration() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    farm_size_acres: "",
    geo_latitude: "",
    geo_longitude: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      toast.info("Getting your location...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            geo_latitude: position.coords.latitude.toString(),
            geo_longitude: position.coords.longitude.toString()
          });
          toast.success("Location captured!");
        },
        (error) => {
          toast.error("Could not get location: " + error.message);
        }
      );
    } else {
      toast.error("Geolocation not supported");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.from('farmers').insert({
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        location: formData.location,
        farm_size_acres: formData.farm_size_acres ? parseFloat(formData.farm_size_acres) : null,
        geo_latitude: formData.geo_latitude ? parseFloat(formData.geo_latitude) : null,
        geo_longitude: formData.geo_longitude ? parseFloat(formData.geo_longitude) : null,
        status: 'active'
      });

      if (error) throw error;

      toast.success("Farmer registered successfully!");
      navigate("/farmers");
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4 pb-20">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="text-center pt-6 pb-4">
          <UserPlus className="h-12 w-12 mx-auto text-primary mb-3" />
          <h1 className="text-2xl font-bold">Farmer Registration</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Register a new farmer in the system
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base">
                  Full Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  required
                  placeholder="Enter farmer name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-base flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="farmer@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location *
                </Label>
                <Input
                  id="location"
                  type="text"
                  required
                  placeholder="City, Region"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="farm_size" className="text-base flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Farm Size (acres)
                </Label>
                <Input
                  id="farm_size"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.farm_size_acres}
                  onChange={(e) => setFormData({ ...formData, farm_size_acres: e.target.value })}
                  className="h-12 text-base"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12"
                onClick={getCurrentLocation}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Capture GPS Location
              </Button>

              {formData.geo_latitude && formData.geo_longitude && (
                <div className="p-3 bg-success/10 rounded-lg text-sm">
                  <p className="font-medium text-success">GPS Captured</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Lat: {parseFloat(formData.geo_latitude).toFixed(6)}, 
                    Lng: {parseFloat(formData.geo_longitude).toFixed(6)}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={submitting}
              >
                {submitting ? "Registering..." : "Register Farmer"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
