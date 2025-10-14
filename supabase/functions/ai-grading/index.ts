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
    const { imageUrl } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    if (!imageUrl) {
      throw new Error('Image URL is required');
    }

    console.log('Analyzing tobacco image:', imageUrl);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: `You are an expert tobacco quality grading AI. Analyze tobacco leaf images and provide detailed assessments. 
            
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
              { type: 'text', text: 'Analyze this tobacco leaf sample and provide detailed grading. Return only JSON.' },
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

    console.log('AI Response:', aiResponse);

    // Parse AI response
    let gradingResult;
    try {
      // Remove markdown code blocks if present
      const cleanResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      gradingResult = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      // Fallback result
      gradingResult = {
        ai_grade: 'Standard',
        quality_score: 75,
        crop_health_score: 80,
        esg_score: 70,
        color_score: 75,
        texture_score: 80,
        moisture_score: 70,
        defects_detected: ['Unable to fully analyze'],
        recommendations: ['Manual inspection recommended'],
        confidence: 60
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...gradingResult
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

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
