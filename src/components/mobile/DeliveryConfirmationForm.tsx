import { useState, useRef } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import SignatureCanvas from 'react-signature-canvas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Camera as CameraIcon, MapPin, Signature, Loader2 } from 'lucide-react';

interface DeliveryConfirmationFormProps {
  shipmentId: string;
  onComplete: () => void;
}

export function DeliveryConfirmationForm({ shipmentId, onComplete }: DeliveryConfirmationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [signature, setSignature] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState('');
  
  const signatureRef = useRef<SignatureCanvas>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const capturePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });

      if (image.base64String) {
        const base64Data = `data:image/jpeg;base64,${image.base64String}`;
        setPhotos(prev => [...prev, base64Data]);
        toast({ title: 'Photo captured', description: 'Photo added to delivery confirmation' });
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      toast({
        title: 'Camera Error',
        description: t('camera_required'),
        variant: 'destructive'
      });
    }
  };

  const getCurrentLocation = async () => {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });

      toast({ title: 'Location captured', description: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}` });
    } catch (error) {
      console.error('Error getting location:', error);
      toast({
        title: 'Location Error',
        description: t('location_required'),
        variant: 'destructive'
      });
    }
  };

  const saveSignature = () => {
    if (signatureRef.current) {
      const signatureData = signatureRef.current.toDataURL();
      setSignature(signatureData);
      toast({ title: 'Signature saved' });
    }
  };

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setSignature(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location) {
      toast({
        title: 'Location Required',
        description: 'Please capture current location',
        variant: 'destructive'
      });
      return;
    }

    if (!signature) {
      toast({
        title: 'Signature Required',
        description: 'Please add recipient signature',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('delivery_confirmations').insert({
        shipment_id: shipmentId,
        driver_id: user.id,
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        gps_latitude: location.lat,
        gps_longitude: location.lng,
        signature_url: signature,
        proof_of_delivery_photos: photos,
        receiver_feedback: feedback,
        notes,
        confirmed_at: new Date().toISOString()
      });

      if (error) throw error;

      toast({
        title: t('sync_success'),
        description: 'Delivery confirmed successfully'
      });
      
      onComplete();
    } catch (error) {
      console.error('Error submitting delivery confirmation:', error);
      toast({
        title: t('sync_error'),
        description: 'Failed to confirm delivery',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('delivery_confirmation')}</CardTitle>
          <CardDescription>Complete delivery proof and documentation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recipient Info */}
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Name *</Label>
            <Input
              id="recipient"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Enter recipient name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Recipient Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="Enter phone number"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>Delivery Location *</Label>
            <Button type="button" onClick={getCurrentLocation} variant="outline" className="w-full gap-2">
              <MapPin className="h-4 w-4" />
              {location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : 'Capture Location'}
            </Button>
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <Label>Delivery Photos ({photos.length})</Label>
            <Button type="button" onClick={capturePhoto} variant="outline" className="w-full gap-2">
              <CameraIcon className="h-4 w-4" />
              {t('take_photo')}
            </Button>
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {photos.map((photo, idx) => (
                  <img key={idx} src={photo} alt={`Proof ${idx + 1}`} className="w-full h-20 object-cover rounded border" />
                ))}
              </div>
            )}
          </div>

          {/* Signature */}
          <div className="space-y-2">
            <Label>Recipient Signature *</Label>
            <div className="border rounded-lg p-2 bg-background">
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  className: 'w-full h-32 border rounded',
                  style: { touchAction: 'none' }
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={saveSignature} variant="outline" size="sm" className="gap-2">
                <Signature className="h-4 w-4" />
                Save Signature
              </Button>
              <Button type="button" onClick={clearSignature} variant="outline" size="sm">
                Clear
              </Button>
            </div>
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <Label htmlFor="feedback">Receiver Feedback</Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Any feedback from recipient..."
              rows={3}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Delivery Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={3}
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('submit')}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
