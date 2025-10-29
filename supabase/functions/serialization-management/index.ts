import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { method } = req;
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // Generate serial numbers for a batch
    if (action === 'generate' && method === 'POST') {
      const { batchId, unitType, count, productCode } = await req.json();
      
      const serialNumbers: any[] = [];
      const timestamp = Date.now();
      
      for (let i = 0; i < count; i++) {
        const serial = `${unitType.toUpperCase()}-${batchId}-${timestamp}-${String(i + 1).padStart(6, '0')}`;
        serialNumbers.push({
          serial_number: serial,
          unit_type: unitType,
          batch_id: batchId,
          product_code: productCode,
          manufacturing_date: new Date().toISOString(),
          status: 'active',
          current_location: 'manufacturing',
          current_location_type: 'processing_unit'
        });
      }

      const { data, error } = await supabase
        .from('serialized_units')
        .insert(serialNumbers)
        .select();

      if (error) throw error;

      // Update batch serialization info
      await supabase
        .from('procurement_batches')
        .update({
          serialization_enabled: true,
          serialization_completed_at: new Date().toISOString(),
          total_units_serialized: count
        })
        .eq('id', batchId);

      return new Response(JSON.stringify({ success: true, units: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Aggregate units (e.g., packs into carton)
    if (action === 'aggregate' && method === 'POST') {
      const { parentSerial, childSerials, aggregatedBy } = await req.json();

      const relationships = childSerials.map((childSerial: string) => ({
        parent_serial: parentSerial,
        child_serial: childSerial,
        aggregated_by: aggregatedBy,
        status: 'active'
      }));

      const { error: relError } = await supabase
        .from('aggregation_relationships')
        .insert(relationships);

      if (relError) throw relError;

      // Update child units status
      const { error: updateError } = await supabase
        .from('serialized_units')
        .update({ 
          status: 'aggregated',
          parent_serial: parentSerial
        })
        .in('serial_number', childSerials);

      if (updateError) throw updateError;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Disaggregate units
    if (action === 'disaggregate' && method === 'POST') {
      const { parentSerial, disaggregatedBy } = await req.json();

      // Get all child relationships
      const { data: relationships } = await supabase
        .from('aggregation_relationships')
        .select('child_serial')
        .eq('parent_serial', parentSerial)
        .eq('status', 'active');

      if (!relationships) throw new Error('No active aggregations found');

      const childSerials = relationships.map(r => r.child_serial);

      // Update relationships
      await supabase
        .from('aggregation_relationships')
        .update({
          status: 'disaggregated',
          disaggregation_date: new Date().toISOString(),
          disaggregated_by: disaggregatedBy
        })
        .eq('parent_serial', parentSerial)
        .eq('status', 'active');

      // Update child units
      await supabase
        .from('serialized_units')
        .update({ 
          status: 'active',
          parent_serial: null
        })
        .in('serial_number', childSerials);

      return new Response(JSON.stringify({ success: true, childSerials }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Track movement
    if (action === 'move' && method === 'POST') {
      const { serialNumbers, toLocation, toLocationType, shipmentId, warehouseId, userId, notes } = await req.json();

      // Update units location
      const { error: updateError } = await supabase
        .from('serialized_units')
        .update({
          current_location: toLocation,
          current_location_type: toLocationType,
          current_shipment_id: shipmentId,
          current_warehouse_id: warehouseId
        })
        .in('serial_number', serialNumbers);

      if (updateError) throw updateError;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Rework action
    if (action === 'rework' && method === 'POST') {
      const { serialNumber, reworkType, reason, performedBy, notes } = await req.json();

      // Get current unit data
      const { data: unit } = await supabase
        .from('serialized_units')
        .select('*')
        .eq('serial_number', serialNumber)
        .single();

      if (!unit) throw new Error('Unit not found');

      // Log rework action
      await supabase
        .from('rework_actions')
        .insert({
          serial_number: serialNumber,
          rework_type: reworkType,
          reason,
          original_status: unit.status,
          new_status: 'reworked',
          performed_by: performedBy,
          notes,
          before_metadata: unit.metadata
        });

      // Update unit status
      await supabase
        .from('serialized_units')
        .update({ status: 'reworked' })
        .eq('serial_number', serialNumber);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Query serial history
    if (action === 'history' && method === 'GET') {
      const serialNumber = url.searchParams.get('serial');

      const { data: movements } = await supabase
        .from('serial_movements')
        .select('*')
        .eq('serial_number', serialNumber)
        .order('timestamp', { ascending: false });

      const { data: unit } = await supabase
        .from('serialized_units')
        .select('*')
        .eq('serial_number', serialNumber)
        .single();

      const { data: aggregations } = await supabase
        .from('aggregation_relationships')
        .select('*')
        .or(`parent_serial.eq.${serialNumber},child_serial.eq.${serialNumber}`);

      const { data: reworks } = await supabase
        .from('rework_actions')
        .select('*')
        .eq('serial_number', serialNumber);

      return new Response(JSON.stringify({
        unit,
        movements,
        aggregations,
        reworks
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Serialization management error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});