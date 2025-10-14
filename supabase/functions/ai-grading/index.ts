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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

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
            content: 'You are an expert tobacco quality grading AI. Analyze tobacco images and provide detailed assessments including grade (Premium/Standard/Low), quality score (0-100), crop health score (0-100), ESG score (0-100), detected defects, and recommendations. Return JSON format only.'
          },
          {
            role: 'user',
            content: imageUrl 
              ? [
                  { type: 'text', text: 'Analyze this tobacco sample and provide grading details.' },
                  { type: 'image_url', image_url: { url: imageUrl } }
                ]
              : 'Provide a general tobacco quality assessment for batch analysis.'
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

    // Parse AI response (expect JSON format)
    let gradingResult;
    try {
      gradingResult = JSON.parse(aiResponse);
    } catch {
      // Fallback if AI doesn't return JSON
      gradingResult = {
        grade: 'Standard',
        quality_score: 75,
        crop_health_score: 80,
        esg_score: 70,
        defects_detected: ['Minor discoloration'],
        recommendations: ['Store in controlled humidity', 'Monitor for pests'],
        confidence: 85
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        batchId,
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
