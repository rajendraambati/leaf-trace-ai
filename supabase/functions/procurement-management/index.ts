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
    const batchId = url.searchParams.get('id');
    const farmerId = url.searchParams.get('farmer_id');

    // GET - Retrieve procurement batch(es)
    if (req.method === 'GET') {
      let query = supabaseClient
        .from('procurement_batches')
        .select('*, farmers(name, location)');

      if (batchId) {
        query = query.eq('id', batchId);
        const { data, error } = await query.maybeSingle();
        
        if (error) throw error;
        if (!data) {
          return new Response(
            JSON.stringify({ error: 'Batch not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Retrieved batch:', batchId);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (farmerId) {
        query = query.eq('farmer_id', farmerId);
      }

      query = query.order('procurement_date', { ascending: false });
      const { data, error } = await query;

      if (error) throw error;

      console.log(`Retrieved ${data?.length || 0} procurement batches`);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST - Create new procurement batch
    if (req.method === 'POST') {
      const body = await req.json();
      
      // Generate batch ID
      const batchIdGen = `BATCH-${Date.now()}`;
      
      const { data, error } = await supabaseClient
        .from('procurement_batches')
        .insert({
          id: batchIdGen,
          farmer_id: body.farmer_id,
          quantity_kg: body.quantity_kg,
          grade: body.grade,
          price_per_kg: body.price_per_kg,
          total_price: body.quantity_kg * body.price_per_kg,
          status: body.status || 'pending',
          qr_code: body.qr_code,
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Created procurement batch:', data.id);
      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PUT - Update procurement batch
    if (req.method === 'PUT') {
      if (!batchId) {
        return new Response(
          JSON.stringify({ error: 'Batch ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();
      
      const updateData: any = {
        status: body.status,
        grade: body.grade,
      };

      if (body.quantity_kg && body.price_per_kg) {
        updateData.quantity_kg = body.quantity_kg;
        updateData.price_per_kg = body.price_per_kg;
        updateData.total_price = body.quantity_kg * body.price_per_kg;
      }

      const { data, error } = await supabaseClient
        .from('procurement_batches')
        .update(updateData)
        .eq('id', batchId)
        .select()
        .single();

      if (error) throw error;

      console.log('Updated procurement batch:', batchId);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE - Delete procurement batch
    if (req.method === 'DELETE') {
      if (!batchId) {
        return new Response(
          JSON.stringify({ error: 'Batch ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabaseClient
        .from('procurement_batches')
        .delete()
        .eq('id', batchId);

      if (error) throw error;

      console.log('Deleted procurement batch:', batchId);
      return new Response(
        JSON.stringify({ message: 'Batch deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in procurement-management:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
