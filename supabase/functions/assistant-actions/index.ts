import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, params } = await req.json();
    console.log("Assistant action:", action, params);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let result;

    switch (action) {
      case 'get_order_details':
        const { data: order } = await supabase
          .from('erp_procurement_orders')
          .select('*, warehouse_dispatches(*)')
          .or(`id.eq.${params.orderId},order_number.ilike.%${params.orderId}%`)
          .single();
        result = { order };
        break;

      case 'get_vehicle_status':
        const { data: vehicle } = await supabase
          .from('vehicles')
          .select('*, vehicle_maintenance(*)')
          .eq('id', params.vehicleId)
          .single();
        result = { vehicle };
        break;

      case 'mark_shipment_in_transit':
        const { error: transitError } = await supabase
          .from('shipments')
          .update({ 
            status: 'in-transit',
            departure_time: new Date().toISOString()
          })
          .eq('id', params.shipmentId);
        
        if (transitError) throw transitError;
        result = { success: true, message: 'Shipment marked as in transit' };
        break;

      case 'confirm_delivery':
        const { error: deliveryError } = await supabase
          .from('shipments')
          .update({ 
            status: 'delivered',
            actual_arrival: new Date().toISOString()
          })
          .eq('id', params.shipmentId);
        
        if (deliveryError) throw deliveryError;
        result = { success: true, message: 'Delivery confirmed successfully' };
        break;

      case 'get_warehouse_stock':
        const { data: warehouses } = await supabase
          .from('warehouses')
          .select('*')
          .eq('id', params.warehouseId);
        result = { warehouses };
        break;

      case 'list_pending_documents':
        const { data: documents } = await supabase
          .from('generated_documents')
          .select('*')
          .eq('status', 'draft')
          .order('created_at', { ascending: false })
          .limit(10);
        result = { documents };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Assistant action error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Action failed'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
