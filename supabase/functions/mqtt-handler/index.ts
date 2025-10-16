import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      device_id,
      shipment_id,
      event_type, 
      event_data,
      gps_latitude,
      gps_longitude,
      temperature,
      battery_level,
      signal_strength
    } = await req.json();
    
    console.log('Received IoT event:', { device_id, event_type, shipment_id });

    // Validate required fields
    if (!device_id || !event_type || !event_data) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: device_id, event_type, event_data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify device exists
    const { data: device, error: deviceError } = await supabase
      .from('iot_devices')
      .select('*')
      .eq('id', device_id)
      .single();

    if (deviceError || !device) {
      console.error('Device not found:', device_id);
      return new Response(
        JSON.stringify({ error: 'Device not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update device status
    await supabase
      .from('iot_devices')
      .update({
        battery_level,
        signal_strength,
        last_ping: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', device_id);

    // Insert IoT event
    const { data: iotEvent, error: eventError } = await supabase
      .from('iot_events')
      .insert({
        device_id,
        shipment_id: shipment_id || device.shipment_id,
        event_type,
        event_data,
        gps_latitude,
        gps_longitude,
        temperature,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (eventError) {
      console.error('Event insertion error:', eventError);
      throw eventError;
    }

    // Process event based on type
    if (shipment_id || device.shipment_id) {
      const sid = shipment_id || device.shipment_id;
      
      switch (event_type) {
        case 'departure':
          await supabase
            .from('shipments')
            .update({
              status: 'in_transit',
              departure_time: new Date().toISOString(),
              gps_latitude,
              gps_longitude
            })
            .eq('id', sid);
          console.log(`Shipment ${sid} marked as departed`);
          break;

        case 'checkpoint':
          await supabase
            .from('shipments')
            .update({
              gps_latitude,
              gps_longitude,
              updated_at: new Date().toISOString()
            })
            .eq('id', sid);
          console.log(`Shipment ${sid} checkpoint updated`);
          break;

        case 'arrival':
          await supabase
            .from('shipments')
            .update({
              status: 'delivered',
              actual_arrival: new Date().toISOString(),
              gps_latitude,
              gps_longitude
            })
            .eq('id', sid);
          console.log(`Shipment ${sid} marked as delivered`);
          break;

        case 'gps_update':
          await supabase
            .from('shipments')
            .update({
              gps_latitude,
              gps_longitude,
              updated_at: new Date().toISOString()
            })
            .eq('id', sid);
          break;

        case 'temperature_alert':
          if (temperature) {
            await supabase
              .from('shipments')
              .update({
                temperature_min: Math.min(temperature, device.temperature_min || temperature),
                temperature_max: Math.max(temperature, device.temperature_max || temperature),
                updated_at: new Date().toISOString()
              })
              .eq('id', sid);
          }
          console.log(`Temperature alert for shipment ${sid}: ${temperature}°C`);
          break;

        case 'inspection':
          console.log(`Inspection event logged for shipment ${sid}`);
          break;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        event_id: iotEvent.id,
        message: `Event ${event_type} processed successfully`,
        device_id,
        timestamp: iotEvent.timestamp
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing IoT event:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
