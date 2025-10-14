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
    const { imageUrl, farmerId, location, historicalData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    if (!imageUrl) {
      throw new Error('Satellite/drone image URL is required');
    }

    console.log('Analyzing crop health for farmer:', farmerId);

    const contextPrompt = `You are an agricultural AI expert specializing in tobacco crop health analysis from satellite and drone imagery.

Analyze the provided imagery and return ONLY valid JSON with this exact structure:
{
  "ndvi_score": number (0-1, Normalized Difference Vegetation Index),
  "health_status": "Excellent" | "Good" | "Fair" | "Poor" | "Critical",
  "growth_stage": "Seedling" | "Vegetative" | "Flowering" | "Mature" | "Harvest Ready",
  "disease_detected": boolean,
  "disease_types": string[],
  "disease_probability": number (0-100),
  "pest_risk": "Low" | "Medium" | "High",
  "water_stress": "None" | "Mild" | "Moderate" | "Severe",
  "nutrient_deficiency": string[],
  "yield_forecast": number (kg per acre),
  "harvest_recommendation": {
    "optimal_date": string (ISO date),
    "confidence": number (0-100)
  },
  "recommendations": string[],
  "risk_assessment": string,
  "confidence": number (0-100)
}

${location ? `Location: ${location}` : ''}
${historicalData ? `Historical context: ${JSON.stringify(historicalData)}` : ''}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: contextPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this crop imagery and provide comprehensive health assessment. Return only JSON.' },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
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

    console.log('AI Crop Health Response:', aiResponse);

    let predictionResult;
    try {
      const cleanResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      predictionResult = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      predictionResult = {
        ndvi_score: 0.7,
        health_status: 'Good',
        growth_stage: 'Vegetative',
        disease_detected: false,
        disease_types: [],
        disease_probability: 10,
        pest_risk: 'Low',
        water_stress: 'None',
        nutrient_deficiency: [],
        yield_forecast: 850,
        harvest_recommendation: {
          optimal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          confidence: 60
        },
        recommendations: ['Manual inspection recommended'],
        risk_assessment: 'Unable to fully analyze imagery',
        confidence: 50
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        farmer_id: farmerId,
        analyzed_at: new Date().toISOString(),
        ...predictionResult
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in crop-health-prediction function:', error);
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
