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
    const { imageUrl, batchId } = await req.json();

    if (!imageUrl) {
      throw new Error('Image URL is required');
    }

    console.log('Processing AI grading for batch:', batchId);

    // Prioritize Lovable AI with Gemini Flash (no API key needed from user)
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (LOVABLE_API_KEY) {
      console.log('Using Lovable AI with Gemini Flash for tobacco grading');
      return await gradeWithGeminiFlash(imageUrl, batchId, LOVABLE_API_KEY);
    }

    // Fallback to Azure ML if configured
    const azureEndpoint = Deno.env.get('AZURE_ML_GRADING_ENDPOINT');
    const azureApiKey = Deno.env.get('AZURE_ML_GRADING_API_KEY');

    if (azureEndpoint && azureApiKey) {
      console.log('Falling back to Azure ML grading');
      return await gradeWithAzureML(imageUrl, batchId, azureEndpoint, azureApiKey);
    }

    throw new Error('No AI grading service configured');

  } catch (error) {
    console.error('Error in ai-grading function:', error);
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

// Grade tobacco using Lovable AI with Gemini Flash multimodal
async function gradeWithGeminiFlash(imageUrl: string, batchId: string, apiKey: string) {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: `You are an expert tobacco leaf quality grading AI. Analyze tobacco samples and classify them into three grades:
          
- **Premium**: Excellent color (golden to reddish-brown), uniform texture, no defects, optimal moisture, strong aroma
- **Standard**: Good color, mostly uniform texture, minor defects acceptable, adequate moisture
- **Low**: Poor color, uneven texture, visible defects, improper moisture or curing

Provide detailed analysis with scores (0-100) for each quality metric.

Return ONLY valid JSON with this exact structure:
{
  "ai_grade": "Premium" | "Standard" | "Low",
  "quality_score": number (0-100),
  "crop_health_score": number (0-100),
  "esg_score": number (0-100),
  "color_score": number (0-100),
  "texture_score": number (0-100),
  "moisture_score": number (0-100),
  "defects_detected": string[],
  "recommendations": string[],
  "confidence": number (0-100)
}`
        },
        {
          role: 'user',
          content: [
            { 
              type: 'text', 
              text: 'Analyze this tobacco leaf sample. Determine if it is Premium, Standard, or Low quality. Provide detailed scores and recommendations. Return only JSON.' 
            },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini Flash error:', response.status, errorText);
    throw new Error(`AI Gateway returned ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const aiResponse = data.choices[0].message.content;
  
  // Clean and parse JSON response
  const cleanResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const gradingResult = JSON.parse(cleanResponse);

  console.log('Gemini Flash grading result:', gradingResult.ai_grade, 'confidence:', gradingResult.confidence);

  return new Response(
    JSON.stringify({
      success: true,
      source: 'gemini_flash',
      batch_id: batchId,
      ...gradingResult
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    }
  );
}

// Fallback to Azure ML if Lovable AI is not available
async function gradeWithAzureML(imageUrl: string, batchId: string, endpoint: string, apiKey: string) {
  // Download image from URL
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error('Failed to fetch image');
  }
  
  const imageBuffer = await imageResponse.arrayBuffer();
  const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

  // Call Azure ML endpoint
  const azureResponse = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input_data: {
        columns: ['image'],
        data: [[base64Image]]
      }
    }),
  });

  if (!azureResponse.ok) {
    const errorText = await azureResponse.text();
    console.error('Azure ML API error:', azureResponse.status, errorText);
    throw new Error(`Azure ML API error: ${azureResponse.status}`);
  }

  const azureResult = await azureResponse.json();
  const predictions = azureResult.output || azureResult.predictions || azureResult;
  
  const gradingResult = {
    ai_grade: predictions.grade || predictions[0]?.grade || 'Standard',
    quality_score: predictions.quality_score || predictions[0]?.quality_score || 85,
    crop_health_score: predictions.crop_health_score || predictions[0]?.crop_health_score || 80,
    esg_score: predictions.esg_score || predictions[0]?.esg_score || 75,
    color_score: predictions.color_score || predictions[0]?.color_score || 85,
    texture_score: predictions.texture_score || predictions[0]?.texture_score || 80,
    moisture_score: predictions.moisture_score || predictions[0]?.moisture_score || 75,
    defects_detected: predictions.defects_detected || predictions[0]?.defects || [],
    recommendations: predictions.recommendations || predictions[0]?.recommendations || [],
    confidence: predictions.confidence || predictions[0]?.confidence || 85,
  };

  return new Response(
    JSON.stringify({
      success: true,
      source: 'azure_ml',
      batch_id: batchId,
      ...gradingResult
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    }
  );
}
