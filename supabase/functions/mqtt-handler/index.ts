import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// MQTT message types
interface GPSData {
  deviceId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

interface QRScanData {
  scannerId: string;
  qrCode: string;
  batchId?: string;
  timestamp: string;
}

interface WeighbridgeData {
  weighbridgeId: string;
  weight: number;
  unit: string;
  batchId?: string;
  vehicleId?: string;
  timestamp: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { topic, payload, deviceType } = await req.json();

    console.log(`MQTT message received on topic: ${topic}, deviceType: ${deviceType}`);

    let result;

    // Route based on device type
    switch (deviceType) {
      case 'gps':
        result = await handleGPSData(supabaseClient, payload as GPSData);
        break;
      
      case 'qr_scanner':
        result = await handleQRScanData(supabaseClient, payload as QRScanData);
        break;
      
      case 'weighbridge':
        result = await handleWeighbridgeData(supabaseClient, payload as WeighbridgeData);
        break;
      
      default:
        throw new Error(`Unknown device type: ${deviceType}`);
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in MQTT handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleGPSData(supabase: any, data: GPSData) {
  console.log('Processing GPS data:', data);

  // Update shipment location if device is associated with a shipment
  const { data: shipment, error: shipmentError } = await supabase
    .from('shipments')
    .select('id')
    .eq('vehicle_id', data.deviceId)
    .eq('status', 'in_transit')
    .maybeSingle();

  if (shipment) {
    const { error } = await supabase
      .from('shipments')
      .update({
        gps_latitude: data.latitude,
        gps_longitude: data.longitude,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shipment.id);

    if (error) throw error;

    console.log(`Updated shipment ${shipment.id} GPS location`);
    return { shipmentId: shipment.id, location: { lat: data.latitude, lng: data.longitude } };
  }

  // Store GPS tracking data (you may want to create a gps_tracking table)
  return { deviceId: data.deviceId, location: { lat: data.latitude, lng: data.longitude } };
}

async function handleQRScanData(supabase: any, data: QRScanData) {
  console.log('Processing QR scan data:', data);

  // Parse QR code to extract batch information
  const qrData = data.qrCode;
  
  // Try to find the batch
  const { data: batch, error: batchError } = await supabase
    .from('procurement_batches')
    .select('*')
    .eq('qr_code', qrData)
    .maybeSingle();

  if (batch) {
    // Log the scan event (you may want to create a scan_logs table)
    console.log(`QR code scanned for batch: ${batch.id}`);
    
    return {
      batchId: batch.id,
      farmerId: batch.farmer_id,
      quantity: batch.quantity_kg,
      grade: batch.grade,
    };
  }

  // QR code not found in system
  return {
    scannerId: data.scannerId,
    qrCode: qrData,
    status: 'unknown',
  };
}

async function handleWeighbridgeData(supabase: any, data: WeighbridgeData) {
  console.log('Processing weighbridge data:', data);

  // If batch ID is provided, update the batch quantity
  if (data.batchId) {
    const { data: batch, error } = await supabase
      .from('procurement_batches')
      .update({
        quantity_kg: data.weight,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.batchId)
      .select()
      .single();

    if (error) throw error;

    console.log(`Updated batch ${data.batchId} weight: ${data.weight}kg`);
    
    // Recalculate total price
    if (batch && batch.price_per_kg) {
      const totalPrice = data.weight * batch.price_per_kg;
      
      await supabase
        .from('procurement_batches')
        .update({ total_price: totalPrice })
        .eq('id', data.batchId);
    }

    return {
      batchId: data.batchId,
      weight: data.weight,
      unit: data.unit,
    };
  }

  // Store standalone weighbridge reading
  return {
    weighbridgeId: data.weighbridgeId,
    weight: data.weight,
    unit: data.unit,
    vehicleId: data.vehicleId,
  };
}
