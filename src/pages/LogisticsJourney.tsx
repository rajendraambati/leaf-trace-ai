import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { MapView, Location } from '@/components/MapView';
import StatusBadge from '@/components/StatusBadge';
import { toast } from 'sonner';
import { Scan, Truck, ClipboardCheck, Factory, Package } from 'lucide-react';

type JourneyStep = 'created' | 'pickup' | 'transit' | 'delivered' | 'inspected' | 'processing' | 'completed';

interface BatchJourney {
  batch_id: string;
  current_step: JourneyStep;
  pickup_timestamp?: string;
  transit_timestamp?: string;
  delivery_timestamp?: string;
  inspection_timestamp?: string;
  processing_timestamp?: string;
  completion_timestamp?: string;
  gps_location?: Location;
  shipment_id?: string;
}

export default function LogisticsJourney() {
  const { user, userRole } = useAuth();
  const { logAction } = useAuditLog();
  const [selectedBatch, setSelectedBatch] = useState('');
  const [batches, setBatches] = useState<any[]>([]);
  const [journey, setJourney] = useState<BatchJourney | null>(null);
  const [shipment, setShipment] = useState<any>(null);
  const [gpsLocation, setGpsLocation] = useState<Location | null>(null);
  const [inspectionNotes, setInspectionNotes] = useState('');

  useEffect(() => {
    fetchBatches();
    
    // Real-time subscription for shipments
    const channel = supabase
      .channel('shipments-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shipments' },
        (payload) => {
          console.log('Shipment update:', payload);
          if (payload.new && typeof payload.new === 'object' && 'id' in payload.new && journey?.shipment_id === payload.new.id) {
            setShipment(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [journey]);

  const fetchBatches = async () => {
    const { data, error } = await supabase
      .from('procurement_batches')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching batches:', error);
      return;
    }
    
    setBatches(data || []);
  };

  const handleBatchSelect = async (batchId: string) => {
    setSelectedBatch(batchId);
    
    // Check if shipment exists
    const { data: shipmentData } = await supabase
      .from('shipments')
      .select('*')
      .eq('batch_id', batchId)
      .maybeSingle();
    
    if (shipmentData) {
      setShipment(shipmentData);
      setJourney({
        batch_id: batchId,
        current_step: shipmentData.status === 'delivered' ? 'delivered' : 'transit',
        shipment_id: shipmentData.id,
        gps_location: shipmentData.gps_latitude && shipmentData.gps_longitude ? {
          lat: shipmentData.gps_latitude,
          lng: shipmentData.gps_longitude,
          name: `Shipment ${shipmentData.id}`,
          status: shipmentData.status
        } : undefined
      });
    } else {
      setJourney({
        batch_id: batchId,
        current_step: 'created'
      });
    }
  };

  const simulatePickup = async () => {
    if (!journey) return;
    
    // Get current GPS position
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          name: 'Pickup Location',
          status: 'pickup'
        };
        
        setGpsLocation(location);
        
        // Create shipment
        const shipmentId = `SHIP-${Date.now()}`;
        const { error } = await supabase.from('shipments').insert({
          id: shipmentId,
          batch_id: journey.batch_id,
          from_location: 'Farm',
          to_location: 'Processing Agency',
          status: 'pending',
          departure_time: new Date().toISOString(),
          gps_latitude: location.lat,
          gps_longitude: location.lng
        });
        
        if (error) {
          toast.error('Failed to create shipment');
          return;
        }
        
        await logAction({
          action: 'pickup',
          resource: 'shipment',
          resourceId: shipmentId,
          dataSnapshot: { batch_id: journey.batch_id, location, device: navigator.userAgent }
        });
        
        setJourney({
          ...journey,
          current_step: 'pickup',
          pickup_timestamp: new Date().toISOString(),
          shipment_id: shipmentId
        });
        
        toast.success('Batch picked up and shipment created!');
      },
      () => {
        toast.error('Failed to get GPS location');
      }
    );
  };

  const simulateTransit = async () => {
    if (!journey?.shipment_id) return;
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          name: 'In Transit',
          status: 'in_transit'
        };
        
        setGpsLocation(location);
        
        const { error } = await supabase
          .from('shipments')
          .update({
            status: 'in_transit',
            gps_latitude: location.lat,
            gps_longitude: location.lng
          })
          .eq('id', journey.shipment_id);
        
        if (error) {
          toast.error('Failed to update transit status');
          return;
        }
        
        await logAction({
          action: 'transit_update',
          resource: 'shipment',
          resourceId: journey.shipment_id,
          dataSnapshot: { location, device: navigator.userAgent }
        });
        
        setJourney({
          ...journey,
          current_step: 'transit',
          transit_timestamp: new Date().toISOString(),
          gps_location: location
        });
        
        toast.success('Shipment in transit!');
      },
      () => {
        toast.error('Failed to get GPS location');
      }
    );
  };

  const simulateDelivery = async () => {
    if (!journey?.shipment_id) return;
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          name: 'Delivery Location',
          status: 'delivered'
        };
        
        setGpsLocation(location);
        
        const { error } = await supabase
          .from('shipments')
          .update({
            status: 'delivered',
            actual_arrival: new Date().toISOString(),
            gps_latitude: location.lat,
            gps_longitude: location.lng
          })
          .eq('id', journey.shipment_id);
        
        if (error) {
          toast.error('Failed to mark as delivered');
          return;
        }
        
        await logAction({
          action: 'delivery',
          resource: 'shipment',
          resourceId: journey.shipment_id,
          dataSnapshot: { location, device: navigator.userAgent }
        });
        
        setJourney({
          ...journey,
          current_step: 'delivered',
          delivery_timestamp: new Date().toISOString()
        });
        
        toast.success('Batch delivered to agency!');
      },
      () => {
        toast.error('Failed to get GPS location');
      }
    );
  };

  const simulateInspection = async () => {
    if (!journey) return;
    
    const { error } = await supabase.from('batch_quality_tests').insert({
      batch_id: journey.batch_id,
      tested_by: user?.id,
      test_date: new Date().toISOString(),
      notes: inspectionNotes || 'Batch inspected and certified for processing'
    });
    
    if (error) {
      toast.error('Failed to record inspection');
      return;
    }
    
    await logAction({
      action: 'inspection',
      resource: 'batch',
      resourceId: journey.batch_id,
      dataSnapshot: { notes: inspectionNotes, device: navigator.userAgent }
    });
    
    setJourney({
      ...journey,
      current_step: 'inspected',
      inspection_timestamp: new Date().toISOString()
    });
    
    toast.success('Inspection completed and certified!');
  };

  const simulateProcessing = async () => {
    if (!journey) return;
    
    const { error } = await supabase.from('processing_batches').insert({
      batch_id: journey.batch_id,
      unit_id: 'UNIT-001',
      input_quantity_kg: 1000,
      start_time: new Date().toISOString()
    });
    
    if (error) {
      toast.error('Failed to start processing');
      return;
    }
    
    await logAction({
      action: 'processing_started',
      resource: 'batch',
      resourceId: journey.batch_id,
      dataSnapshot: { device: navigator.userAgent }
    });
    
    setJourney({
      ...journey,
      current_step: 'processing',
      processing_timestamp: new Date().toISOString()
    });
    
    toast.success('Batch processing started!');
  };

  const completeJourney = async () => {
    if (!journey) return;
    
    const { error } = await supabase
      .from('procurement_batches')
      .update({ status: 'completed' })
      .eq('id', journey.batch_id);
    
    if (error) {
      toast.error('Failed to complete journey');
      return;
    }
    
    await logAction({
      action: 'journey_completed',
      resource: 'batch',
      resourceId: journey.batch_id,
      dataSnapshot: { journey, device: navigator.userAgent }
    });
    
    setJourney({
      ...journey,
      current_step: 'completed',
      completion_timestamp: new Date().toISOString()
    });
    
    toast.success('Logistics journey completed!');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Logistics Journey Simulation</h1>
        <p className="text-muted-foreground">
          Track the complete journey of a tobacco batch from farm to manufacturer
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Batch</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="batch">Batch ID</Label>
              <select
                id="batch"
                className="w-full p-2 border rounded-md"
                value={selectedBatch}
                onChange={(e) => handleBatchSelect(e.target.value)}
              >
                <option value="">Select a batch</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.id} - {batch.grade} ({batch.quantity_kg}kg)
                  </option>
                ))}
              </select>
            </div>
            
            {selectedBatch && (
              <QRCodeDisplay
                data={JSON.stringify({ batchId: selectedBatch, type: 'tobacco_batch' })}
                title="Batch QR Code"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {journey && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Journey Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Package className="h-5 w-5" />
                  <div className="flex-1">
                    <p className="font-medium">Batch Created</p>
                    <p className="text-sm text-muted-foreground">Initial procurement</p>
                  </div>
                  <StatusBadge status="completed" />
                </div>

                <div className="flex items-center gap-4">
                  <Scan className="h-5 w-5" />
                  <div className="flex-1">
                    <p className="font-medium">Pickup & QR Scan</p>
                    {journey.pickup_timestamp && (
                      <p className="text-sm text-muted-foreground">
                        {new Date(journey.pickup_timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                  {journey.current_step === 'created' ? (
                    <Button onClick={simulatePickup} size="sm">
                      <Scan className="h-4 w-4 mr-2" />
                      Simulate Pickup
                    </Button>
                  ) : (
                    <StatusBadge status="completed" />
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <Truck className="h-5 w-5" />
                  <div className="flex-1">
                    <p className="font-medium">In Transit with GPS</p>
                    {journey.transit_timestamp && (
                      <p className="text-sm text-muted-foreground">
                        {new Date(journey.transit_timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                  {journey.current_step === 'pickup' ? (
                    <Button onClick={simulateTransit} size="sm">
                      <Truck className="h-4 w-4 mr-2" />
                      Start Transit
                    </Button>
                  ) : journey.current_step !== 'created' ? (
                    <StatusBadge status={journey.current_step === 'transit' ? 'in-transit' : 'completed'} />
                  ) : (
                    <StatusBadge status="pending" />
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <ClipboardCheck className="h-5 w-5" />
                  <div className="flex-1">
                    <p className="font-medium">Delivery to Agency</p>
                    {journey.delivery_timestamp && (
                      <p className="text-sm text-muted-foreground">
                        {new Date(journey.delivery_timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                  {journey.current_step === 'transit' ? (
                    <Button onClick={simulateDelivery} size="sm">
                      Complete Delivery
                    </Button>
                  ) : ['delivered', 'inspected', 'processing', 'completed'].includes(journey.current_step) ? (
                    <StatusBadge status="delivered" />
                  ) : (
                    <StatusBadge status="pending" />
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <ClipboardCheck className="h-5 w-5" />
                  <div className="flex-1">
                    <p className="font-medium">Inspection & Certification</p>
                    {journey.inspection_timestamp && (
                      <p className="text-sm text-muted-foreground">
                        {new Date(journey.inspection_timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                  {journey.current_step === 'delivered' ? (
                    <div className="flex flex-col gap-2">
                      <Input
                        placeholder="Inspection notes"
                        value={inspectionNotes}
                        onChange={(e) => setInspectionNotes(e.target.value)}
                      />
                      <Button onClick={simulateInspection} size="sm">
                        Complete Inspection
                      </Button>
                    </div>
                  ) : ['inspected', 'processing', 'completed'].includes(journey.current_step) ? (
                    <StatusBadge status="completed" />
                  ) : (
                    <StatusBadge status="pending" />
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <Factory className="h-5 w-5" />
                  <div className="flex-1">
                    <p className="font-medium">Manufacturer Processing</p>
                    {journey.processing_timestamp && (
                      <p className="text-sm text-muted-foreground">
                        {new Date(journey.processing_timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                  {journey.current_step === 'inspected' ? (
                    <Button onClick={simulateProcessing} size="sm">
                      <Factory className="h-4 w-4 mr-2" />
                      Start Processing
                    </Button>
                  ) : ['processing', 'completed'].includes(journey.current_step) ? (
                    <StatusBadge status="processing" />
                  ) : (
                    <StatusBadge status="pending" />
                  )}
                </div>

                {journey.current_step === 'processing' && (
                  <div className="pt-4">
                    <Button onClick={completeJourney} className="w-full">
                      Complete Journey
                    </Button>
                  </div>
                )}

                {journey.current_step === 'completed' && (
                  <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                    <p className="text-success font-medium">
                      ✓ Logistics journey completed successfully!
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Completed at: {journey.completion_timestamp && new Date(journey.completion_timestamp).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {gpsLocation && (
            <Card>
              <CardHeader>
                <CardTitle>GPS Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <MapView locations={[gpsLocation]} />
              </CardContent>
            </Card>
          )}

          {shipment && (
            <Card>
              <CardHeader>
                <CardTitle>Shipment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Shipment ID:</strong> {shipment.id}</p>
                  <p><strong>Status:</strong> <StatusBadge status={shipment.status} /></p>
                  <p><strong>From:</strong> {shipment.from_location}</p>
                  <p><strong>To:</strong> {shipment.to_location}</p>
                  {shipment.departure_time && (
                    <p><strong>Departure:</strong> {new Date(shipment.departure_time).toLocaleString()}</p>
                  )}
                  {shipment.actual_arrival && (
                    <p><strong>Arrival:</strong> {new Date(shipment.actual_arrival).toLocaleString()}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
