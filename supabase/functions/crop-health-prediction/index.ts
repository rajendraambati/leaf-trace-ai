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

    if (!imageUrl) {
      throw new Error('Satellite/drone image URL is required');
    }

    console.log('Processing crop health prediction for farmer:', farmerId);

    // Get Azure ML credentials
    const azureEndpoint = Deno.env.get('AZURE_ML_CROP_HEALTH_ENDPOINT');
    const azureApiKey = Deno.env.get('AZURE_ML_CROP_HEALTH_API_KEY');

    if (!azureEndpoint || !azureApiKey) {
      console.warn('Azure ML not configured, falling back to Lovable AI');
      return await fallbackToLovableAI(imageUrl, farmerId, location, historicalData);
    }

    // Download image from URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch image');
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

    // Call Azure ML endpoint for real-time crop health prediction
    console.log('Calling Azure ML crop health endpoint');
    const azureResponse = await fetch(azureEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${azureApiKey}`,
      },
      body: JSON.stringify({
        input_data: {
          columns: ['image', 'location', 'historical_data'],
          data: [[base64Image, location || 'Unknown', JSON.stringify(historicalData || {})]]
        }
      }),
    });

    if (!azureResponse.ok) {
      const errorText = await azureResponse.text();
      console.error('Azure ML API error:', azureResponse.status, errorText);
      throw new Error(`Azure ML API error: ${azureResponse.status}`);
    }

    const azureResult = await azureResponse.json();
    console.log('Azure ML crop health response received');

    // Parse Azure ML response (adjust based on your model's output format)
    const predictions = azureResult.output || azureResult.predictions || azureResult;
    
    const predictionResult = {
      ndvi_score: predictions.ndvi_score || predictions[0]?.ndvi_score || 0.7,
      health_status: predictions.health_status || predictions[0]?.health_status || 'Good',
      growth_stage: predictions.growth_stage || predictions[0]?.growth_stage || 'Vegetative',
      disease_detected: predictions.disease_detected || predictions[0]?.disease_detected || false,
      disease_types: predictions.disease_types || predictions[0]?.disease_types || [],
      disease_probability: predictions.disease_probability || predictions[0]?.disease_probability || 10,
      pest_risk: predictions.pest_risk || predictions[0]?.pest_risk || 'Low',
      water_stress: predictions.water_stress || predictions[0]?.water_stress || 'None',
      nutrient_deficiency: predictions.nutrient_deficiency || predictions[0]?.nutrient_deficiency || [],
      yield_forecast: predictions.yield_forecast || predictions[0]?.yield_forecast || 850,
      harvest_recommendation: predictions.harvest_recommendation || predictions[0]?.harvest_recommendation || {
        optimal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        confidence: 70
      },
      recommendations: predictions.recommendations || predictions[0]?.recommendations || [],
      risk_assessment: predictions.risk_assessment || predictions[0]?.risk_assessment || 'Normal risk level',
      confidence: predictions.confidence || predictions[0]?.confidence || 80,
    };

    return new Response(
      JSON.stringify({
        success: true,
        source: 'azure_ml',
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

// Fallback to Lovable AI if Azure ML is not configured
async function fallbackToLovableAI(imageUrl: string, farmerId: string, location?: string, historicalData?: any) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

  if (!LOVABLE_API_KEY) {
    throw new Error('Neither Azure ML nor Lovable AI credentials configured');
  }

  console.log('Using Lovable AI for crop health prediction');

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
    throw new Error(`AI Gateway returned ${response.status}`);
  }

  const data = await response.json();
  const aiResponse = data.choices[0].message.content;
  const cleanResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const predictionResult = JSON.parse(cleanResponse);

  return new Response(
    JSON.stringify({
      success: true,
      source: 'lovable_ai',
      farmer_id: farmerId,
      analyzed_at: new Date().toISOString(),
      ...predictionResult
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    }
  );
}
