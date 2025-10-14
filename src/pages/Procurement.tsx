import { useState, useEffect } from "react";
import { Plus, Calendar, Weight, DollarSign, Camera, Download } from "lucide-react";
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
  const [selectedBatch, setSelectedBatch] = useState<ProcurementBatch | null>(null);
  const [procurements, setProcurements] = useState<ProcurementBatch[]>([]);
  const [farmers, setFarmers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    farmer_id: "",
    quantity_kg: "",
    grade: "",
    price_per_kg: "",
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

  const handleSubmit = async () => {
    const batchId = `BATCH-${Date.now()}`;
    let finalGrade = formData.grade;
    
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

        // Store AI grading result
        await supabase.from('ai_gradings').insert({
          batch_id: batchId,
          image_url: publicUrl,
          ai_grade: aiData.ai_grade,
          quality_score: aiData.quality_score,
          crop_health_score: aiData.crop_health_score,
          esg_score: aiData.esg_score,
          confidence: aiData.confidence,
          defects_detected: aiData.defects_detected || [],
          recommendations: aiData.recommendations || []
        });

        // Use AI grade
        finalGrade = aiData.ai_grade;
        toast.success(`AI Grading Complete: ${aiData.ai_grade} (${aiData.confidence}% confidence)`);
      } catch (error: any) {
        console.error('AI grading error:', error);
        toast.error('AI grading failed, using manual grade');
      } finally {
        setGradingImage(false);
      }
    }
    
    const { error } = await supabase.from('procurement_batches').insert({
      id: batchId,
      farmer_id: formData.farmer_id,
      quantity_kg: parseFloat(formData.quantity_kg),
      grade: finalGrade,
      price_per_kg: parseFloat(formData.price_per_kg),
      status: 'pending',
      qr_code: generateBatchQRData(batchId),
    });

    if (error) {
      console.error('Batch creation error:', error);
      toast.error(`Failed to create batch: ${error.message}`);
    } else {
      toast.success('Batch created successfully');
      setOpen(false);
      setFormData({ farmer_id: "", quantity_kg: "", grade: "", price_per_kg: "" });
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
                <Select value={formData.farmer_id} onValueChange={(v) => setFormData({...formData, farmer_id: v})}>
                  <SelectTrigger id="farmer">
                    <SelectValue placeholder="Choose farmer" />
                  </SelectTrigger>
                  <SelectContent>
                    {farmers.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
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
                      <p className="text-xs text-muted-foreground">{new Date(item.procurement_date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
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
    </div>
  );
}
