import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useGPSTracking } from '@/hooks/useGPSTracking';
import { useEnhancedOfflineSync } from '@/hooks/useEnhancedOfflineSync';
import { Camera } from '@capacitor/camera';
import { CheckCircle2, Camera as CameraIcon, Loader2 } from 'lucide-react';

interface ChecklistItem {
  id: string;
  label: string;
  type: 'checkbox' | 'text' | 'number' | 'textarea' | 'select' | 'rating' | 'photo' | 'signature';
  required: boolean;
  options?: string[];
  unit?: string;
}

interface MobileChecklistProps {
  checklistType: 'pre_trip' | 'delivery' | 'compliance' | 'vehicle_inspection' | 'post_trip';
  shipmentId?: string;
  vehicleId?: string;
  onComplete?: () => void;
}

export function MobileChecklist({ checklistType, shipmentId, vehicleId, onComplete }: MobileChecklistProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { currentPosition, getCurrentPosition } = useGPSTracking();
  const { queueOperation } = useEnhancedOfflineSync();
  
  const [template, setTemplate] = useState<any>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTemplate();
    getCurrentPosition();
  }, [checklistType]);

  const loadTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from('mobile_checklist_templates')
        .select('*')
        .eq('checklist_type', checklistType)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setTemplate(data);
    } catch (error) {
      console.error('Error loading template:', error);
      toast({
        title: "Error",
        description: "Failed to load checklist template",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponse = (itemId: string, value: any) => {
    setResponses(prev => ({ ...prev, [itemId]: value }));
  };

  const takePhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: 'dataUrl' as any
      });

      if (photo.dataUrl) {
        setPhotos(prev => [...prev, photo.dataUrl!]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      toast({
        title: "Camera Error",
        description: "Failed to capture photo",
        variant: "destructive",
      });
    }
  };

  const validateResponses = () => {
    const items: ChecklistItem[] = template?.items || [];
    
    for (const item of items) {
      if (item.required && !responses[item.id]) {
        return { valid: false, message: `${item.label} is required` };
      }
    }

    return { valid: true };
  };

  const handleSubmit = async () => {
    const validation = validateResponses();
    
    if (!validation.valid) {
      toast({
        title: "Incomplete Checklist",
        description: validation.message,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const checklistData = {
        template_id: template.id,
        driver_id: user?.id,
        shipment_id: shipmentId,
        vehicle_id: vehicleId,
        checklist_type: checklistType,
        responses,
        completed_at: new Date().toISOString(),
        gps_latitude: currentPosition?.latitude,
        gps_longitude: currentPosition?.longitude,
        photos,
        compliance_status: 'passed'
      };

      // Use enhanced offline sync with high priority
      const result = await queueOperation(
        'mobile_checklist_responses',
        'insert',
        checklistData,
        10 // High priority
      );

      if (result.success) {
        toast({
          title: "Checklist Complete",
          description: result.synced ? "Checklist submitted successfully" : "Checklist saved for sync",
        });

        if (onComplete) {
          onComplete();
        }
      }
    } catch (error) {
      console.error('Error submitting checklist:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit checklist",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!template) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Checklist template not found</p>
        </CardContent>
      </Card>
    );
  }

  const items: ChecklistItem[] = template.items || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{template.name}</CardTitle>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="space-y-2">
            <Label>
              {item.label}
              {item.required && <span className="text-destructive ml-1">*</span>}
            </Label>

            {item.type === 'checkbox' && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={responses[item.id] || false}
                  onCheckedChange={(checked) => handleResponse(item.id, checked)}
                />
                <span className="text-sm">{item.label}</span>
              </div>
            )}

            {item.type === 'text' && (
              <Input
                value={responses[item.id] || ''}
                onChange={(e) => handleResponse(item.id, e.target.value)}
                placeholder={item.label}
              />
            )}

            {item.type === 'number' && (
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  value={responses[item.id] || ''}
                  onChange={(e) => handleResponse(item.id, parseFloat(e.target.value))}
                  placeholder={item.label}
                />
                {item.unit && <span className="text-sm text-muted-foreground">{item.unit}</span>}
              </div>
            )}

            {item.type === 'textarea' && (
              <Textarea
                value={responses[item.id] || ''}
                onChange={(e) => handleResponse(item.id, e.target.value)}
                placeholder={item.label}
                rows={3}
              />
            )}

            {item.type === 'select' && (
              <Select
                value={responses[item.id] || ''}
                onValueChange={(value) => handleResponse(item.id, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${item.label}`} />
                </SelectTrigger>
                <SelectContent>
                  {item.options?.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {item.type === 'rating' && (
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    variant={responses[item.id] === rating ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleResponse(item.id, rating)}
                  >
                    {rating}
                  </Button>
                ))}
              </div>
            )}

            {item.type === 'photo' && (
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={takePhoto}
                  className="w-full"
                >
                  <CameraIcon className="mr-2 h-4 w-4" />
                  Take Photo
                </Button>
                {photos.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {photos.length} photo(s) captured
                  </p>
                )}
              </div>
            )}
          </div>
        ))}

        <div className="pt-4">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Complete Checklist
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}