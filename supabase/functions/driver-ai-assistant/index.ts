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

    // Generate contextual response
    let reply = "I'm your delivery assistant. I can help with:";
    reply += "\n• Route guidance and directions";
    reply += "\n• Delivery procedures";
    reply += "\n• Safety tips";
    reply += "\n• Documentation requirements";
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes("route") || lowerMessage.includes("direction") || lowerMessage.includes("how to get")) {
      reply = "Follow the route guidance on your map. The blue line shows your optimal path. Stay alert for traffic updates and follow all traffic rules. If you encounter issues, contact dispatch immediately.";
    } else if (lowerMessage.includes("delivery") || lowerMessage.includes("deliver") || lowerMessage.includes("drop off")) {
      reply = "Delivery procedure:\n1. Verify the delivery address\n2. Take a clear photo of the package at destination\n3. Get recipient name and signature\n4. Note any delivery issues\n5. Complete the delivery form in the app\n\nAlways ensure safe handling of goods.";
    } else if (lowerMessage.includes("safety") || lowerMessage.includes("safe")) {
      reply = "Safety first! Remember to:\n• Take regular breaks every 2 hours\n• Stay hydrated\n• Check weather conditions\n• Secure cargo properly\n• Report any vehicle issues immediately\n• Never drive when fatigued";
    } else if (lowerMessage.includes("delay") || lowerMessage.includes("late") || lowerMessage.includes("traffic")) {
      reply = "If you're experiencing delays:\n1. Update your status in the app\n2. Contact dispatch with your ETA\n3. Follow alternative route suggestions\n4. Keep customers informed\n5. Document the reason for delay";
    }

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
