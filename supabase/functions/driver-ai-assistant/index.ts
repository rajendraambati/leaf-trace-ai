import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { message, shipment_id, context } = await req.json();

    // Get shipment details if provided
    let shipmentInfo = "";
    if (shipment_id) {
      const { data: shipment } = await supabase
        .from("shipments")
        .select("*")
        .eq("id", shipment_id)
        .single();

      if (shipment) {
        shipmentInfo = `
Current Shipment:
- ID: ${shipment.id}
- From: ${shipment.from_location}
- To: ${shipment.to_location}
- Status: ${shipment.status}
- ETA: ${shipment.eta || "Not calculated"}
- Vehicle: ${shipment.vehicle_id || "Not assigned"}
`;
      }
    }

    // Build conversation context
    const conversationHistory = context
      ?.map((msg: any) => `${msg.role}: ${msg.content}`)
      .join("\n") || "";

    const systemPrompt = `You are a helpful AI assistant for delivery drivers. You help with:
- Route guidance and directions
- Delivery procedures and best practices
- Vehicle and cargo safety
- Traffic and weather information
- Documentation requirements
- Emergency procedures

${shipmentInfo}

Be concise, practical, and supportive. Prioritize driver safety and successful deliveries.`;

    const userPrompt = `${conversationHistory}\n\nuser: ${message}`;

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
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add credits to your workspace." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const txt = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, txt);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiJson = await aiResp.json();
    const reply = aiJson.choices?.[0]?.message?.content ?? "I'm here to help! Could you clarify your question?";

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Driver AI assistant error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        reply: "I'm having trouble responding right now. Please try again." 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
