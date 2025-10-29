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

    const { syncType, serialNumbers, initiatedBy } = await req.json();

    // Create sync log
    const { data: syncLog, error: logError } = await supabase
      .from('compliance_sync_logs')
      .insert({
        sync_type: syncType,
        sync_direction: 'upload',
        serial_numbers: serialNumbers,
        status: 'in_progress',
        initiated_by: initiatedBy
      })
      .select()
      .single();

    if (logError) throw logError;

    try {
      // Get unit data
      const { data: units } = await supabase
        .from('serialized_units')
        .select(`
          *,
          serial_movements(*)
        `)
        .in('serial_number', serialNumbers);

      if (!units) throw new Error('Units not found');

      // Prepare compliance payload
      const payload = {
        timestamp: new Date().toISOString(),
        units: units.map(unit => ({
          serial_number: unit.serial_number,
          unit_type: unit.unit_type,
          product_code: unit.product_code,
          manufacturing_date: unit.manufacturing_date,
          expiry_date: unit.expiry_date,
          batch_id: unit.batch_id,
          current_status: unit.status,
          current_location: unit.current_location,
          eu_tpd_id: unit.eu_tpd_id,
          gcc_traceability_id: unit.gcc_traceability_id,
          movement_history: unit.serial_movements
        }))
      };

      // Simulate API call to compliance systems
      // In production, replace with actual EU TPD or GCC API endpoints
      let response;
      let complianceEndpoint;

      if (syncType === 'eu_tpd') {
        complianceEndpoint = 'https://api.eu-tpd.example.com/v1/traceability/upload';
        console.log('Would sync to EU TPD:', payload);
        
        // Simulated response
        response = {
          success: true,
          tpd_ids: units.map(u => ({
            serial: u.serial_number,
            tpd_id: `TPD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          }))
        };

        // Update units with TPD IDs
        for (const item of response.tpd_ids) {
          await supabase
            .from('serialized_units')
            .update({ eu_tpd_id: item.tpd_id })
            .eq('serial_number', item.serial);
        }

      } else if (syncType === 'gcc_traceability') {
        complianceEndpoint = 'https://api.gcc-trace.example.com/v1/tobacco/register';
        console.log('Would sync to GCC:', payload);
        
        // Simulated response
        response = {
          success: true,
          gcc_ids: units.map(u => ({
            serial: u.serial_number,
            gcc_id: `GCC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          }))
        };

        // Update units with GCC IDs
        for (const item of response.gcc_ids) {
          await supabase
            .from('serialized_units')
            .update({ gcc_traceability_id: item.gcc_id })
            .eq('serial_number', item.serial);
        }
      }

      // Update sync log as completed
      await supabase
        .from('compliance_sync_logs')
        .update({
          status: 'completed',
          sync_completed_at: new Date().toISOString(),
          request_payload: payload,
          response_payload: response
        })
        .eq('id', syncLog.id);

      return new Response(JSON.stringify({
        success: true,
        syncLogId: syncLog.id,
        response
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (syncError) {
      // Update sync log as failed
      const errorMessage = syncError instanceof Error ? syncError.message : 'Unknown error';
      await supabase
        .from('compliance_sync_logs')
        .update({
          status: 'failed',
          error_message: errorMessage,
          sync_completed_at: new Date().toISOString()
        })
        .eq('id', syncLog.id);

      throw syncError;
    }

  } catch (error) {
    console.error('Compliance sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});