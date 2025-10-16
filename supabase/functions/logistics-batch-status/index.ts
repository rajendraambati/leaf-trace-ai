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

    // Get batch_id from URL query parameters
    const url = new URL(req.url);
    const batch_id = url.searchParams.get('batch_id');
    const shipment_id = url.searchParams.get('shipment_id');

    if (!batch_id && !shipment_id) {
      return new Response(
        JSON.stringify({ error: 'Either batch_id or shipment_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let shipmentQuery = supabase
      .from('shipments')
      .select('*');

    if (batch_id) {
      shipmentQuery = shipmentQuery.eq('batch_id', batch_id);
    } else if (shipment_id) {
      shipmentQuery = shipmentQuery.eq('id', shipment_id);
    }

    const { data: shipments, error: shipmentError } = await shipmentQuery;

    if (shipmentError) {
      console.error('Shipment query error:', shipmentError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch shipment data', details: shipmentError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!shipments || shipments.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No shipments found',
          data: []
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get batch information if batch_id is provided
    let batchInfo = null;
    if (batch_id) {
      const { data: batch } = await supabase
        .from('procurement_batches')
        .select('id, farmer_id, quantity_kg, grade, status, procurement_date')
        .eq('id', batch_id)
        .single();
      
      batchInfo = batch;
    }

    // Get quality tests if available
    const shipmentIds = shipments.map(s => s.batch_id);
    const { data: qualityTests } = await supabase
      .from('batch_quality_tests')
      .select('batch_id, ai_grade, moisture_content, nicotine_level, test_date')
      .in('batch_id', shipmentIds);

    // Format response
    const formattedShipments = shipments.map(shipment => {
      const qualityTest = qualityTests?.find(qt => qt.batch_id === shipment.batch_id);
      
      return {
        shipment_id: shipment.id,
        batch_id: shipment.batch_id,
        vehicle_id: shipment.vehicle_id,
        driver_name: shipment.driver_name,
        status: shipment.status,
        route: {
          from: shipment.from_location,
          to: shipment.to_location
        },
        gps_location: shipment.gps_latitude && shipment.gps_longitude ? {
          latitude: shipment.gps_latitude,
          longitude: shipment.gps_longitude
        } : null,
        temperature: shipment.temperature_min && shipment.temperature_max ? {
          min: shipment.temperature_min,
          max: shipment.temperature_max
        } : null,
        timeline: {
          departure: shipment.departure_time,
          eta: shipment.eta,
          actual_arrival: shipment.actual_arrival,
          created_at: shipment.created_at,
          updated_at: shipment.updated_at
        },
        quality_data: qualityTest ? {
          grade: qualityTest.ai_grade,
          moisture_content: qualityTest.moisture_content,
          nicotine_level: qualityTest.nicotine_level,
          test_date: qualityTest.test_date
        } : null
      };
    });

    console.log(`Status retrieved for ${batch_id ? `batch ${batch_id}` : `shipment ${shipment_id}`}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Shipment status retrieved successfully',
        data: {
          batch: batchInfo,
          shipments: formattedShipments,
          total_shipments: formattedShipments.length
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in logistics-batch-status:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
