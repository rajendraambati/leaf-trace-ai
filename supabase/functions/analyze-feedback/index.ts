import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    // Fetch feedback and usage data
    const [feedbackResult, usageResult] = await Promise.all([
      supabaseClient.from('user_feedback').select('*').order('created_at', { ascending: false }).limit(100),
      supabaseClient.from('ai_usage_analytics').select('*').order('created_at', { ascending: false }).limit(500)
    ]);

    if (feedbackResult.error) throw feedbackResult.error;
    if (usageResult.error) throw usageResult.error;

    const feedback = feedbackResult.data;
    const usage = usageResult.data;

    // Prepare analysis prompt
    const analysisPrompt = `You are an AI product analyst. Analyze the following user feedback and usage data to provide actionable insights:

FEEDBACK DATA:
${JSON.stringify(feedback.slice(0, 50), null, 2)}

USAGE ANALYTICS:
- Total AI requests: ${usage.length}
- Features used: ${[...new Set(usage.map(u => u.feature_type))].join(', ')}
- Success rate: ${((usage.filter(u => u.success).length / usage.length) * 100).toFixed(1)}%
- User acceptance rate: ${((usage.filter(u => u.user_accepted).length / usage.filter(u => u.user_accepted !== null).length) * 100).toFixed(1)}%

Provide:
1. **Top 3 Priority Enhancements**: Based on user feedback and usage patterns
2. **Model Performance Issues**: Any concerning trends in confidence scores or acceptance rates
3. **Feature Adoption Insights**: Which AI features need more promotion or improvement
4. **Retraining Recommendations**: Specific suggestions for improving model accuracy

Format as JSON:
{
  "priorities": [{ "title": "...", "reasoning": "...", "impact": "high|medium|low" }],
  "performance_issues": [{ "feature": "...", "issue": "...", "recommendation": "..." }],
  "adoption_insights": { "underutilized": ["..."], "popular": ["..."] },
  "retraining_recommendations": [{ "feature": "...", "suggestion": "...", "data_needed": "..." }]
}`;

    // Call AI for analysis
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert AI product analyst. Always respond with valid JSON.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error('Failed to analyze data with AI');
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices[0].message.content;
    
    // Parse JSON from response
    let analysis;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/) || analysisText.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : analysisText;
      analysis = JSON.parse(jsonString);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', analysisText);
      // Provide fallback structure
      analysis = {
        priorities: [],
        performance_issues: [],
        adoption_insights: { underutilized: [], popular: [] },
        retraining_recommendations: []
      };
    }

    // Log the analysis for audit purposes
    await supabaseClient.from('audit_logs').insert({
      action: 'AI_ANALYSIS',
      resource: 'feedback_analysis',
      data_snapshot: analysis
    });

    return new Response(JSON.stringify({
      success: true,
      analysis,
      metadata: {
        feedback_count: feedback.length,
        usage_count: usage.length,
        analyzed_at: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-feedback function:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
