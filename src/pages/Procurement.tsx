import { useState, useEffect } from "react";
import { Plus, Calendar, Weight, DollarSign, Camera, Download, MapPin, Droplets, Eye } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { generateBatchQRData } from "@/utils/qrcode";
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

interface ProcurementBatch {
  id: string;
  farmer_id: string;
  quantity_kg: number;
  grade: string;
  price_per_kg: number;
  total_price: number;
  status: string;
  procurement_date: string;
  qr_code: string | null;
  farmers?: { name: string };
}

export default function Procurement() {
  const [open, setOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<ProcurementBatch | null>(null);
  const [procurements, setProcurements] = useState<ProcurementBatch[]>([]);
  const [farmers, setFarmers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    farmer_id: "",
    farmer_id_manual: "",
    quantity_kg: "",
    grade: "",
    price_per_kg: "",
    moisture_percentage: "",
    gps_latitude: null as number | null,
    gps_longitude: null as number | null,
  });
  const [capturedImage, setCapturedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [gradingImage, setGradingImage] = useState(false);

  useEffect(() => {
    fetchProcurements();
    fetchFarmers();
    
    // Setup realtime subscription
    const channel = supabase
      .channel('procurement_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'procurement_batches' }, () => {
        fetchProcurements();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProcurements = async () => {
    const { data, error } = await supabase
      .from('procurement_batches')
      .select('*, farmers!fk_procurement_batches_farmer(name)')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('Failed to fetch procurement batches');
    } else {
      setProcurements(data || []);
    }
    setLoading(false);
  };

  const fetchFarmers = async () => {
    const { data } = await supabase
      .from('farmers')
      .select('id, name')
      .eq('status', 'active');
    setFarmers(data || []);
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image must be less than 10MB");
        return;
      }
      setCapturedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    toast.info("Capturing GPS location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          gps_latitude: position.coords.latitude,
          gps_longitude: position.coords.longitude,
        });
        toast.success("GPS location captured successfully");
      },
      (error) => {
        toast.error(`Failed to get location: ${error.message}`);
      }
    );
  };

  const handleSubmit = async () => {
    // Validate form data
    if (!formData.farmer_id || !formData.quantity_kg || !formData.price_per_kg || !formData.moisture_percentage) {
      toast.error("Please fill in all required fields (Farmer, Quantity, Price, Moisture %)");
      return;
    }

    // Validate farmer ID is exactly 8 characters
    if (formData.farmer_id_manual && formData.farmer_id_manual.trim().length !== 8) {
      toast.error("Farmer ID must be exactly 8 characters");
      return;
    }

    const quantity = parseFloat(formData.quantity_kg);
    const pricePerKg = parseFloat(formData.price_per_kg);

    if (isNaN(quantity) || quantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    if (isNaN(pricePerKg) || pricePerKg <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    const batchId = `BATCH-${Date.now()}`;
    let finalGrade = formData.grade;
    let aiGradingPayload: any = null;
    // If image captured, grade it with AI first
    if (capturedImage) {
      setGradingImage(true);
      try {
        // Upload image
        const fileExt = capturedImage.name.split('.').pop();
        const fileName = `${batchId}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('tobacco-images')
          .upload(fileName, capturedImage);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('tobacco-images')
          .getPublicUrl(fileName);

        // Call AI grading
        const { data: aiData, error: aiError } = await supabase.functions.invoke('ai-grading', {
          body: { imageUrl: publicUrl }
        });

        if (aiError) throw aiError;

        // Prepare AI grading payload to insert AFTER batch is created (to satisfy FK)
        aiGradingPayload = {
          batch_id: batchId,
          image_url: publicUrl,
          ai_grade: aiData.ai_grade,
          quality_score: aiData.quality_score,
          crop_health_score: aiData.crop_health_score,
          esg_score: aiData.esg_score,
          confidence: aiData.confidence,
          defects_detected: aiData.defects_detected || [],
          recommendations: aiData.recommendations || []
        };

        // Override manual grade with AI grade
        finalGrade = aiData.ai_grade;
        toast.success(`AI Grading Complete: ${aiData.ai_grade} (${aiData.confidence}% confidence)`);
        
        // Show if AI grade differs from farmer's input
        if (formData.grade && formData.grade !== aiData.ai_grade) {
          toast.info(`AI corrected grade from ${formData.grade} to ${aiData.ai_grade}`);
        }
      } catch (error: any) {
        console.error('AI grading error:', error);
        toast.error('AI grading failed, using manual grade');
        // If no manual grade was provided, set a default
        if (!finalGrade) {
          finalGrade = 'Standard';
        }
      } finally {
        setGradingImage(false);
      }
    } else if (!finalGrade) {
      // If no image and no manual grade, require manual grade
      toast.error("Please select a grade or upload an image for AI grading");
      return;
    }
    
    const { error } = await supabase.from('procurement_batches').insert({
      id: batchId,
      farmer_id: formData.farmer_id,
      quantity_kg: quantity,
      grade: finalGrade,
      price_per_kg: pricePerKg,
      moisture_percentage: parseFloat(formData.moisture_percentage),
      gps_latitude: formData.gps_latitude,
      gps_longitude: formData.gps_longitude,
      status: 'pending',
      qr_code: generateBatchQRData(batchId),
    });

    // Insert AI grading record after batch exists (FK safe)
    if (!error && aiGradingPayload) {
      const { error: aiInsertError } = await supabase.from('ai_gradings').insert(aiGradingPayload);
      if (aiInsertError) {
        console.error('AI grading insert error:', aiInsertError);
      }
    }

    if (error) {
      console.error('Batch creation error:', error);
      toast.error(`Failed to create batch: ${error.message}`);
    } else {
      toast.success('Batch created successfully');
      setOpen(false);
      setFormData({ 
        farmer_id: "", 
        farmer_id_manual: "",
        quantity_kg: "", 
        grade: "", 
        price_per_kg: "",
        moisture_percentage: "",
        gps_latitude: null,
        gps_longitude: null,
      });
      setCapturedImage(null);
      setImagePreview(null);
    }
  };

  const handleAIGrade = async (batchId: string) => {
    toast.info('Starting AI grading analysis...');
    const { data, error } = await supabase.functions.invoke('ai-grading', {
      body: { batchId, imageUrl: null }
    });

    if (error) {
      toast.error('AI grading failed');
    } else {
      toast.success(`AI Grade: ${data.ai_grade} (Confidence: ${data.confidence}%)`);
    }
  };

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
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Procurement Batch</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="farmer">Select Farmer</Label>
                <Select 
                  value={formData.farmer_id} 
                  onValueChange={(v) => setFormData({...formData, farmer_id: v})}
                >
                  <SelectTrigger id="farmer">
                    <SelectValue placeholder="Choose farmer" />
                  </SelectTrigger>
                  <SelectContent>
                    {farmers.map(f => <SelectItem key={f.id} value={f.id}>{f.id} - {f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="farmer-id-manual">Farmer ID</Label>
                <Input 
                  id="farmer-id-manual" 
                  type="text" 
                  placeholder="Enter Farmer ID" 
                  value={formData.farmer_id_manual} 
                  onChange={(e) => setFormData({...formData, farmer_id_manual: e.target.value})} 
                  maxLength={8}
                />
                <p className="text-xs text-muted-foreground">Must be exactly 8 characters</p>
              </div>

              <div className="space-y-2">
                <Label>Date & Time</Label>
                <div className="px-3 py-2 border border-border rounded-md bg-muted/50 text-sm">
                  {format(new Date(), "dd-MM-yyyy HH:mm:ss")}
                </div>
                <p className="text-xs text-muted-foreground">Auto-captured on batch creation</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity (kg)</Label>
                <Input id="quantity" type="number" placeholder="0" value={formData.quantity_kg} onChange={(e) => setFormData({...formData, quantity_kg: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Select value={formData.grade} onValueChange={(v) => setFormData({...formData, grade: v})}>
                  <SelectTrigger id="grade">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Premium">Premium</SelectItem>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price per kg ($)</Label>
                <Input id="price" type="number" step="0.01" placeholder="0.00" value={formData.price_per_kg} onChange={(e) => setFormData({...formData, price_per_kg: e.target.value})} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="moisture">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4" />
                    Moisture Percentage (%)
                  </div>
                </Label>
                <Input 
                  id="moisture" 
                  type="number" 
                  step="0.1" 
                  min="0" 
                  max="100" 
                  placeholder="0.0" 
                  value={formData.moisture_percentage} 
                  onChange={(e) => setFormData({...formData, moisture_percentage: e.target.value})} 
                />
              </div>

              <div className="space-y-2">
                <Label>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    GPS Location (Traceability)
                  </div>
                </Label>
                {formData.gps_latitude && formData.gps_longitude ? (
                  <div className="px-3 py-2 border border-border rounded-md bg-muted/50 text-sm space-y-1">
                    <p className="text-muted-foreground">Latitude: {formData.gps_latitude.toFixed(6)}</p>
                    <p className="text-muted-foreground">Longitude: {formData.gps_longitude.toFixed(6)}</p>
                  </div>
                ) : (
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    onClick={getCurrentLocation}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Capture GPS Location
                  </Button>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="photo">Photo (Optional - AI Grading)</Label>
                <label htmlFor="photo" className="cursor-pointer">
                  <input
                    id="photo"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleCameraCapture}
                  />
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                    {imagePreview ? (
                      <div className="space-y-2">
                        <img src={imagePreview} alt="Captured" className="max-h-32 mx-auto rounded" />
                        <p className="text-xs text-muted-foreground">AI will grade this batch</p>
                      </div>
                    ) : (
                      <>
                        <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">Capture Tobacco Sample</p>
                        <p className="text-xs text-muted-foreground">AI will analyze & assign grade</p>
                      </>
                    )}
                  </div>
                </label>
              </div>
              
              <Button className="w-full" onClick={handleSubmit} disabled={gradingImage}>
                {gradingImage ? "AI Grading..." : "Create Batch"}
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
              <span className="text-2xl font-bold">{procurements.reduce((sum, p) => sum + p.quantity_kg, 0).toLocaleString()} kg</span>
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
              <span className="text-2xl font-bold">${procurements.reduce((sum, p) => sum + (p.total_price || 0), 0).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Batches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent" />
              <span className="text-2xl font-bold">{procurements.length} Batches</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Procurement Batches</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading batches...</p>
          ) : procurements.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No batches found</p>
          ) : (
            <div className="space-y-3">
              {procurements.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="font-semibold truncate">{item.id}</p>
                      <StatusBadge status={item.status as any} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 truncate">{item.farmers?.name}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-right">
                      <p className="text-sm font-medium">{item.quantity_kg} kg</p>
                      <p className="text-xs text-muted-foreground">{item.grade}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">${item.total_price?.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(item.procurement_date), "dd-MM-yyyy")}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedBatch(item); setDetailDialogOpen(true); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleAIGrade(item.id)}>
                        <Camera className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setSelectedBatch(item); setQrDialogOpen(true); }}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batch QR Code</DialogTitle>
          </DialogHeader>
          {selectedBatch && selectedBatch.qr_code && (
            <QRCodeDisplay data={selectedBatch.qr_code} title={`Batch ${selectedBatch.id}`} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Batch Details</DialogTitle>
          </DialogHeader>
          {selectedBatch && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Batch ID</p>
                  <p className="text-base font-semibold">{selectedBatch.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <StatusBadge status={selectedBatch.status as any} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Farmer Name</p>
                  <p className="text-base">{selectedBatch.farmers?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Farmer ID</p>
                  <p className="text-base">{selectedBatch.farmer_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date & Time</p>
                  <p className="text-base">{format(new Date(selectedBatch.procurement_date), "dd-MM-yyyy HH:mm:ss")}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Quantity</p>
                  <p className="text-base">{selectedBatch.quantity_kg} kg</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Grade</p>
                  <p className="text-base">{selectedBatch.grade}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Price per kg</p>
                  <p className="text-base">${selectedBatch.price_per_kg}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Price</p>
                  <p className="text-base font-semibold">${selectedBatch.total_price?.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setDetailDialogOpen(false);
                      setQrDialogOpen(true);
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    View QR Code
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleAIGrade(selectedBatch.id)}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    AI Grade
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
