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
    const autoResolutions: any[] = [];

    // Helper function to suggest auto-resolution
    const suggestAutoResolution = (anomalyType: string, metadata: any) => {
      const resolutions: Record<string, { action: string; canAutoResolve: boolean }> = {
        'missing_serial': {
          action: 'Generate missing serial numbers for batch and update aggregation relationships',
          canAutoResolve: true
        },
        'delayed_shipment': {
          action: 'Alert logistics manager, reassign vehicle if available, update ETA notifications',
          canAutoResolve: false
        },
        'erp_sync_failure': {
          action: 'Retry ERP synchronization with exponential backoff, escalate if 3 failures',
          canAutoResolve: true
        },
        'compliance_sync_failure': {
          action: 'Retry compliance sync, verify endpoint connectivity, check credentials',
          canAutoResolve: true
        },
        'overdue_maintenance': {
          action: 'Schedule immediate maintenance, reassign active shipments to other vehicles',
          canAutoResolve: false
        }
      };
      return resolutions[anomalyType] || { action: 'Manual investigation required', canAutoResolve: false };
    };

    // 1. Detect missing serial numbers
    if (!scanType || scanType === 'serialization') {
      const { data: batchesWithoutSerials } = await supabase
        .from('procurement_batches')
        .select('id, batch_number, quantity_kg, status, created_at')
        .eq('status', 'approved')
        .is('serialization_complete', false)
        .limit(100);

      if (batchesWithoutSerials) {
        for (const batch of batchesWithoutSerials) {
          const daysWithoutSerial = Math.floor(
            (Date.now() - new Date(batch.created_at).getTime()) / (1000 * 60 * 60 * 24)
          );
          
          const resolution = suggestAutoResolution('missing_serial', batch);
          
          detectedAnomalies.push({
            anomaly_type: 'missing_serial',
            severity: daysWithoutSerial > 7 ? 'CRITICAL' : daysWithoutSerial > 3 ? 'HIGH' : 'MEDIUM',
            title: `Missing Serial Numbers: ${batch.batch_number}`,
            description: `Batch ${batch.batch_number} (${batch.quantity_kg}kg) has been approved for ${daysWithoutSerial} days without serial number generation`,
            suggested_resolution: resolution.action,
            affected_resource_type: 'procurement_batches',
            affected_resource_id: batch.id,
            metadata: { batch_id: batch.id, days_waiting: daysWithoutSerial, can_auto_resolve: resolution.canAutoResolve }
          });
        }
      }
    }

    // 2. Detect delayed shipments
    if (!scanType || scanType === 'logistics') {
      const { data: delayedShipments } = await supabase
        .from('shipments')
        .select('id, batch_id, expected_arrival, status, from_location, to_location')
        .eq('status', 'in-transit')
        .lt('expected_arrival', new Date().toISOString());

      if (delayedShipments && delayedShipments.length > 0) {
        for (const shipment of delayedShipments) {
          const delayHours = Math.floor(
            (Date.now() - new Date(shipment.expected_arrival).getTime()) / (1000 * 60 * 60)
          );

          const resolution = suggestAutoResolution('delayed_shipment', shipment);

          detectedAnomalies.push({
            anomaly_type: 'delayed_shipment',
            severity: delayHours > 48 ? 'CRITICAL' : delayHours > 24 ? 'HIGH' : 'MEDIUM',
            title: `Delayed Shipment: ${shipment.id}`,
            description: `Shipment from ${shipment.from_location} to ${shipment.to_location} is delayed by ${delayHours} hours`,
            suggested_resolution: resolution.action,
            affected_resource_type: 'shipments',
            affected_resource_id: shipment.id,
            metadata: { shipment_id: shipment.id, delay_hours: delayHours, can_auto_resolve: resolution.canAutoResolve }
          });
        }
      }
    }

    // 3. Detect failed ERP syncs
    if (!scanType || scanType === 'erp') {
      const { data: failedERPSyncs } = await supabase
        .from('wholesaler_erp_sync_logs')
        .select('id, entity_type, entity_id, sync_type, error_message, created_at')
        .eq('status', 'failed')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(20);

      if (failedERPSyncs && failedERPSyncs.length > 0) {
        for (const sync of failedERPSyncs) {
          const resolution = suggestAutoResolution('erp_sync_failure', sync);

          detectedAnomalies.push({
            anomaly_type: 'erp_sync_failure',
            severity: 'HIGH',
            title: `ERP Sync Failed: ${sync.entity_type}`,
            description: `Failed to sync ${sync.entity_type} (${sync.entity_id}) with ERP system. Error: ${sync.error_message}`,
            suggested_resolution: resolution.action,
            affected_resource_type: 'wholesaler_erp_sync_logs',
            affected_resource_id: sync.id,
            metadata: { sync_log_id: sync.id, error: sync.error_message, can_auto_resolve: resolution.canAutoResolve }
          });
        }
      }
    }

    // 4. Detect failed compliance syncs
    if (!scanType || scanType === 'compliance') {
      const { data: failedComplianceSyncs } = await supabase
        .from('compliance_sync_logs')
        .select('id, sync_type, sync_direction, error_message, created_at')
        .eq('status', 'failed')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(20);

      if (failedComplianceSyncs && failedComplianceSyncs.length > 0) {
        for (const sync of failedComplianceSyncs) {
          const resolution = suggestAutoResolution('compliance_sync_failure', sync);

          detectedAnomalies.push({
            anomaly_type: 'compliance_sync_failure',
            severity: 'HIGH',
            title: `Compliance Sync Failed: ${sync.sync_type}`,
            description: `Failed ${sync.sync_direction} sync for ${sync.sync_type}. Error: ${sync.error_message}`,
            suggested_resolution: resolution.action,
            affected_resource_type: 'compliance_sync_logs',
            affected_resource_id: sync.id,
            metadata: { sync_log_id: sync.id, error: sync.error_message, can_auto_resolve: resolution.canAutoResolve }
          });
        }
      }
    }

    // 5. Detect overdue vehicle maintenance
    if (!scanType || scanType === 'maintenance') {
      const { data: overdueVehicles } = await supabase
        .from('vehicles')
        .select('id, vehicle_number, next_maintenance_date, current_shipment_id')
        .eq('status', 'active')
        .lt('next_maintenance_date', new Date().toISOString())
        .limit(50);

      if (overdueVehicles && overdueVehicles.length > 0) {
        for (const vehicle of overdueVehicles) {
          const daysOverdue = Math.floor(
            (Date.now() - new Date(vehicle.next_maintenance_date).getTime()) / (1000 * 60 * 60 * 24)
          );

          const resolution = suggestAutoResolution('overdue_maintenance', vehicle);

          detectedAnomalies.push({
            anomaly_type: 'overdue_maintenance',
            severity: daysOverdue > 14 ? 'CRITICAL' : daysOverdue > 7 ? 'HIGH' : 'MEDIUM',
            title: `Overdue Maintenance: ${vehicle.vehicle_number}`,
            description: `Vehicle ${vehicle.vehicle_number} maintenance is overdue by ${daysOverdue} days${vehicle.current_shipment_id ? ' and is currently assigned to an active shipment' : ''}`,
            suggested_resolution: resolution.action,
            affected_resource_type: 'vehicles',
            affected_resource_id: vehicle.id,
            metadata: { vehicle_id: vehicle.id, days_overdue: daysOverdue, has_active_shipment: !!vehicle.current_shipment_id, can_auto_resolve: resolution.canAutoResolve }
          });
        }
      }
    }

    // Insert all detected anomalies
    if (detectedAnomalies.length > 0) {
      const { data: insertedAnomalies, error: insertError } = await supabase
        .from('anomaly_logs')
        .insert(detectedAnomalies)
        .select('id, anomaly_type, severity, metadata');

      if (insertError) {
        console.error('Error inserting anomalies:', insertError);
      }

      // For critical anomalies, get AI root cause analysis
      const criticalAnomalies = insertedAnomalies?.filter(a => a.severity === 'CRITICAL') || [];
      
      if (criticalAnomalies.length > 0) {
        try {
          const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
          if (LOVABLE_API_KEY) {
            for (const anomaly of criticalAnomalies) {
              try {
                const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    model: 'google/gemini-2.5-flash',
                    messages: [
                      {
                        role: 'system',
                        content: 'You are an expert supply chain analyst. Analyze anomalies and provide: 1) Root cause (2-3 sentences), 2) Immediate action (specific steps), 3) Prevention strategy (long-term fix). Be concise and actionable.'
                      },
                      {
                        role: 'user',
                        content: `Critical Anomaly Analysis:\nType: ${anomaly.anomaly_type}\nSeverity: ${anomaly.severity}\nMetadata: ${JSON.stringify(anomaly.metadata)}\n\nProvide root cause analysis and recommendations.`
                      }
                    ]
                  })
                });

                if (aiResponse.ok) {
                  const aiData = await aiResponse.json();
                  const rootCause = aiData.choices[0]?.message?.content;
                  
                  if (rootCause) {
                    await supabase
                      .from('anomaly_logs')
                      .update({ 
                        ai_root_cause: rootCause,
                        root_cause: rootCause.substring(0, 500)
                      })
                      .eq('id', anomaly.id);
                  }
                }
              } catch (aiError) {
                console.error('AI analysis error for anomaly:', anomaly.id, aiError);
              }
            }
          }
        } catch (error) {
          console.error('Error getting AI root cause:', error);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        detected: detectedAnomalies.length,
        anomalies: detectedAnomalies.map(a => ({ 
          type: a.anomaly_type, 
          severity: a.severity,
          can_auto_resolve: a.metadata?.can_auto_resolve || false
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in detect-anomalies:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
