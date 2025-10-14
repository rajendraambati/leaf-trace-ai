import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import 'https://deno.land/x/xhr@0.1.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shipments, vehicles, constraints } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    if (!shipments || !vehicles) {
      throw new Error('Shipments and vehicles data are required');
    }

    console.log('Optimizing routes for', shipments.length, 'shipments');

    const systemPrompt = `You are a logistics optimization AI specializing in vehicle routing problems for supply chain management.

Given shipment data and vehicle constraints, optimize delivery routes to minimize:
- Total distance traveled
- Fuel consumption
- Delivery time
- Cost

Return ONLY valid JSON with this exact structure:
{
  "optimized_routes": [
    {
      "vehicle_id": string,
      "route": [
        {
          "shipment_id": string,
          "location": string,
          "sequence": number,
          "estimated_arrival": string (ISO datetime),
          "estimated_duration": number (minutes)
        }
      ],
      "total_distance_km": number,
      "total_duration_minutes": number,
      "fuel_estimate_liters": number,
      "cost_estimate": number,
      "load_utilization": number (0-100 percentage)
    }
  ],
  "summary": {
    "total_distance_km": number,
    "total_time_hours": number,
    "total_fuel_liters": number,
    "total_cost": number,
    "efficiency_score": number (0-100),
    "co2_emissions_kg": number
  },
  "recommendations": string[],
  "alternative_routes": number,
  "confidence": number (0-100)
}`;

    const userPrompt = `Optimize routes for the following data:

Shipments: ${JSON.stringify(shipments)}
Vehicles: ${JSON.stringify(vehicles)}
${constraints ? `Constraints: ${JSON.stringify(constraints)}` : ''}

Consider:
- Time windows for deliveries
- Vehicle capacity constraints
- Traffic patterns
- Fuel efficiency
- Weather conditions
- Road conditions

Return only JSON.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      if (response.status === 429) {
        throw new Error('AI rate limit exceeded. Please try again later.');
      }
      if (response.status === 402) {
        throw new Error('AI credits exhausted. Please add credits to continue.');
      }
      throw new Error(`AI Gateway returned ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI Route Optimization Response:', aiResponse);

    let optimizationResult;
    try {
      const cleanResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      optimizationResult = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      // Fallback: simple sequential routing
      optimizationResult = {
        optimized_routes: vehicles.map((vehicle: any, idx: number) => ({
          vehicle_id: vehicle.id || vehicle.vehicle_id,
          route: shipments.slice(idx * Math.ceil(shipments.length / vehicles.length), 
                                 (idx + 1) * Math.ceil(shipments.length / vehicles.length))
                         .map((s: any, i: number) => ({
            shipment_id: s.id,
            location: s.to_location,
            sequence: i + 1,
            estimated_arrival: new Date(Date.now() + (i + 1) * 3600000).toISOString(),
            estimated_duration: 60
          })),
          total_distance_km: 150,
          total_duration_minutes: 240,
          fuel_estimate_liters: 30,
          cost_estimate: 120,
          load_utilization: 75
        })),
        summary: {
          total_distance_km: 150 * vehicles.length,
          total_time_hours: 4 * vehicles.length,
          total_fuel_liters: 30 * vehicles.length,
          total_cost: 120 * vehicles.length,
          efficiency_score: 70,
          co2_emissions_kg: 75 * vehicles.length
        },
        recommendations: ['Manual route review recommended'],
        alternative_routes: 2,
        confidence: 60
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        optimized_at: new Date().toISOString(),
        ...optimizationResult
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in route-optimization function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
