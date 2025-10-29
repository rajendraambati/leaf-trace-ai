import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { trips, vehicles, driverWellbeing } = await req.json();

    // Calculate statistics
    const activeTrips = trips.filter((t: any) => t.status === 'in-transit').length;
    const delayedTrips = trips.filter((t: any) => t.estimated_delay_minutes > 30).length;
    const moodScores = driverWellbeing
      .map((d: any) => d.mood_rating)
      .filter((m: number) => m !== null);
    const averageMood = moodScores.length > 0 
      ? moodScores.reduce((a: number, b: number) => a + b, 0) / moodScores.length 
      : 0;

    // Build context for AI
    const context = `
Fleet Operations Summary:
- Total Active Trips: ${trips.length}
- In-Transit: ${activeTrips}
- Delayed Trips (>30min): ${delayedTrips}
- Total Vehicles: ${vehicles.length}
- Active Vehicles: ${vehicles.filter((v: any) => v.status === 'active').length}
- Active Drivers: ${driverWellbeing.length}
- Average Driver Mood: ${averageMood.toFixed(1)}/5

Driver Wellbeing Concerns:
${driverWellbeing
  .filter((d: any) => d.mood_rating && d.mood_rating < 3)
  .map((d: any) => `- ${d.driver_name}: Mood ${d.mood_rating}/5, Fatigue ${d.fatigue_level}/5`)
  .join('\n') || '- No immediate concerns'}

Delayed Shipments:
${trips
  .filter((t: any) => t.estimated_delay_minutes > 30)
  .map((t: any) => `- ${t.id}: ${t.estimated_delay_minutes}min delay`)
  .join('\n') || '- No significant delays'}

Vehicle Status:
${vehicles
  .filter((v: any) => v.status !== 'active')
  .map((v: any) => `- ${v.registration}: ${v.status}`)
  .join('\n') || '- All vehicles operational'}
`;

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a logistics operations AI assistant. Analyze fleet data and provide:
1. Overall operational status (1 sentence)
2. Critical alerts (list up to 3 urgent issues)
3. Actionable recommendations (list 3-5 specific actions)

Focus on: driver safety, delivery efficiency, vehicle utilization, and proactive issue prevention.
Be concise and actionable.`
          },
          {
            role: "user",
            content: context
          }
        ],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${aiResp.status}`);
    }

    const aiJson = await aiResp.json();
    const aiText = aiJson.choices?.[0]?.message?.content || "Unable to generate summary";

    // Parse AI response (simple parsing, AI should follow format)
    const lines = aiText.split('\n').filter((l: string) => l.trim());
    const overallStatus = lines[0] || "Operations normal";
    
    const criticalAlerts: string[] = [];
    const recommendations: string[] = [];
    
    let section = 'status';
    for (const line of lines.slice(1)) {
      if (line.toLowerCase().includes('alert') || line.toLowerCase().includes('critical')) {
        section = 'alerts';
        continue;
      }
      if (line.toLowerCase().includes('recommendation') || line.toLowerCase().includes('action')) {
        section = 'recommendations';
        continue;
      }
      
      const cleanLine = line.replace(/^[-•*\d.]+\s*/, '').trim();
      if (cleanLine) {
        if (section === 'alerts' && criticalAlerts.length < 3) {
          criticalAlerts.push(cleanLine);
        } else if (section === 'recommendations' && recommendations.length < 5) {
          recommendations.push(cleanLine);
        }
      }
    }

    return new Response(
      JSON.stringify({
        overall_status: overallStatus,
        critical_alerts: criticalAlerts,
        recommendations: recommendations,
        statistics: {
          active_trips: activeTrips,
          delayed_trips: delayedTrips,
          average_mood: averageMood
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Dispatcher summary error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
