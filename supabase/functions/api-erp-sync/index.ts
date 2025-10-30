import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface ERPSyncRequest {
  action: 'push_order' | 'get_status' | 'update_status';
  data?: any;
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
    // API Key authentication
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing API key', message: 'Include X-API-Key header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate API key
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single();

    if (keyError || !keyData) {
      await logRequest(supabase, null, req, 401, Date.now() - startTime, 'Invalid API key');
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if endpoint is allowed
    if (!keyData.allowed_endpoints.includes('*') && !keyData.allowed_endpoints.includes('erp-sync')) {
      await logRequest(supabase, keyData.id, req, 403, Date.now() - startTime, 'Endpoint not allowed');
      return new Response(
        JSON.stringify({ error: 'Endpoint not allowed for this API key' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    if (keyData.usage_count >= keyData.rate_limit) {
      await logRequest(supabase, keyData.id, req, 429, Date.now() - startTime, 'Rate limit exceeded');
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded', limit: keyData.rate_limit }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, data }: ERPSyncRequest = await req.json();

    let response: any;

    switch (action) {
      case 'push_order':
        // Create ERP procurement order
        const { data: order, error: orderError } = await supabase
          .from('erp_procurement_orders')
          .insert({
            po_number: data.po_number,
            product_type: data.product_type,
            quantity_kg: data.quantity_kg,
            delivery_date: data.delivery_date,
            processing_unit_id: data.processing_unit_id,
            source_system: data.source_system || 'External ERP',
            validation_status: 'pending',
          })
          .select()
          .single();

        if (orderError) throw orderError;
        response = { success: true, order_id: order.id, status: 'pending_validation' };
        break;

      case 'get_status':
        const { data: orderStatus, error: statusError } = await supabase
          .from('erp_procurement_orders')
          .select('*, warehouse_dispatch_schedule(*), shipments(*)')
          .eq('po_number', data.po_number)
          .single();

        if (statusError) throw statusError;
        response = { success: true, order: orderStatus };
        break;

      case 'update_status':
        const { error: updateError } = await supabase
          .from('erp_procurement_orders')
          .update({ status: data.status })
          .eq('po_number', data.po_number);

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
    console.error('ERP Sync API error:', error);
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
