import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { WellnessCheck } from './WellnessCheck';

interface Batch {
  id: string;
  farmer_id: string;
  farmer_name: string;
  quantity_kg: number;
  grade: string;
  gps_latitude: number | null;
  gps_longitude: number | null;
  status: string;
}

interface TripStartFlowProps {
  currentLocation: { lat: number; lng: number } | null;
  vehicleId: string | null;
  onTripStarted: (shipmentId: string) => void;
}

export function TripStartFlow({ currentLocation, vehicleId, onTripStarted }: TripStartFlowProps) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [showWellnessCheck, setShowWellnessCheck] = useState(false);
  const [eta, setEta] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAvailableBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch && currentLocation) {
      calculateETA();
    }
  }, [selectedBatch, currentLocation]);

  const fetchAvailableBatches = async () => {
    const { data, error } = await supabase
      .from('procurement_batches')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching batches:', error);
      toast.error('Failed to load batches');
    } else {
      setBatches(data || []);
    }
  };

  const calculateETA = () => {
    if (!selectedBatch || !currentLocation) return;

    const distance = selectedBatch.gps_latitude && selectedBatch.gps_longitude
      ? getDistance(
          currentLocation.lat,
          currentLocation.lng,
          selectedBatch.gps_latitude,
          selectedBatch.gps_longitude
        )
      : 0;

    const avgSpeed = 40; // km/h
    const hours = distance / avgSpeed;
    const minutes = Math.round(hours * 60);

    const etaTime = new Date();
    etaTime.setMinutes(etaTime.getMinutes() + minutes);
    setEta(etaTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleWellnessComplete = async (wellnessData: any) => {
    if (!selectedBatch || !vehicleId) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      // Create shipment
      const shipmentId = `SHP-${Date.now()}`;
      const { error: shipmentError } = await supabase
        .from('shipments')
        .insert({
          id: shipmentId,
          batch_id: selectedBatch.id,
          vehicle_id: vehicleId,
          from_location: `Farm ${selectedBatch.farmer_name}`,
          to_location: 'Warehouse',
          status: 'in-transit',
          departure_time: new Date().toISOString(),
          eta: eta ? new Date(new Date().toDateString() + ' ' + eta).toISOString() : null,
          gps_latitude: currentLocation?.lat,
          gps_longitude: currentLocation?.lng
        });

      if (shipmentError) throw shipmentError;

      // Log wellness check
      const { error: wellnessError } = await supabase
        .from('driver_wellbeing_logs')
        .insert({
          driver_id: user.id,
          vehicle_id: vehicleId,
          shipment_id: shipmentId,
          ...wellnessData,
          driving_hours: 0
        });

      if (wellnessError) throw wellnessError;

      // Update batch status
      await supabase
        .from('procurement_batches')
        .update({ status: 'in-transit' })
        .eq('id', selectedBatch.id);

      toast.success('Trip started successfully!');
      onTripStarted(shipmentId);
    } catch (error) {
      console.error('Error starting trip:', error);
      toast.error('Failed to start trip');
    } finally {
      setLoading(false);
    }
  };

  if (showWellnessCheck && selectedBatch) {
    return (
      <WellnessCheck
        onComplete={handleWellnessComplete}
        onCancel={() => setShowWellnessCheck(false)}
        loading={loading}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h2 className="text-xl font-bold mb-4">Select Batch for Pickup</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Choose a batch to start your trip
        </p>

        {batches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No batches available for pickup</p>
          </div>
        ) : (
          <div className="space-y-3">
            {batches.map((batch) => (
              <Card
                key={batch.id}
                className={`p-4 cursor-pointer transition-all ${
                  selectedBatch?.id === batch.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedBatch(batch)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">{batch.id}</p>
                    <p className="text-sm text-muted-foreground">
                      Farm: {batch.farmer_name}
                    </p>
                  </div>
                  <Badge variant="secondary">{batch.grade}</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {batch.quantity_kg} kg
                  </span>
                  {selectedBatch?.id === batch.id && (
                    <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {selectedBatch && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Trip Details</h3>
            <Badge>{selectedBatch.status}</Badge>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>Pickup: Farm {selectedBatch.farmer_name}</span>
            </div>
            {eta && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>ETA: {eta}</span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-3">
              📍 Your GPS location will be recorded at trip start
            </p>
            <Button
              className="w-full"
              onClick={() => setShowWellnessCheck(true)}
              disabled={!currentLocation}
            >
              <Navigation className="mr-2 h-4 w-4" />
              Start Trip & Wellness Check
            </Button>
          </div>

          <div className="bg-primary/10 p-3 rounded-lg">
            <p className="text-sm font-medium mb-1">Next Step:</p>
            <p className="text-sm text-muted-foreground">
              Complete wellness check, then navigate to {selectedBatch.farmer_name}'s farm for batch pickup
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
