import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Checking for delivery status updates...');

    // Get all shipments that have been delivered but haven't been reported back to ERP
    const { data: deliveredShipments, error: shipmentsError } = await supabase
      .from('shipments')
      .select(`
        id,
        batch_id,
        status,
        actual_arrival,
        to_processing_unit_id,
        procurement_batches!inner(id)
      `)
      .eq('status', 'delivered')
      .not('actual_arrival', 'is', null);

    if (shipmentsError) {
      console.error('Error fetching shipments:', shipmentsError);
      throw shipmentsError;
    }

    console.log(`Found ${deliveredShipments?.length || 0} delivered shipments`);

    const updates = [];

    for (const shipment of deliveredShipments || []) {
      // Find the ERP order associated with this batch
      const { data: erpOrder, error: orderError } = await supabase
        .from('erp_procurement_orders')
        .select('po_number, validation_status')
        .eq('validation_status', 'dispatched')
        .limit(1)
        .single();

      if (orderError || !erpOrder) {
        console.log(`No matching ERP order found for shipment ${shipment.id}`);
        continue;
      }

      // Send delivery status to ERP
      const { error: callbackError } = await supabase.functions.invoke('erp-callback', {
        body: {
          po_number: erpOrder.po_number,
          status: 'delivered',
          batch_id: shipment.batch_id,
          shipment_id: shipment.id,
          delivery_date: shipment.actual_arrival,
        },
      });

      if (callbackError) {
        console.error('Error sending callback:', callbackError);
        continue;
      }

      updates.push({
        po_number: erpOrder.po_number,
        shipment_id: shipment.id,
        status: 'delivered',
      });
    }

    console.log(`Sent ${updates.length} delivery status updates to ERP`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${updates.length} delivery status updates`,
        updates,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in delivery status update:', error);
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
