import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ERPCallbackPayload {
  po_number: string;
  status: 'accepted' | 'rejected' | 'dispatched' | 'delivered';
  batch_id?: string;
  shipment_id?: string;
  dispatch_date?: string;
  delivery_date?: string;
  rejection_reason?: string;
  warehouse_id?: string;
  confirmed_quantity_kg?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: ERPCallbackPayload = await req.json();
    console.log('Sending callback to ERP system:', payload);

    // Get the ERP order to find the source system
    const { data: erpOrder, error: orderError } = await supabase
      .from('erp_procurement_orders')
      .select('source_system, po_number')
      .eq('po_number', payload.po_number)
      .single();

    if (orderError || !erpOrder) {
      console.error('ERP order not found:', orderError);
      return new Response(
        JSON.stringify({ success: false, error: 'ERP order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // In a real implementation, you would send this to the actual ERP system
    // For now, we'll log it and return success
    const callbackData = {
      source_system: erpOrder.source_system,
      po_number: payload.po_number,
      status: payload.status,
      batch_id: payload.batch_id,
      shipment_id: payload.shipment_id,
      dispatch_date: payload.dispatch_date,
      delivery_date: payload.delivery_date,
      rejection_reason: payload.rejection_reason,
      warehouse_id: payload.warehouse_id,
      confirmed_quantity_kg: payload.confirmed_quantity_kg,
      timestamp: new Date().toISOString(),
    };

    console.log('ERP callback data prepared:', callbackData);

    // TODO: Replace with actual ERP system webhook/API call
    // const erpResponse = await fetch(`${erpSystemUrl}/api/purchase-orders/callback`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${erpApiKey}` },
    //   body: JSON.stringify(callbackData),
    // });

    // For demonstration, we'll store the callback attempt in a log
    const { error: logError } = await supabase.from('audit_logs').insert({
      action: 'ERP_CALLBACK',
      resource: 'erp_procurement_orders',
      resource_id: payload.po_number,
      data_snapshot: callbackData,
      status: 'success',
    });

    if (logError) {
      console.error('Error logging ERP callback:', logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'ERP callback sent successfully',
        callback_data: callbackData,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ERP callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: errorMessage,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
