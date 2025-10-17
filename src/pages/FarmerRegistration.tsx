import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, MapPin, Phone, Mail, Home, FileText, Upload } from "lucide-react";
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
  const [documents, setDocuments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (files: FileList | null) => {
    if (files) {
      setDocuments(Array.from(files));
    }
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
      const { data: farmerData, error: farmerError } = await supabase
        .from('farmers')
        .insert({
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          location: formData.location,
          farm_size_acres: formData.farm_size_acres ? parseFloat(formData.farm_size_acres) : null,
          geo_latitude: formData.geo_latitude ? parseFloat(formData.geo_latitude) : null,
          geo_longitude: formData.geo_longitude ? parseFloat(formData.geo_longitude) : null,
          status: 'active'
        })
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

      toast.success("Farmer registered successfully with documents!");
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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Attachments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="documents" className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Documents (Identity Proof, Land Ownership, Certifications, etc.)
              </Label>
              <Input
                id="documents"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.docx,.doc"
                multiple
                onChange={(e) => handleFileChange(e.target.files)}
                className="h-12 text-base"
              />
              {documents.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Selected {documents.length} file(s):
                  </p>
                  {documents.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 bg-muted rounded-lg text-xs text-muted-foreground">
              <p>• Accepted formats: PDF, JPG, JPEG, PNG, DOCX, DOC</p>
              <p>• You can select multiple files at once</p>
              <p>• Maximum file size: 5MB per document</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
