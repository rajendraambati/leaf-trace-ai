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
    const { userRole, pageContext } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const suggestions = [];

    // Dispatcher suggestions
    if (userRole === 'dispatcher') {
      // Check for vehicles needing maintenance
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id, registration_number, next_maintenance_date')
        .lte('next_maintenance_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(3);

      if (vehicles && vehicles.length > 0) {
        suggestions.push({
          type: 'warning',
          title: 'Maintenance Due Soon',
          message: `${vehicles.length} vehicle(s) need maintenance within 7 days`,
          query: 'Show me vehicles that need maintenance this week',
        });
      }

      // Check for delayed shipments
      const { data: delayedShipments } = await supabase
        .from('shipments')
        .select('id')
        .eq('status', 'in-transit')
        .lt('eta', new Date().toISOString())
        .limit(5);

      if (delayedShipments && delayedShipments.length > 0) {
        suggestions.push({
          type: 'alert',
          title: 'Delayed Shipments',
          message: `${delayedShipments.length} shipment(s) are running behind schedule`,
          query: 'Show me all delayed shipments',
        });
      }
    }

    // Warehouse suggestions
    if (userRole === 'warehouse_manager') {
      // Check for low stock
      const { data: warehouses } = await supabase
        .from('warehouses')
        .select('id, name, current_stock_kg, max_capacity_kg')
        .limit(100);

      const lowStockWarehouses = warehouses?.filter(w => 
        (w.current_stock_kg / w.max_capacity_kg) < 0.2
      ) || [];

      if (lowStockWarehouses.length > 0) {
        suggestions.push({
          type: 'warning',
          title: 'Low Stock Alert',
          message: `${lowStockWarehouses.length} warehouse(s) below 20% capacity`,
          query: 'Which warehouses have low stock?',
        });
      }
    }

    // Compliance suggestions
    if (userRole === 'compliance_officer') {
      // Check for pending reports
      const { data: pendingReports } = await supabase
        .from('regulatory_reports')
        .select('id')
        .eq('status', 'draft')
        .limit(10);

      if (pendingReports && pendingReports.length > 0) {
        suggestions.push({
          type: 'info',
          title: 'Pending Reports',
          message: `${pendingReports.length} report(s) need submission`,
          query: 'Show pending regulatory reports',
        });
      }
    }

    // Document manager suggestions
    if (userRole === 'document_manager') {
      // Check for pending documents
      const { data: pendingDocs } = await supabase
        .from('generated_documents')
        .select('id')
        .eq('status', 'draft')
        .limit(10);

      if (pendingDocs && pendingDocs.length > 0) {
        suggestions.push({
          type: 'info',
          title: 'Pending Documents',
          message: `${pendingDocs.length} document(s) awaiting review`,
          query: 'Show pending documents',
        });
      }
    }

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Proactive suggestions error:', error);
    return new Response(
      JSON.stringify({ suggestions: [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
