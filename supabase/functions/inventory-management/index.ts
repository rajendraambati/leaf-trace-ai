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
    const inventoryId = url.searchParams.get('id');
    const warehouseId = url.searchParams.get('warehouse_id');
    const batchId = url.searchParams.get('batch_id');

    // GET - Retrieve inventory record(s)
    if (req.method === 'GET') {
      let query = supabaseClient
        .from('warehouse_inventory')
        .select('*, warehouses(name, location)');

      if (inventoryId) {
        query = query.eq('id', inventoryId);
        const { data, error } = await query.maybeSingle();
        
        if (error) throw error;
        if (!data) {
          return new Response(
            JSON.stringify({ error: 'Inventory record not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Retrieved inventory record:', inventoryId);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (warehouseId) {
        query = query.eq('warehouse_id', warehouseId);
      }

      if (batchId) {
        query = query.eq('batch_id', batchId);
      }

      query = query.order('entry_date', { ascending: false });
      const { data, error } = await query;

      if (error) throw error;

      console.log(`Retrieved ${data?.length || 0} inventory records`);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST - Add inventory (batch entry to warehouse)
    if (req.method === 'POST') {
      const body = await req.json();
      
      // Insert inventory record
      const { data: inventoryData, error: inventoryError } = await supabaseClient
        .from('warehouse_inventory')
        .insert({
          warehouse_id: body.warehouse_id,
          batch_id: body.batch_id,
          quantity_kg: body.quantity_kg,
          entry_date: body.entry_date || new Date().toISOString(),
        })
        .select()
        .single();

      if (inventoryError) throw inventoryError;

      // Update warehouse current stock
      const { data: warehouseData, error: warehouseError } = await supabaseClient
        .from('warehouses')
        .select('current_stock_kg')
        .eq('id', body.warehouse_id)
        .maybeSingle();

      if (warehouseError) throw warehouseError;

      const newStock = (warehouseData?.current_stock_kg || 0) + body.quantity_kg;

      const { error: updateError } = await supabaseClient
        .from('warehouses')
        .update({ current_stock_kg: newStock })
        .eq('id', body.warehouse_id);

      if (updateError) throw updateError;

      console.log('Added inventory:', inventoryData.id);
      return new Response(JSON.stringify(inventoryData), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PUT - Update inventory (exit/transfer)
    if (req.method === 'PUT') {
      if (!inventoryId) {
        return new Response(
          JSON.stringify({ error: 'Inventory ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();
      
      // Get current inventory record
      const { data: currentData, error: currentError } = await supabaseClient
        .from('warehouse_inventory')
        .select('*')
        .eq('id', inventoryId)
        .single();

      if (currentError) throw currentError;

      // Update inventory record
      const { data, error } = await supabaseClient
        .from('warehouse_inventory')
        .update({
          exit_date: body.exit_date,
          quantity_kg: body.quantity_kg,
        })
        .eq('id', inventoryId)
        .select()
        .single();

      if (error) throw error;

      // If exit date is set, reduce warehouse stock
      if (body.exit_date && !currentData.exit_date) {
        const { data: warehouseData, error: warehouseError } = await supabaseClient
          .from('warehouses')
          .select('current_stock_kg')
          .eq('id', currentData.warehouse_id)
          .single();

        if (warehouseError) throw warehouseError;

        const newStock = (warehouseData?.current_stock_kg || 0) - currentData.quantity_kg;

        await supabaseClient
          .from('warehouses')
          .update({ current_stock_kg: Math.max(0, newStock) })
          .eq('id', currentData.warehouse_id);
      }

      console.log('Updated inventory:', inventoryId);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE - Delete inventory record
    if (req.method === 'DELETE') {
      if (!inventoryId) {
        return new Response(
          JSON.stringify({ error: 'Inventory ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabaseClient
        .from('warehouse_inventory')
        .delete()
        .eq('id', inventoryId);

      if (error) throw error;

      console.log('Deleted inventory record:', inventoryId);
      return new Response(
        JSON.stringify({ message: 'Inventory record deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in inventory-management:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
