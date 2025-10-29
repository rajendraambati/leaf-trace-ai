import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { region, productType, forecastDays = 30 } = await req.json();

    // Fetch historical data
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 365); // Last year

    const { data: historicalBatches } = await supabase
      .from('procurement_batches')
      .select('quantity_kg, procurement_date, grade')
      .gte('procurement_date', startDate.toISOString())
      .order('procurement_date');

    const { data: historicalShipments } = await supabase
      .from('shipments')
      .select('batch_id, from_location, to_location, departure_time, actual_arrival')
      .gte('departure_time', startDate.toISOString());

    // Prepare data for AI analysis
    const historicalSummary = {
      totalBatches: historicalBatches?.length || 0,
      totalQuantity: historicalBatches?.reduce((sum, b) => sum + (Number(b.quantity_kg) || 0), 0) || 0,
      avgMonthlyQuantity: 0,
      seasonalPatterns: {},
      monthlyBreakdown: {}
    };

    // Calculate monthly breakdown
    const monthlyData: Record<number, { count: number; quantity: number }> = {};
    historicalBatches?.forEach(batch => {
      const month = new Date(batch.procurement_date).getMonth();
      if (!monthlyData[month]) {
        monthlyData[month] = { count: 0, quantity: 0 };
      }
      monthlyData[month].count++;
      monthlyData[month].quantity += Number(batch.quantity_kg) || 0;
    });
    historicalSummary.monthlyBreakdown = monthlyData;
    historicalSummary.avgMonthlyQuantity = historicalSummary.totalQuantity / Math.max(Object.keys(monthlyData).length, 1);

    // Call Lovable AI for forecasting
    const aiPrompt = `You are a demand forecasting expert for agricultural supply chains.

Analyze this historical tobacco procurement data and generate a ${forecastDays}-day demand forecast:

Historical Data (past 12 months):
- Total batches: ${historicalSummary.totalBatches}
- Total quantity: ${historicalSummary.totalQuantity} kg
- Average monthly: ${Math.round(historicalSummary.avgMonthlyQuantity)} kg
- Monthly breakdown: ${JSON.stringify(historicalSummary.monthlyBreakdown)}

Region: ${region || 'All regions'}
Product Type: ${productType || 'All grades'}

Consider:
1. Seasonal trends (harvest seasons, holidays)
2. Historical patterns from monthly data
3. Growing cycles and agricultural patterns
4. Market demand fluctuations

Generate daily forecasts for the next ${forecastDays} days with:
- Predicted quantity in kg
- Confidence level (0-100%)
- Seasonal factor (multiplier)
- Reasoning for predictions

Return as JSON array with format:
[{
  "date": "YYYY-MM-DD",
  "predicted_quantity_kg": number,
  "confidence_score": number,
  "seasonal_factor": number,
  "reasoning": "brief explanation"
}]`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: aiPrompt }
        ],
        temperature: 0.3
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      throw new Error(`AI forecasting failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const forecastText = aiData.choices[0].message.content;
    
    // Extract JSON from response
    let forecasts = [];
    try {
      const jsonMatch = forecastText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        forecasts = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      // Generate simple forecasts as fallback
      const dailyAvg = historicalSummary.avgMonthlyQuantity / 30;
      for (let i = 0; i < forecastDays; i++) {
        const forecastDate = new Date();
        forecastDate.setDate(forecastDate.getDate() + i);
        const seasonalFactor = 1 + (Math.sin(forecastDate.getMonth() / 12 * Math.PI * 2) * 0.3);
        forecasts.push({
          date: forecastDate.toISOString().split('T')[0],
          predicted_quantity_kg: Math.round(dailyAvg * seasonalFactor),
          confidence_score: 0.7,
          seasonal_factor: seasonalFactor,
          reasoning: 'Based on historical average with seasonal adjustment'
        });
      }
    }

    // Store forecasts in database
    const forecastRecords = forecasts.map((f: any) => ({
      region: region || 'all',
      product_type: productType || 'all',
      forecast_date: f.date,
      predicted_quantity_kg: f.predicted_quantity_kg,
      confidence_score: f.confidence_score,
      seasonal_factor: f.seasonal_factor,
      historical_avg: historicalSummary.avgMonthlyQuantity / 30,
      model_version: 'gemini-2.5-flash-v1',
      metadata: { reasoning: f.reasoning }
    }));

    // Upsert forecasts
    for (const record of forecastRecords) {
      await supabase
        .from('demand_forecasts')
        .upsert(record, { onConflict: 'region,product_type,forecast_date' });
    }

    return new Response(JSON.stringify({
      success: true,
      forecasts: forecastRecords,
      summary: {
        totalForecasted: forecasts.reduce((sum: number, f: any) => sum + f.predicted_quantity_kg, 0),
        avgDaily: forecasts.reduce((sum: number, f: any) => sum + f.predicted_quantity_kg, 0) / forecasts.length,
        avgConfidence: forecasts.reduce((sum: number, f: any) => sum + f.confidence_score, 0) / forecasts.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Demand forecasting error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});