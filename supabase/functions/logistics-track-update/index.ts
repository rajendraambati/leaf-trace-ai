import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      shipment_id,
      gps_latitude,
      gps_longitude,
      temperature_min,
      temperature_max,
      status,
      delivery_timestamp,
      device_id,
      battery_level,
      signal_strength
    } = await req.json();

    // Validate required fields
    if (!shipment_id) {
      return new Response(
        JSON.stringify({ error: 'shipment_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify shipment exists
    const { data: existingShipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', shipment_id)
      .single();

    if (shipmentError || !existingShipment) {
      return new Response(
        JSON.stringify({ error: 'Shipment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (gps_latitude !== undefined) updateData.gps_latitude = gps_latitude;
    if (gps_longitude !== undefined) updateData.gps_longitude = gps_longitude;
    if (temperature_min !== undefined) updateData.temperature_min = temperature_min;
    if (temperature_max !== undefined) updateData.temperature_max = temperature_max;
    if (status) updateData.status = status;
    if (delivery_timestamp && status === 'delivered') {
      updateData.actual_arrival = delivery_timestamp;
    }

    // Update shipment
    const { data: updatedShipment, error: updateError } = await supabase
      .from('shipments')
      .update(updateData)
      .eq('id', shipment_id)
      .select()
      .single();

    if (updateError) {
      console.error('Shipment update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update shipment', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'tracking_update',
      resource: 'shipment',
      resource_id: shipment_id,
      data_snapshot: {
        gps_latitude,
        gps_longitude,
        temperature_min,
        temperature_max,
        status,
        device_id,
        battery_level,
        signal_strength,
        timestamp: new Date().toISOString()
      }
    });

    console.log(`Shipment ${shipment_id} tracking updated at ${new Date().toISOString()}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Tracking data updated successfully',
        data: {
          shipment_id,
          status: updatedShipment.status,
          gps_location: gps_latitude && gps_longitude ? {
            latitude: gps_latitude,
            longitude: gps_longitude
          } : null,
          temperature: temperature_min && temperature_max ? {
            min: temperature_min,
            max: temperature_max
          } : null,
          updated_at: updatedShipment.updated_at
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in logistics-track-update:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
