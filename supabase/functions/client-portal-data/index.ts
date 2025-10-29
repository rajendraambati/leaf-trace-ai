import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Get user's client portal access
    const { data: accessData, error: accessError } = await supabase
      .from('client_portal_access')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (accessError || !accessData) {
      return new Response(
        JSON.stringify({ error: "No portal access found" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { client_type, client_id, allowed_modules } = accessData;
    const portalData: any = {
      access: accessData,
      orders: [],
      shipments: [],
      documents: [],
      invoices: [],
      notifications: []
    };

    // Fetch orders based on client type
    if (allowed_modules.includes('orders')) {
      if (client_type === 'processing_unit') {
        const { data: procOrders } = await supabase
          .from('erp_procurement_orders')
          .select('*')
          .eq('processing_unit_id', client_id)
          .order('created_at', { ascending: false })
          .limit(50);
        portalData.orders = procOrders || [];
      } else if (client_type === 'retailer') {
        const { data: retailOrders } = await supabase
          .from('retailer_orders')
          .select('*')
          .eq('retailer_id', client_id)
          .order('created_at', { ascending: false })
          .limit(50);
        portalData.orders = retailOrders || [];
      } else if (client_type === 'distributor') {
        const { data: custOrders } = await supabase
          .from('customer_orders')
          .select('*')
          .eq('customer_id', client_id)
          .order('created_at', { ascending: false })
          .limit(50);
        portalData.orders = custOrders || [];
      }
    }

    // Fetch shipments/tracking
    if (allowed_modules.includes('tracking')) {
      if (client_type === 'processing_unit') {
        const { data: shipments } = await supabase
          .from('shipments')
          .select('*')
          .eq('to_processing_unit_id', client_id)
          .order('departure_time', { ascending: false })
          .limit(50);
        portalData.shipments = shipments || [];
      } else if (client_type === 'warehouse') {
        const { data: warehouseShips } = await supabase
          .from('shipments')
          .select('*')
          .or(`from_warehouse_id.eq.${client_id},to_warehouse_id.eq.${client_id}`)
          .order('departure_time', { ascending: false })
          .limit(50);
        portalData.shipments = warehouseShips || [];
      }
    }

    // Fetch compliance documents
    if (allowed_modules.includes('documents')) {
      const { data: docs } = await supabase
        .from('compliance_documents')
        .select('*')
        .eq('entity_type', client_type)
        .eq('entity_id', client_id)
        .order('created_at', { ascending: false })
        .limit(50);
      portalData.documents = docs || [];
    }

    // Fetch invoices
    if (allowed_modules.includes('invoices')) {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_type', client_type)
        .eq('client_id', client_id)
        .order('invoice_date', { ascending: false })
        .limit(50);
      portalData.invoices = invoices || [];
    }

    // Fetch notifications
    const { data: notifications } = await supabase
      .from('client_notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('client_type', client_type)
      .eq('client_id', client_id)
      .order('created_at', { ascending: false })
      .limit(20);
    portalData.notifications = notifications || [];

    // Get summary stats
    portalData.stats = {
      total_orders: portalData.orders.length,
      pending_orders: portalData.orders.filter((o: any) => 
        o.status === 'pending' || o.validation_status === 'pending'
      ).length,
      active_shipments: portalData.shipments.filter((s: any) => 
        s.status === 'in-transit'
      ).length,
      pending_invoices: portalData.invoices.filter((i: any) => 
        i.payment_status === 'pending'
      ).length,
      unread_notifications: portalData.notifications.filter((n: any) => 
        !n.is_read
      ).length
    };

    return new Response(
      JSON.stringify(portalData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Client portal data error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
