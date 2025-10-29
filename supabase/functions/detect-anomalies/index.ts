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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { scanType } = await req.json();
    const detectedAnomalies: any[] = [];

    // 1. Detect missing serial numbers for shipped batches
    if (!scanType || scanType === 'serialization') {
      const { data: batchesWithoutSerials } = await supabase
        .from('procurement_batches')
        .select('id, batch_number, quantity_kg, status')
        .in('status', ['in-transit', 'delivered'])
        .limit(100);

      if (batchesWithoutSerials) {
        for (const batch of batchesWithoutSerials) {
          const { count } = await supabase
            .from('serialized_units')
            .select('*', { count: 'exact', head: true })
            .eq('batch_id', batch.id);

          if (!count || count === 0) {
            detectedAnomalies.push({
              anomaly_type: 'missing_serials',
              severity: 'high',
              entity_type: 'batch',
              entity_id: batch.id,
              title: `Missing Serial Numbers for Batch ${batch.batch_number}`,
              description: `Batch ${batch.batch_number} (${batch.quantity_kg}kg) is ${batch.status} but has no serialized units.`,
              resolution_suggested: 'Generate serial numbers immediately before shipment reaches destination. Use Serialization Manager to create unit serials.',
              metadata: { batch_number: batch.batch_number, quantity_kg: batch.quantity_kg, status: batch.status }
            });
          }
        }
      }
    }

    // 2. Detect delayed dispatches (shipments in-transit for more than expected duration)
    if (!scanType || scanType === 'logistics') {
      const { data: delayedShipments } = await supabase
        .from('shipments')
        .select('id, batch_id, status, departure_time, estimated_arrival, from_location, to_location')
        .eq('status', 'in-transit')
        .lt('estimated_arrival', new Date().toISOString());

      if (delayedShipments && delayedShipments.length > 0) {
        for (const shipment of delayedShipments) {
          const delay = Math.floor((Date.now() - new Date(shipment.estimated_arrival).getTime()) / (1000 * 60 * 60));
          detectedAnomalies.push({
            anomaly_type: 'delayed_dispatch',
            severity: delay > 24 ? 'critical' : delay > 12 ? 'high' : 'medium',
            entity_type: 'shipment',
            entity_id: shipment.id,
            title: `Shipment ${shipment.id} Delayed by ${delay} hours`,
            description: `Shipment from ${shipment.from_location} to ${shipment.to_location} is ${delay} hours past estimated arrival.`,
            resolution_suggested: delay > 24 
              ? 'ESCALATE: Contact driver immediately. Check GPS tracking. Consider alternative routing.'
              : 'Monitor closely. Check for traffic or weather delays. Update customer if delay exceeds 24h.',
            metadata: { delay_hours: delay, from: shipment.from_location, to: shipment.to_location }
          });
        }
      }
    }

    // 3. Detect failed ERP syncs
    if (!scanType || scanType === 'erp') {
      const { data: failedSyncs } = await supabase
        .from('wholesaler_erp_sync_logs')
        .select('*')
        .eq('status', 'failed')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (failedSyncs && failedSyncs.length > 0) {
        for (const sync of failedSyncs) {
          detectedAnomalies.push({
            anomaly_type: 'erp_sync_failed',
            severity: 'high',
            entity_type: 'erp_sync',
            entity_id: sync.id,
            title: `ERP Sync Failed: ${sync.sync_type}`,
            description: `${sync.entity_type} sync failed at ${new Date(sync.created_at).toLocaleString()}. Error: ${sync.error_message || 'Unknown'}`,
            resolution_suggested: 'Check ERP credentials and connectivity. Verify data format matches ERP requirements. Retry sync after fixing configuration.',
            metadata: { sync_type: sync.sync_type, entity_type: sync.entity_type, error: sync.error_message }
          });
        }
      }
    }

    // 4. Detect compliance sync failures
    if (!scanType || scanType === 'compliance') {
      const { data: complianceSyncFails } = await supabase
        .from('compliance_sync_logs')
        .select('*')
        .eq('status', 'failed')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(20);

      if (complianceSyncFails && complianceSyncFails.length > 0) {
        for (const sync of complianceSyncFails) {
          detectedAnomalies.push({
            anomaly_type: 'compliance_sync_failed',
            severity: 'critical',
            entity_type: 'compliance_sync',
            entity_id: sync.id,
            title: `Compliance Sync Failed: ${sync.sync_type}`,
            description: `Failed to sync ${sync.serial_numbers.length} units to ${sync.sync_type}. ${sync.error_message}`,
            resolution_suggested: 'CRITICAL: Compliance reporting required by law. Verify API credentials. Check serial number format. Contact compliance team.',
            metadata: { sync_type: sync.sync_type, serial_count: sync.serial_numbers.length }
          });
        }
      }
    }

    // 5. Detect vehicles with no maintenance in 6 months
    if (!scanType || scanType === 'maintenance') {
      const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
      const { data: vehiclesNeedingMaintenance } = await supabase
        .from('vehicles')
        .select('id, registration, status, last_maintenance_date')
        .eq('status', 'active')
        .or(`last_maintenance_date.is.null,last_maintenance_date.lt.${sixMonthsAgo}`)
        .limit(50);

      if (vehiclesNeedingMaintenance && vehiclesNeedingMaintenance.length > 0) {
        for (const vehicle of vehiclesNeedingMaintenance) {
          const daysSinceMaintenance = vehicle.last_maintenance_date 
            ? Math.floor((Date.now() - new Date(vehicle.last_maintenance_date).getTime()) / (1000 * 60 * 60 * 24))
            : 999;
          
          detectedAnomalies.push({
            anomaly_type: 'maintenance_overdue',
            severity: daysSinceMaintenance > 365 ? 'critical' : 'high',
            entity_type: 'vehicle',
            entity_id: vehicle.id,
            title: `Vehicle ${vehicle.registration} Maintenance Overdue`,
            description: vehicle.last_maintenance_date 
              ? `Last maintenance was ${daysSinceMaintenance} days ago. Scheduled maintenance is overdue.`
              : 'No maintenance record found. Schedule inspection immediately.',
            resolution_suggested: 'Schedule maintenance inspection. Take vehicle offline if safety risk. Update maintenance log.',
            metadata: { registration: vehicle.registration, days_since_maintenance: daysSinceMaintenance }
          });
        }
      }
    }

    // Insert all detected anomalies into database
    if (detectedAnomalies.length > 0) {
      const { error } = await supabase
        .from('anomaly_logs')
        .insert(detectedAnomalies);

      if (error) {
        console.error('Error inserting anomalies:', error);
      }
    }

    // Get AI-powered root cause analysis for critical anomalies
    const criticalAnomalies = detectedAnomalies.filter(a => a.severity === 'critical');
    if (criticalAnomalies.length > 0) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
        try {
          const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "system",
                  content: "You are a supply chain anomaly analyst. Provide root cause analysis and escalation recommendations."
                },
                {
                  role: "user",
                  content: `Analyze these critical anomalies and suggest root causes:\n${JSON.stringify(criticalAnomalies, null, 2)}`
                }
              ],
            }),
          });

          if (aiResp.ok) {
            const aiJson = await aiResp.json();
            const analysis = aiJson.choices?.[0]?.message?.content;
            
            // Update anomalies with AI analysis
            for (const anomaly of criticalAnomalies) {
              await supabase
                .from('anomaly_logs')
                .update({ root_cause: analysis, escalated: true })
                .eq('entity_id', anomaly.entity_id)
                .eq('anomaly_type', anomaly.anomaly_type);
            }
          }
        } catch (aiError) {
          console.error('AI analysis error:', aiError);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        detected: detectedAnomalies.length,
        anomalies: detectedAnomalies,
        critical_count: criticalAnomalies.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Anomaly detection error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
