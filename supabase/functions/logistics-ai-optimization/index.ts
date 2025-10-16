import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      type, // 'route_prediction' | 'anomaly_detection' | 'delay_prediction'
      shipment_id,
      origin,
      destination,
      current_location,
      weather_conditions,
      road_conditions,
      fuel_cost_per_km,
      scheduled_checkpoints,
      actual_route
    } = await req.json();

    console.log('AI Optimization request:', { type, shipment_id });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';
    let result: any = {};

    switch (type) {
      case 'route_prediction':
        systemPrompt = `You are an expert logistics AI that optimizes delivery routes. 
Analyze the provided data and recommend the most efficient route considering:
- Weather conditions (rain, fog, storms affect speed)
- Road conditions (construction, traffic, road quality)
- Fuel costs and distance optimization
- Estimated delivery time
Provide specific, actionable recommendations.`;

        userPrompt = `Optimize delivery route:
Origin: ${origin?.name || 'Unknown'} (${origin?.lat}, ${origin?.lng})
Destination: ${destination?.name || 'Unknown'} (${destination?.lat}, ${destination?.lng})
Weather: ${weather_conditions || 'Clear'}
Road Conditions: ${road_conditions || 'Normal'}
Fuel Cost: $${fuel_cost_per_km || 1.5}/km

Provide:
1. Recommended route waypoints
2. Estimated fuel cost
3. Estimated time
4. Risk factors
5. Alternative routes if needed`;

        const routeResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            tools: [{
              type: 'function',
              function: {
                name: 'optimize_route',
                description: 'Return optimized route recommendations',
                parameters: {
                  type: 'object',
                  properties: {
                    recommended_route: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          waypoint: { type: 'string' },
                          distance_km: { type: 'number' },
                          estimated_time_minutes: { type: 'number' }
                        }
                      }
                    },
                    total_distance_km: { type: 'number' },
                    estimated_fuel_cost: { type: 'number' },
                    estimated_time_hours: { type: 'number' },
                    risk_factors: { type: 'array', items: { type: 'string' } },
                    recommendations: { type: 'array', items: { type: 'string' } }
                  },
                  required: ['total_distance_km', 'estimated_fuel_cost', 'estimated_time_hours']
                }
              }
            }],
            tool_choice: { type: 'function', function: { name: 'optimize_route' } }
          }),
        });

        if (!routeResponse.ok) {
          if (routeResponse.status === 429) {
            return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          if (routeResponse.status === 402) {
            return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), {
              status: 402,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          throw new Error('AI request failed');
        }

        const routeData = await routeResponse.json();
        const routeArgs = JSON.parse(routeData.choices[0].message.tool_calls[0].function.arguments);
        result = routeArgs;
        break;

      case 'anomaly_detection':
        systemPrompt = `You are an AI logistics anomaly detector. Analyze shipment data to identify:
- Route deviations from planned path
- Unusual delays or speed changes
- Missed checkpoints
- Temperature anomalies
- Unexpected stops
Classify severity: LOW, MEDIUM, HIGH, CRITICAL`;

        userPrompt = `Analyze shipment anomalies:
Shipment ID: ${shipment_id}
Planned Checkpoints: ${JSON.stringify(scheduled_checkpoints || [])}
Current Location: ${JSON.stringify(current_location || {})}
Actual Route: ${JSON.stringify(actual_route || [])}
Weather: ${weather_conditions || 'Unknown'}

Detect any anomalies and provide immediate recommendations.`;

        const anomalyResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            tools: [{
              type: 'function',
              function: {
                name: 'detect_anomalies',
                description: 'Detect and classify logistics anomalies',
                parameters: {
                  type: 'object',
                  properties: {
                    anomalies: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          type: { 
                            type: 'string',
                            enum: ['route_deviation', 'delay', 'missed_checkpoint', 'temperature_alert', 'unauthorized_stop']
                          },
                          severity: { 
                            type: 'string',
                            enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
                          },
                          description: { type: 'string' },
                          recommendation: { type: 'string' }
                        }
                      }
                    },
                    overall_risk: { 
                      type: 'string',
                      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
                    },
                    requires_immediate_action: { type: 'boolean' }
                  },
                  required: ['anomalies', 'overall_risk']
                }
              }
            }],
            tool_choice: { type: 'function', function: { name: 'detect_anomalies' } }
          }),
        });

        if (!anomalyResponse.ok) {
          if (anomalyResponse.status === 429) {
            return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          if (anomalyResponse.status === 402) {
            return new Response(JSON.stringify({ error: 'Payment required' }), {
              status: 402,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          throw new Error('AI request failed');
        }

        const anomalyData = await anomalyResponse.json();
        const anomalyArgs = JSON.parse(anomalyData.choices[0].message.tool_calls[0].function.arguments);
        result = anomalyArgs;

        // Create alerts for critical anomalies
        if (anomalyArgs.requires_immediate_action && shipment_id) {
          for (const anomaly of anomalyArgs.anomalies) {
            if (anomaly.severity === 'HIGH' || anomaly.severity === 'CRITICAL') {
              await supabase.from('iot_events').insert({
                device_id: `AI-DETECTOR-${shipment_id}`,
                shipment_id,
                event_type: 'inspection',
                event_data: {
                  ai_detected: true,
                  anomaly_type: anomaly.type,
                  severity: anomaly.severity,
                  description: anomaly.description,
                  recommendation: anomaly.recommendation
                }
              });
            }
          }
        }
        break;

      case 'delay_prediction':
        systemPrompt = `You are an AI that predicts delivery delays. Consider:
- Current location vs schedule
- Weather impact on speed
- Road conditions
- Historical data patterns
- Traffic patterns
Provide ETA updates and confidence levels.`;

        userPrompt = `Predict delivery delays:
Shipment ID: ${shipment_id}
Current Location: ${JSON.stringify(current_location || {})}
Destination: ${JSON.stringify(destination || {})}
Weather: ${weather_conditions || 'Clear'}
Road Conditions: ${road_conditions || 'Normal'}

Calculate updated ETA and delay probability.`;

        const delayResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            tools: [{
              type: 'function',
              function: {
                name: 'predict_delay',
                description: 'Predict delivery delays and updated ETA',
                parameters: {
                  type: 'object',
                  properties: {
                    delay_probability: { type: 'number', minimum: 0, maximum: 1 },
                    estimated_delay_minutes: { type: 'number' },
                    updated_eta: { type: 'string' },
                    confidence_level: { 
                      type: 'string',
                      enum: ['LOW', 'MEDIUM', 'HIGH']
                    },
                    factors: { type: 'array', items: { type: 'string' } },
                    recommendations: { type: 'array', items: { type: 'string' } }
                  },
                  required: ['delay_probability', 'updated_eta', 'confidence_level']
                }
              }
            }],
            tool_choice: { type: 'function', function: { name: 'predict_delay' } }
          }),
        });

        if (!delayResponse.ok) {
          if (delayResponse.status === 429) {
            return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          if (delayResponse.status === 402) {
            return new Response(JSON.stringify({ error: 'Payment required' }), {
              status: 402,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          throw new Error('AI request failed');
        }

        const delayData = await delayResponse.json();
        const delayArgs = JSON.parse(delayData.choices[0].message.tool_calls[0].function.arguments);
        result = delayArgs;
        break;

      default:
        throw new Error('Invalid optimization type');
    }

    // Log AI usage
    await supabase.from('ai_usage_analytics').insert({
      feature_type: `logistics_${type}`,
      model_name: 'google/gemini-2.5-flash',
      input_data: { shipment_id, type },
      output_data: result,
      success: true
    });

    console.log('AI optimization completed:', type);

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in logistics AI optimization:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
