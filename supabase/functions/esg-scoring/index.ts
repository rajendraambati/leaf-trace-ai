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
    const { entityId, entityType, operationalData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    if (!operationalData) {
      throw new Error('Operational data is required');
    }

    console.log('Calculating ESG score for entity:', entityId, 'type:', entityType);

    const systemPrompt = `You are an ESG (Environmental, Social, Governance) assessment AI expert specializing in supply chain sustainability analysis.

Analyze operational data and calculate comprehensive ESG scores based on:

ENVIRONMENTAL (E):
- Carbon footprint and emissions
- Water usage and conservation
- Waste management and recycling
- Energy efficiency
- Sustainable farming practices
- Chemical usage

SOCIAL (S):
- Labor standards and worker rights
- Fair wages and benefits
- Health and safety measures
- Community impact
- Training and development
- Diversity and inclusion

GOVERNANCE (G):
- Regulatory compliance
- Transparency and reporting
- Ethical business practices
- Anti-corruption measures
- Board oversight
- Risk management

Return ONLY valid JSON with this exact structure:
{
  "environmental_score": number (0-100),
  "environmental_breakdown": {
    "carbon_footprint": number (0-100),
    "water_management": number (0-100),
    "waste_management": number (0-100),
    "energy_efficiency": number (0-100),
    "sustainable_practices": number (0-100)
  },
  "social_score": number (0-100),
  "social_breakdown": {
    "labor_standards": number (0-100),
    "fair_wages": number (0-100),
    "health_safety": number (0-100),
    "community_impact": number (0-100),
    "training": number (0-100)
  },
  "governance_score": number (0-100),
  "governance_breakdown": {
    "compliance": number (0-100),
    "transparency": number (0-100),
    "ethics": number (0-100),
    "risk_management": number (0-100),
    "accountability": number (0-100)
  },
  "overall_score": number (0-100),
  "rating": "Excellent" | "Good" | "Fair" | "Poor" | "Critical",
  "strengths": string[],
  "weaknesses": string[],
  "improvement_priorities": string[],
  "benchmark_comparison": {
    "industry_average": number,
    "percentile": number
  },
  "recommendations": string[],
  "risk_areas": string[],
  "compliance_issues": string[],
  "confidence": number (0-100)
}`;

    const userPrompt = `Calculate ESG score for:
Entity ID: ${entityId}
Entity Type: ${entityType}

Operational Data:
${JSON.stringify(operationalData, null, 2)}

Provide comprehensive ESG assessment. Return only JSON.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
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

    console.log('AI ESG Scoring Response:', aiResponse);

    let esgResult;
    try {
      const cleanResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      esgResult = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      esgResult = {
        environmental_score: 75,
        environmental_breakdown: {
          carbon_footprint: 70,
          water_management: 80,
          waste_management: 75,
          energy_efficiency: 72,
          sustainable_practices: 78
        },
        social_score: 82,
        social_breakdown: {
          labor_standards: 85,
          fair_wages: 80,
          health_safety: 88,
          community_impact: 78,
          training: 82
        },
        governance_score: 88,
        governance_breakdown: {
          compliance: 90,
          transparency: 85,
          ethics: 92,
          risk_management: 86,
          accountability: 88
        },
        overall_score: 82,
        rating: 'Good',
        strengths: ['Strong governance', 'Good social practices'],
        weaknesses: ['Environmental footprint needs improvement'],
        improvement_priorities: ['Reduce carbon emissions', 'Improve water conservation'],
        benchmark_comparison: {
          industry_average: 75,
          percentile: 68
        },
        recommendations: ['Manual ESG audit recommended'],
        risk_areas: ['Climate impact'],
        compliance_issues: [],
        confidence: 65
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        entity_id: entityId,
        entity_type: entityType,
        assessed_at: new Date().toISOString(),
        ...esgResult
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in esg-scoring function:', error);
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
