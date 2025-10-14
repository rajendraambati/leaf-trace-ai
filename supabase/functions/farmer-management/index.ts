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
    const farmerId = url.searchParams.get('id');

    // GET - Retrieve farmer(s)
    if (req.method === 'GET') {
      if (farmerId) {
        const { data, error } = await supabaseClient
          .from('farmers')
          .select('*')
          .eq('id', farmerId)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          return new Response(
            JSON.stringify({ error: 'Farmer not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Retrieved farmer:', farmerId);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        const { data, error } = await supabaseClient
          .from('farmers')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        console.log(`Retrieved ${data?.length || 0} farmers`);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // POST - Create new farmer
    if (req.method === 'POST') {
      const body = await req.json();
      
      const { data, error } = await supabaseClient
        .from('farmers')
        .insert({
          name: body.name,
          email: body.email,
          phone: body.phone,
          location: body.location,
          farm_size_acres: body.farm_size_acres,
          geo_latitude: body.geo_latitude,
          geo_longitude: body.geo_longitude,
          user_id: body.user_id,
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Created farmer:', data.id);
      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PUT - Update farmer
    if (req.method === 'PUT') {
      if (!farmerId) {
        return new Response(
          JSON.stringify({ error: 'Farmer ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();
      
      const { data, error } = await supabaseClient
        .from('farmers')
        .update({
          name: body.name,
          email: body.email,
          phone: body.phone,
          location: body.location,
          farm_size_acres: body.farm_size_acres,
          geo_latitude: body.geo_latitude,
          geo_longitude: body.geo_longitude,
          status: body.status,
        })
        .eq('id', farmerId)
        .select()
        .single();

      if (error) throw error;

      console.log('Updated farmer:', farmerId);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE - Delete farmer
    if (req.method === 'DELETE') {
      if (!farmerId) {
        return new Response(
          JSON.stringify({ error: 'Farmer ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabaseClient
        .from('farmers')
        .delete()
        .eq('id', farmerId);

      if (error) throw error;

      console.log('Deleted farmer:', farmerId);
      return new Response(
        JSON.stringify({ message: 'Farmer deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in farmer-management:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
