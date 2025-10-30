import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface SerializationRequest {
  action: 'verify_serial' | 'get_history' | 'register_serial' | 'update_status';
  serial_number?: string;
  batch_id?: string;
  status?: string;
  location?: string;
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

    if (!keyData.allowed_endpoints.includes('*') && !keyData.allowed_endpoints.includes('serialization')) {
      return new Response(
        JSON.stringify({ error: 'Endpoint not allowed' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, serial_number, batch_id, status, location }: SerializationRequest = await req.json();

    let response: any;

    switch (action) {
      case 'verify_serial':
        if (!serial_number) throw new Error('serial_number required');

        const { data: serialUnit, error: serialError } = await supabase
          .from('serialized_units')
          .select('*, procurement_batches(*)')
          .eq('serial_number', serial_number)
          .single();

        if (serialError) {
          response = { success: false, valid: false, message: 'Serial number not found' };
        } else {
          response = {
            success: true,
            valid: true,
            unit: serialUnit,
            status: serialUnit.status,
            location: serialUnit.current_location,
          };
        }
        break;

      case 'get_history':
        if (!serial_number) throw new Error('serial_number required');

        const { data: movements, error: movementsError } = await supabase
          .from('serial_movements')
          .select('*')
          .eq('serial_number', serial_number)
          .order('moved_at', { ascending: false });

        if (movementsError) throw movementsError;
        response = { success: true, movements };
        break;

      case 'register_serial':
        if (!serial_number || !batch_id) throw new Error('serial_number and batch_id required');

        const { data: newSerial, error: registerError } = await supabase
          .from('serialized_units')
          .insert({
            serial_number,
            batch_id,
            status: 'active',
            current_location: location || 'Warehouse',
            current_location_type: 'warehouse',
          })
          .select()
          .single();

        if (registerError) throw registerError;
        response = { success: true, unit: newSerial };
        break;

      case 'update_status':
        if (!serial_number || !status) throw new Error('serial_number and status required');

        const { error: updateError } = await supabase
          .from('serialized_units')
          .update({
            status,
            current_location: location,
            updated_at: new Date().toISOString(),
          })
          .eq('serial_number', serial_number);

        if (updateError) throw updateError;
        response = { success: true, message: 'Status updated' };
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
    console.error('Serialization API error:', error);
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
