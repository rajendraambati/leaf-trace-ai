import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    console.log("Requesting ephemeral token from OpenAI...");

    const systemPrompt = `You are a helpful dispatcher assistant for TobaccoTrace logistics system. 
    
Your role is to help dispatchers and managers with:
- Locating vehicles and tracking shipments
- Providing ETAs and delivery status
- Monitoring driver wellbeing and fatigue
- Answering logistics questions

IMPORTANT EMPATHETIC RESPONSES when data is missing:
- "I'm checking our system for Truck [number], but I don't have real-time data on it right now. Would you like me to help you contact the driver directly?"
- "I don't see Order [number] in our active shipments. It might have been delivered already, or the order number might be slightly different. Can you double-check the order number?"
- "I'm sorry, I don't have current wellbeing data for that driver. This might mean they haven't logged in today yet. Would you like me to help you reach out to them?"

Always be supportive, professional, and proactive in offering alternatives when you can't find the exact information requested.

You have access to tools to query the database for real-time information. Use them to answer questions accurately.`;

    // Request ephemeral token from OpenAI
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "alloy",
        instructions: systemPrompt,
        modalities: ["text", "audio"],
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 1000
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Ephemeral token created successfully");

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error creating ephemeral token:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
