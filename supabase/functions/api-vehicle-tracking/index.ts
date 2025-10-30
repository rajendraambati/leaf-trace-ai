import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface VehicleTrackingRequest {
  action: 'get_location' | 'list_vehicles' | 'update_location' | 'get_route';
  vehicle_id?: string;
  latitude?: number;
  longitude?: number;
  shipment_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single();

    if (keyError || !keyData) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!keyData.allowed_endpoints.includes('*') && !keyData.allowed_endpoints.includes('vehicle-tracking')) {
      return new Response(
        JSON.stringify({ error: 'Endpoint not allowed' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, vehicle_id, latitude, longitude, shipment_id }: VehicleTrackingRequest = await req.json();

    let response: any;

    switch (action) {
      case 'list_vehicles':
        const { data: vehicles, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('status', 'active');

        if (vehiclesError) throw vehiclesError;
        response = { success: true, vehicles };
        break;

      case 'get_location':
        if (!vehicle_id) throw new Error('vehicle_id required');
        
        const { data: vehicle, error: vehicleError } = await supabase
          .from('vehicles')
          .select('*, shipments!shipments_vehicle_id_fkey(*)')
          .eq('id', vehicle_id)
          .single();

        if (vehicleError) throw vehicleError;
        response = { success: true, vehicle };
        break;

      case 'update_location':
        if (!shipment_id || latitude === undefined || longitude === undefined) {
          throw new Error('shipment_id, latitude, and longitude required');
        }

        const { error: updateError } = await supabase
          .from('shipments')
          .update({
            gps_latitude: latitude,
            gps_longitude: longitude,
            updated_at: new Date().toISOString(),
          })
          .eq('id', shipment_id);

        if (updateError) throw updateError;
        response = { success: true, message: 'Location updated' };
        break;

      case 'get_route':
        if (!shipment_id) throw new Error('shipment_id required');

        const { data: shipment, error: shipmentError } = await supabase
          .from('shipments')
          .select('*')
          .eq('id', shipment_id)
          .single();

        if (shipmentError) throw shipmentError;
        response = {
          success: true,
          shipment,
          current_location: {
            latitude: shipment.gps_latitude,
            longitude: shipment.gps_longitude,
          },
        };
        break;

      default:
        throw new Error('Invalid action');
    }

    await logRequest(supabase, keyData.id, req, 200, Date.now() - startTime);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Vehicle Tracking API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function logRequest(
  supabase: any,
  apiKeyId: string | null,
  req: Request,
  status: number,
  responseTime: number,
  errorMessage?: string
) {
  try {
    const url = new URL(req.url);
    await supabase.from('api_request_logs').insert({
      api_key_id: apiKeyId,
      endpoint: url.pathname,
      method: req.method,
      response_status: status,
      response_time_ms: responseTime,
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent'),
      error_message: errorMessage,
    });
  } catch (error) {
    console.error('Failed to log request:', error);
  }
}
