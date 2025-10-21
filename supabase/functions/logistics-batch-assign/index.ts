import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ShipmentSchema = z.object({
  batch_id: z.string().min(1, 'Batch ID is required').max(50, 'Batch ID too long'),
  vehicle_id: z.string().min(1, 'Vehicle ID is required').max(50, 'Vehicle ID too long'),
  driver_name: z.string().min(2, 'Driver name must be at least 2 characters').max(100, 'Driver name too long'),
  from_location: z.string().min(3, 'From location must be at least 3 characters').max(200, 'From location too long'),
  to_location: z.string().min(3, 'To location must be at least 3 characters').max(200, 'To location too long'),
  departure_time: z.string().datetime().optional(),
  eta: z.string().datetime().optional()
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user role
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || !['logistics_manager', 'auditor', 'admin'].includes(userRole.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestBody = await req.json();
    const { batch_id, vehicle_id, driver_name, from_location, to_location, departure_time, eta } = ShipmentSchema.parse(requestBody);

    // Verify batch exists
    const { data: batch, error: batchError } = await supabase
      .from('procurement_batches')
      .select('id, status')
      .eq('id', batch_id)
      .single();

    if (batchError || !batch) {
      return new Response(
        JSON.stringify({ error: 'Batch not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create shipment ID
    const shipment_id = `SHIP-${Date.now()}`;

    // Create shipment record
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .insert({
        id: shipment_id,
        batch_id,
        vehicle_id,
        driver_name,
        from_location,
        to_location,
        departure_time: departure_time || new Date().toISOString(),
        eta: eta || new Date(Date.now() + 3600000 * 4).toISOString(), // Default 4 hours
        status: 'assigned'
      })
      .select()
      .single();

    if (shipmentError) {
      console.error('Shipment creation error:', shipmentError);
      return new Response(
        JSON.stringify({ error: 'Failed to create shipment', details: shipmentError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'vehicle_assignment',
      resource: 'shipment',
      resource_id: shipment_id,
      data_snapshot: {
        batch_id,
        vehicle_id,
        driver_name,
        from_location,
        to_location
      }
    });

    console.log(`Shipment ${shipment_id} assigned successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Vehicle assigned successfully',
        data: {
          shipment_id,
          batch_id,
          vehicle_id,
          driver_name,
          status: 'assigned',
          departure_time: shipment.departure_time,
          eta: shipment.eta
        }
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in logistics-batch-assign:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
