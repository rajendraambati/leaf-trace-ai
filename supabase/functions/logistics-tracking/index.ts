import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const url = new URL(req.url);
    const shipmentId = url.searchParams.get('id');
    const batchId = url.searchParams.get('batch_id');
    const status = url.searchParams.get('status');

    // GET - Retrieve shipment(s)
    if (req.method === 'GET') {
      let query = supabaseClient.from('shipments').select('*');

      if (shipmentId) {
        query = query.eq('id', shipmentId);
        const { data, error } = await query.maybeSingle();
        
        if (error) throw error;
        if (!data) {
          return new Response(
            JSON.stringify({ error: 'Shipment not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Retrieved shipment:', shipmentId);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (batchId) {
        query = query.eq('batch_id', batchId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      query = query.order('departure_time', { ascending: false });
      const { data, error } = await query;

      if (error) throw error;

      console.log(`Retrieved ${data?.length || 0} shipments`);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST - Create new shipment
    if (req.method === 'POST') {
      const body = await req.json();
      
      const shipmentIdGen = `SHIP-${Date.now()}`;
      
      const { data, error } = await supabaseClient
        .from('shipments')
        .insert({
          id: shipmentIdGen,
          batch_id: body.batch_id,
          from_location: body.from_location,
          to_location: body.to_location,
          vehicle_id: body.vehicle_id,
          driver_name: body.driver_name,
          departure_time: body.departure_time,
          eta: body.eta,
          status: body.status || 'pending',
          gps_latitude: body.gps_latitude,
          gps_longitude: body.gps_longitude,
          temperature_min: body.temperature_min,
          temperature_max: body.temperature_max,
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Created shipment:', data.id);
      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PUT - Update shipment (tracking updates)
    if (req.method === 'PUT') {
      if (!shipmentId) {
        return new Response(
          JSON.stringify({ error: 'Shipment ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();
      
      const updateData: any = {};
      
      if (body.status) updateData.status = body.status;
      if (body.gps_latitude) updateData.gps_latitude = body.gps_latitude;
      if (body.gps_longitude) updateData.gps_longitude = body.gps_longitude;
      if (body.temperature_min !== undefined) updateData.temperature_min = body.temperature_min;
      if (body.temperature_max !== undefined) updateData.temperature_max = body.temperature_max;
      if (body.eta) updateData.eta = body.eta;
      if (body.actual_arrival) updateData.actual_arrival = body.actual_arrival;

      const { data, error } = await supabaseClient
        .from('shipments')
        .update(updateData)
        .eq('id', shipmentId)
        .select()
        .single();

      if (error) throw error;

      console.log('Updated shipment:', shipmentId);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE - Delete shipment
    if (req.method === 'DELETE') {
      if (!shipmentId) {
        return new Response(
          JSON.stringify({ error: 'Shipment ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabaseClient
        .from('shipments')
        .delete()
        .eq('id', shipmentId);

      if (error) throw error;

      console.log('Deleted shipment:', shipmentId);
      return new Response(
        JSON.stringify({ message: 'Shipment deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in logistics-tracking:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
