import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { vehicleId, action = 'generate_insights' } = await req.json();

    if (!vehicleId) {
      return new Response(
        JSON.stringify({ error: 'Vehicle ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing AI insights for vehicle: ${vehicleId}, action: ${action}`);

    // Fetch vehicle data
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single();

    if (vehicleError || !vehicle) {
      console.error('Vehicle fetch error:', vehicleError);
      return new Response(
        JSON.stringify({ error: 'Vehicle not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch active shipment
    const { data: shipment } = await supabase
      .from('shipments')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'in-transit')
      .order('departure_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch recent tracking history
    const { data: trackingHistory } = await supabase
      .from('vehicle_tracking_history')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('recorded_at', { ascending: false })
      .limit(10);

    // Fetch recent wellbeing logs
    const { data: wellbeingLogs } = await supabase
      .from('driver_wellbeing_logs')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Prepare context for AI
    const contextData = {
      vehicle: {
        id: vehicle.id,
        registration: vehicle.registration_number,
        type: vehicle.vehicle_type,
        status: vehicle.status,
        currentLocation: vehicle.current_location,
        fuelLevel: vehicle.fuel_level,
        healthScore: vehicle.health_score,
        totalDistance: vehicle.total_distance_km,
        lastService: vehicle.last_service_date,
        nextServiceDue: vehicle.next_service_due,
      },
      shipment: shipment ? {
        id: shipment.id,
        from: shipment.from_location,
        to: shipment.to_location,
        status: shipment.status,
        departureTime: shipment.departure_time,
        eta: shipment.eta,
      } : null,
      recentTracking: trackingHistory?.slice(0, 5),
      recentWellbeing: wellbeingLogs?.slice(0, 3),
    };

    // Generate AI insights
    const systemPrompt = `You are an empathetic AI assistant for tobacco logistics. Your role is to provide transparent, stress-free, and emotionally reassuring insights for drivers, warehouse teams, and processing companies.

Your tone should be:
- Empathetic and supportive
- Reliable and trustworthy
- Proactive and helpful
- Clear and transparent
- Reassuring without being dismissive

Focus on:
1. Driver wellbeing and safety
2. Route optimization and efficiency
3. Predictive maintenance alerts
4. Transparent communication
5. Proactive problem prevention

Always provide actionable recommendations with a caring, supportive tone.`;

    const userPrompt = `Analyze this vehicle data and provide insights:

Vehicle Status: ${JSON.stringify(contextData.vehicle, null, 2)}
${contextData.shipment ? `Active Shipment: ${JSON.stringify(contextData.shipment, null, 2)}` : 'No active shipment'}
${contextData.recentWellbeing ? `Recent Driver Wellbeing: ${JSON.stringify(contextData.recentWellbeing, null, 2)}` : ''}

Please provide:
1. An overall status assessment (positive, supportive tone)
2. Any concerns that need attention (empathetic, non-alarming)
3. 3-5 specific, actionable recommendations
4. Estimated confidence score (0-100)
5. Categorize each insight by type: route_optimization, driver_wellbeing, predictive_maintenance, eta_update, weather_alert, traffic_alert, fuel_alert, or safety_alert
6. Assign severity: info, low, medium, high, or critical

Return your response in JSON format:
{
  "insights": [
    {
      "type": "insight_type",
      "severity": "severity_level",
      "title": "Short empathetic title",
      "message": "Detailed, caring message",
      "recommendations": ["recommendation1", "recommendation2"]
    }
  ],
  "overallStatus": "Brief supportive summary",
  "confidenceScore": 85
}`;

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI service unavailable' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;

    console.log('AI Response:', aiContent);

    // Parse AI response
    let parsedInsights;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiContent.match(/```json\n?([\s\S]*?)\n?```/) || 
                       aiContent.match(/```\n?([\s\S]*?)\n?```/) ||
                       [null, aiContent];
      parsedInsights = JSON.parse(jsonMatch[1] || aiContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid AI response format' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store insights in database
    const insightsToStore = parsedInsights.insights.map((insight: any) => ({
      vehicle_id: vehicleId,
      shipment_id: shipment?.id || null,
      insight_type: insight.type,
      severity: insight.severity,
      title: insight.title,
      message: insight.message,
      recommendations: insight.recommendations || [],
      confidence_score: parsedInsights.confidenceScore,
      metadata: {
        overallStatus: parsedInsights.overallStatus,
        generatedAt: new Date().toISOString(),
      },
    }));

    const { data: storedInsights, error: insertError } = await supabase
      .from('ai_vehicle_insights')
      .insert(insightsToStore)
      .select();

    if (insertError) {
      console.error('Error storing insights:', insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        insights: storedInsights || insightsToStore,
        overallStatus: parsedInsights.overallStatus,
        confidenceScore: parsedInsights.confidenceScore,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in vehicle-ai-insights:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
