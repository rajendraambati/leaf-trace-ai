import { useState, useEffect } from "react";
import { Plus, Search, MapPin, Phone, Mail, Map as MapIcon, Upload, FileText, X } from "lucide-react";
import { MapView, Location } from "@/components/MapView";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Farmers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [farmers, setFarmers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    phone: '',
    email: '',
    farm_size_acres: '',
    geo_latitude: '',
    geo_longitude: ''
  });
  const [documents, setDocuments] = useState<File[]>([]);

  useEffect(() => {
    fetchFarmers();
    
    // Setup realtime subscription
    const channel = supabase
      .channel('farmers_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'farmers' }, () => {
        fetchFarmers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchFarmers = async () => {
    const { data, error } = await supabase
      .from('farmers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load farmers",
        variant: "destructive",
      });
    } else {
      setFarmers(data || []);
    }
    setLoading(false);
  };

  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      toast({
        title: "Getting location...",
        description: "Please allow location access",
      });
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            geo_latitude: position.coords.latitude.toString(),
            geo_longitude: position.coords.longitude.toString()
          });
          toast({
            title: "Success",
            description: "GPS location captured!",
          });
        },
        (error) => {
          toast({
            title: "Error",
            description: "Could not get location: " + error.message,
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Error",
        description: "Geolocation not supported",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (files: FileList | null) => {
    if (files) {
      // Append new files to existing documents array
      setDocuments(prev => [...prev, ...Array.from(files)]);
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const uploadDocument = async (file: File, farmerId: string, index: number) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${farmerId}/document_${index}_${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('registration-documents')
      .upload(fileName, file);

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('registration-documents')
      .getPublicUrl(fileName);

    return { publicUrl, originalName: file.name };
  };

  const generateFarmerId = () => {
    // Generate 8-character alphanumeric ID
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 8; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const farmerId = generateFarmerId();
      
      const { data: farmerData, error: farmerError } = await supabase
        .from('farmers')
        .insert([{
          id: farmerId,
          name: formData.name,
          location: formData.location,
          phone: formData.phone || null,
          email: formData.email || null,
          farm_size_acres: formData.farm_size_acres ? parseFloat(formData.farm_size_acres) : null,
          geo_latitude: formData.geo_latitude ? parseFloat(formData.geo_latitude) : null,
          geo_longitude: formData.geo_longitude ? parseFloat(formData.geo_longitude) : null,
          status: 'active'
        }])
        .select()
        .single();

      if (farmerError) throw farmerError;

      // Upload documents if any
      if (documents.length > 0) {
        const documentUploads = documents.map(async (file, index) => {
          const { publicUrl, originalName } = await uploadDocument(file, farmerData.id, index);
          
          await supabase.from('farmer_documents').insert({
            farmer_id: farmerData.id,
            document_type: 'registration_document',
            document_url: publicUrl,
            uploaded_by: (await supabase.auth.getUser()).data.user?.id
          });
        });

        await Promise.all(documentUploads);
      }

      toast({
        title: "Success",
        description: "Farmer registered successfully with documents!",
      });
      setOpen(false);
      setFormData({ name: '', location: '', phone: '', email: '', farm_size_acres: '', geo_latitude: '', geo_longitude: '' });
      setDocuments([]);
      fetchFarmers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Registration failed",
        variant: "destructive",
      });
    }
  };

  const filteredFarmers = farmers.filter(
    (farmer) =>
      farmer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farmer.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const farmerLocations: Location[] = farmers
    .filter(f => f.geo_latitude && f.geo_longitude)
    .map(f => ({
      lat: f.geo_latitude!,
      lng: f.geo_longitude!,
      name: f.name,
      status: f.status
    }));

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Farmer Management</h1>
          <p className="text-muted-foreground mt-1">
            Register and manage tobacco farmers in your supply chain
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowMap(!showMap)}>
            <MapIcon className="h-4 w-4 mr-2" />
            {showMap ? 'Show List' : 'Show Map'}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Register Farmer
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Register New Farmer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  placeholder="Enter farmer name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location" 
                  placeholder="City, State"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="farmer@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acres">Farm Size (acres)</Label>
                <Input 
                  id="acres" 
                  type="number" 
                  placeholder="0"
                  value={formData.farm_size_acres}
                  onChange={(e) => setFormData({...formData, farm_size_acres: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={getCurrentLocation}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Capture GPS Location
                </Button>
                {formData.geo_latitude && formData.geo_longitude && (
                  <div className="p-2 bg-success/10 rounded-md text-xs">
                    <p className="font-medium text-success">GPS Captured</p>
                    <p className="text-muted-foreground">
                      Lat: {parseFloat(formData.geo_latitude).toFixed(6)}, 
                      Lng: {parseFloat(formData.geo_longitude).toFixed(6)}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="documents" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Documents (Identity, Land, Certifications)
                </Label>
                <Input
                  id="documents"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.docx,.doc"
                  multiple
                  onChange={(e) => {
                    handleFileChange(e.target.files);
                    // Reset input so same file can be selected again if removed
                    e.target.value = '';
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Select one or multiple files. You can add more files by selecting again.
                </p>
                {documents.length > 0 && (
                  <div className="mt-2 space-y-1 max-h-32 overflow-y-auto border rounded-md p-2">
                    <p className="text-xs font-medium mb-2">
                      {documents.length} file(s) ready to upload:
                    </p>
                    {documents.map((file, index) => (
                      <div key={index} className="flex items-center justify-between gap-2 text-xs bg-muted/50 rounded px-2 py-1">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{file.name}</span>
                          <span className="text-muted-foreground flex-shrink-0">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDocument(index)}
                          className="flex-shrink-0 p-1 hover:bg-destructive/10 rounded"
                        >
                          <X className="h-3 w-3 text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full">Register Farmer</Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {showMap ? (
        <MapView locations={farmerLocations} />
      ) : (
        <>
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
                  <p className="text-sm text-muted-foreground mt-1">ID: {farmer.id.slice(0, 8)}</p>
                </div>
                <StatusBadge status={farmer.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{farmer.location}</span>
              </div>
              {farmer.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{farmer.phone}</span>
                </div>
              )}
              {farmer.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{farmer.email}</span>
                </div>
              )}
              <div className="pt-2 border-t border-border">
                <p className="text-sm font-medium">
                  Farm Size: <span className="text-muted-foreground">{farmer.farm_size_acres} acres</span>
                </p>
              </div>
            </CardContent>
            </Card>
          ))}
          </div>
        </>
      )}
    </div>
  );
}
