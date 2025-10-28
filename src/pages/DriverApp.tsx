import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Geolocation } from '@capacitor/geolocation';
import { Camera, CameraResultType } from '@capacitor/camera';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MapView, Location } from '@/components/MapView';
import { 
  MapPin, Navigation, CheckCircle, MessageSquare, 
  Camera as CameraIcon, User, LogOut, Menu 
} from 'lucide-react';
import { toast } from 'sonner';

interface DriverSession {
  id: string;
  status: string;
  vehicle_id: string | null;
  current_latitude: number | null;
  current_longitude: number | null;
}

interface ActiveShipment {
  id: string;
  from_location: string;
  to_location: string;
  status: string;
  eta: string | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
}

export default function DriverApp() {
  const navigate = useNavigate();
  const [session, setSession] = useState<DriverSession | null>(null);
  const [shipments, setShipments] = useState<ActiveShipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<ActiveShipment | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [showChat, setShowChat] = useState(false);
  // Realtime phone-based tracking
  const [phoneNumber, setPhoneNumber] = useState('');
  const channelRef = useRef<any>(null);
  const watchIdRef = useRef<string | null>(null);
  
  // Delivery form state
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  useEffect(() => {
    checkSession();
    startLocationTracking();
  }, []);

  useEffect(() => {
    if (session?.status === 'online') {
      fetchActiveShipments();
    }
  }, [session]);

  const checkSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/sign-in');
      return;
    }

    const { data } = await supabase
      .from('driver_sessions')
      .select('*')
      .eq('driver_id', user.id)
      .is('ended_at', null)
      .single();

    if (data) {
      setSession(data);
    }
  };

  const startLocationTracking = async () => {
    try {
      const position = await Geolocation.getCurrentPosition();
      setCurrentLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });

      // Start continuous location watch for smooth movement
      const id = await Geolocation.watchPosition({ enableHighAccuracy: true }, async (pos) => {
        if (!pos || !pos.coords) return;
        setCurrentLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });

        // Update session location
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('driver_sessions')
            .update({
              current_latitude: pos.coords.latitude,
              current_longitude: pos.coords.longitude
            })
            .eq('driver_id', user.id)
            .is('ended_at', null);
        }

        // Broadcast via realtime channel keyed by phone number
        if (channelRef.current) {
          channelRef.current.track({
            phone: phoneNumber,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            updated_at: new Date().toISOString(),
          });
        }
      });
      watchIdRef.current = id as any;
    } catch (error) {
      console.error('Error tracking location:', error);
      toast.error('Unable to access GPS. Please enable location services.');
    }
  };

  const setupRealtime = async (phone: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    const channel = supabase.channel(`driver:${phone}`);
    channel.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED' && currentLocation) {
        await channel.track({
          phone,
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          updated_at: new Date().toISOString(),
        });
      }
    });
    channelRef.current = channel;
  };

  const fetchActiveShipments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: sessions } = await supabase
      .from('driver_sessions')
      .select('vehicle_id')
      .eq('driver_id', user.id)
      .is('ended_at', null)
      .single();

    if (sessions?.vehicle_id) {
      const { data } = await supabase
        .from('shipments')
        .select('*')
        .eq('vehicle_id', sessions.vehicle_id)
        .eq('status', 'in-transit');

      if (data) {
        setShipments(data);
        if (data.length > 0) {
          setSelectedShipment(data[0]);
        }
      }
    }
  };

  const startSession = async () => {
    if (!phoneNumber) {
      toast.error('Please enter your phone number to start tracking');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
 
    const { data, error } = await supabase
      .from('driver_sessions')
      .insert({
        driver_id: user.id,
        status: 'online',
        current_latitude: currentLocation?.lat,
        current_longitude: currentLocation?.lng
      })
      .select()
      .single();
 
    if (error) {
      toast.error('Failed to start session');
    } else {
      setSession(data);
      await setupRealtime(phoneNumber);
      toast.success('Session started');
    }
  };

  const endSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !session) return;

    await supabase
      .from('driver_sessions')
      .update({ status: 'offline', ended_at: new Date().toISOString() })
      .eq('id', session.id);

    // Cleanup tracking
    if (watchIdRef.current) {
      await Geolocation.clearWatch({ id: watchIdRef.current });
      watchIdRef.current = null;
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setSession(null);
    toast.success('Session ended');
  };

  const takePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl
      });

      if (image.dataUrl) {
        setPhotoUrl(image.dataUrl);
        toast.success('Photo captured');
      }
    } catch (error) {
      toast.error('Failed to capture photo');
    }
  };

  const confirmDelivery = async () => {
    if (!selectedShipment || !currentLocation) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('delivery_confirmations').insert({
      shipment_id: selectedShipment.id,
      driver_id: user.id,
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      notes,
      photo_url: photoUrl,
      gps_latitude: currentLocation.lat,
      gps_longitude: currentLocation.lng
    });

    if (error) {
      toast.error('Failed to confirm delivery');
      return;
    }

    // Update shipment status
    await supabase
      .from('shipments')
      .update({ 
        status: 'delivered',
        actual_arrival: new Date().toISOString()
      })
      .eq('id', selectedShipment.id);

    toast.success('Delivery confirmed!');
    setShowDeliveryForm(false);
    setRecipientName('');
    setRecipientPhone('');
    setNotes('');
    setPhotoUrl('');
    fetchActiveShipments();
  };

  const mapLocations: Location[] = [
    ...(currentLocation ? [{
      lat: currentLocation.lat,
      lng: currentLocation.lng,
      name: 'Your Location',
      status: 'normal' as const
    }] : []),
    ...(selectedShipment?.gps_latitude && selectedShipment?.gps_longitude ? [{
      lat: selectedShipment.gps_latitude,
      lng: selectedShipment.gps_longitude,
      name: selectedShipment.to_location,
      status: 'warning' as const
    }] : [])
  ];

  if (!session || session.status === 'offline') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 to-secondary/10">
        <Card className="w-full max-w-md p-8 text-center space-y-6">
          <div className="flex justify-center">
            <Navigation className="h-20 w-20 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Driver App</h1>
          <p className="text-muted-foreground">Start your session to begin deliveries</p>
          <div className="space-y-2 text-left">
            <label className="text-sm font-medium">Phone Number</label>
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter your phone number"
              type="tel"
            />
          </div>
          <Button onClick={startSession} size="lg" className="w-full" disabled={!phoneNumber}>
            <MapPin className="mr-2 h-5 w-5" />
            Start Session & Enable GPS
          </Button>
        </Card>
      </div>
    );
  }

  if (showDeliveryForm && selectedShipment) {
    return (
      <div className="min-h-screen p-4 space-y-4">
        <Card className="p-4">
          <h2 className="text-xl font-bold mb-4">Confirm Delivery</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Shipment: {selectedShipment.id}
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Recipient Name *</label>
              <Input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Enter recipient name"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Recipient Phone</label>
              <Input
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="Enter phone number"
                type="tel"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Proof of Delivery Photo</label>
              {photoUrl ? (
                <img src={photoUrl} alt="Delivery proof" className="w-full h-48 object-cover rounded-lg mb-2" />
              ) : null}
              <Button onClick={takePhoto} variant="outline" className="w-full">
                <CameraIcon className="mr-2 h-4 w-4" />
                {photoUrl ? 'Retake Photo' : 'Take Photo'}
              </Button>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowDeliveryForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmDelivery}
                disabled={!recipientName}
                className="flex-1"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirm
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Navigation className="h-6 w-6" />
          <div>
            <h1 className="font-bold">LeafTrace Driver</h1>
            <Badge variant="secondary" className="mt-1">
              {session.status}
            </Badge>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={endSession}
          className="text-primary-foreground"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      {/* Map */}
      <div className="flex-1">
        <MapView locations={mapLocations} />
      </div>

      {/* Active Shipment Info */}
      {selectedShipment && (
        <Card className="m-4 p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Delivering to:</p>
              <p className="font-semibold">{selectedShipment.to_location}</p>
            </div>
            <Badge>{selectedShipment.status}</Badge>
          </div>

          {selectedShipment.eta && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>ETA: {new Date(selectedShipment.eta).toLocaleTimeString()}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button 
              onClick={() => setShowDeliveryForm(true)}
              className="w-full"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowChat(true)}
              className="w-full"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              AI Help
            </Button>
          </div>
        </Card>
      )}

      {!selectedShipment && shipments.length === 0 && (
        <Card className="m-4 p-8 text-center">
          <p className="text-muted-foreground">No active deliveries</p>
        </Card>
      )}
    </div>
  );
}
