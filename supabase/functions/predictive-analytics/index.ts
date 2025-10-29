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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { analysisType } = await req.json();

    // Fetch data for analysis
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [shipmentsData, vehiclesData, wellbeingData, iotData] = await Promise.all([
      supabase
        .from('shipments')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString()),
      supabase
        .from('vehicles')
        .select('*'),
      supabase
        .from('driver_wellbeing_logs')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString()),
      supabase
        .from('iot_events')
        .select('*')
        .eq('processed', false)
        .limit(1000)
    ]);

    const shipments = shipmentsData.data || [];
    const vehicles = vehiclesData.data || [];
    const wellbeingLogs = wellbeingData.data || [];
    const iotEvents = iotData.data || [];

    // Analyze route performance
    const routeStats: Record<string, {
      trips: number;
      onTime: number;
      delayed: number;
      totalDelay: number;
      avgDuration: number;
    }> = {};
    shipments.forEach(s => {
      const routeKey = `${s.from_location}-${s.to_location}`;
      if (!routeStats[routeKey]) {
        routeStats[routeKey] = {
          trips: 0,
          onTime: 0,
          delayed: 0,
          totalDelay: 0,
          avgDuration: 0
        };
      }
      routeStats[routeKey].trips++;
      
      if (s.actual_arrival && s.eta) {
        const delay = new Date(s.actual_arrival).getTime() - new Date(s.eta).getTime();
        if (delay > 0) {
          routeStats[routeKey].delayed++;
          routeStats[routeKey].totalDelay += delay / (1000 * 60); // minutes
        } else {
          routeStats[routeKey].onTime++;
        }
      }
    });

    // Identify idle vehicles
    const activeVehicleIds = new Set(shipments
      .filter(s => s.status === 'in-transit')
      .map(s => s.vehicle_id));
    
    const idleVehicles = vehicles.filter(v => 
      v.status === 'available' && !activeVehicleIds.has(v.id)
    );

    // Analyze driver wellbeing
    const driverRiskScores: Record<string, {
      totalLogs: number;
      highFatigue: number;
      highStress: number;
      concerns: string[];
    }> = {};
    wellbeingLogs.forEach(log => {
      if (!driverRiskScores[log.driver_id]) {
        driverRiskScores[log.driver_id] = {
          totalLogs: 0,
          highFatigue: 0,
          highStress: 0,
          concerns: []
        };
      }
      driverRiskScores[log.driver_id].totalLogs++;
      if (log.fatigue_level && log.fatigue_level > 7) driverRiskScores[log.driver_id].highFatigue++;
      if (log.stress_level && log.stress_level > 7) driverRiskScores[log.driver_id].highStress++;
      if (log.concerns) driverRiskScores[log.driver_id].concerns.push(log.concerns);
    });

    // Call Lovable AI for insights
    const aiPrompt = `You are a logistics performance analyst. Analyze this operational data and generate actionable insights:

Route Performance:
${Object.entries(routeStats).slice(0, 10).map(([route, stats]) => 
  `- ${route}: ${stats.trips} trips, ${Math.round((stats.onTime / stats.trips) * 100)}% on-time, avg delay: ${Math.round(stats.totalDelay / Math.max(stats.delayed, 1))} min`
).join('\n')}

Idle Vehicles: ${idleVehicles.length} vehicles currently idle
Vehicle IDs: ${idleVehicles.map(v => v.id).join(', ')}

Driver Wellbeing Concerns:
${Object.entries(driverRiskScores).slice(0, 5).map(([driverId, risk]) =>
  `- Driver ${driverId}: ${risk.highFatigue} high fatigue events, ${risk.highStress} high stress events`
).join('\n')}

Recent IoT Alerts: ${iotEvents.length} unprocessed events

Generate:
1. Critical alerts for underperforming routes (< 70% on-time)
2. Alerts for idle vehicles that could be deployed
3. Driver fatigue warnings (>= 3 high fatigue events)
4. Route optimization opportunities

Return as JSON:
{
  "alerts": [{
    "type": "underperforming_route|idle_vehicle|driver_fatigue|maintenance_due",
    "severity": "critical|high|medium|low",
    "entityType": "route|vehicle|driver",
    "entityId": "identifier",
    "title": "Alert title",
    "description": "Detailed description",
    "predictedImpact": "Business impact",
    "recommendedActions": ["action1", "action2"],
    "confidenceScore": 0.85
  }],
  "optimizations": ["suggestion1", "suggestion2"]
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: aiPrompt }
        ],
        temperature: 0.4
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices[0].message.content;
    
    let insights: {
      alerts?: Array<{
        type: string;
        severity: string;
        entityType: string;
        entityId: string;
        title: string;
        description: string;
        predictedImpact?: string;
        recommendedActions?: string[];
        confidenceScore?: number;
      }>;
      optimizations?: string[];
    } = { alerts: [], optimizations: [] };
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse AI insights:', e);
    }

    // Store alerts in database
    for (const alert of insights.alerts || []) {
      await supabase
        .from('predictive_alerts')
        .insert({
          alert_type: alert.type,
          severity: alert.severity,
          entity_type: alert.entityType,
          entity_id: alert.entityId,
          title: alert.title,
          description: alert.description,
          predicted_impact: alert.predictedImpact,
          recommended_actions: alert.recommendedActions,
          confidence_score: alert.confidenceScore,
          data_points: {
            routeStats,
            idleVehicles: idleVehicles.length,
            driverConcerns: Object.keys(driverRiskScores).length
          }
        });
    }

    // Store route analytics
    for (const [routeKey, stats] of Object.entries(routeStats)) {
      const [from, to] = routeKey.split('-');
      const onTimePercentage = (stats.onTime / stats.trips) * 100;
      const isUnderperforming = onTimePercentage < 70;

      await supabase
        .from('route_performance_analytics')
        .insert({
          route_id: routeKey.replace(/\s+/g, '_'),
          from_location: from,
          to_location: to,
          analysis_period_start: thirtyDaysAgo.toISOString(),
          analysis_period_end: new Date().toISOString(),
          total_trips: stats.trips,
          avg_delay_minutes: stats.totalDelay / Math.max(stats.delayed, 1),
          on_time_percentage: onTimePercentage,
          performance_score: onTimePercentage / 100,
          is_underperforming: isUnderperforming
        });
    }

    return new Response(JSON.stringify({
      success: true,
      insights,
      summary: {
        totalAlerts: insights.alerts?.length || 0,
        criticalAlerts: insights.alerts?.filter(a => a.severity === 'critical').length || 0,
        idleVehicles: idleVehicles.length,
        underperformingRoutes: Object.values(routeStats).filter(s => (s.onTime / s.trips) < 0.7).length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Predictive analytics error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});