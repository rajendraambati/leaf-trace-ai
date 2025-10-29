import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    
    if (!message) {
      throw new Error('Message is required');
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    // Initialize Supabase client for data queries
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log("Processing dispatcher query:", message);

    // Build context from database
    let contextData = "";

    // Query shipments for truck location and ETA
    const { data: shipments } = await supabase
      .from('shipments')
      .select('*')
      .in('status', ['pending', 'in-transit'])
      .limit(20);

    // Query vehicles
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('*')
      .limit(20);

    // Query driver wellbeing
    const { data: driverWellbeing } = await supabase
      .from('driver_wellbeing_logs')
      .select('*, shipments(driver_name)')
      .order('created_at', { ascending: false })
      .limit(20);

    // Build context string
    if (shipments && shipments.length > 0) {
      contextData += "\\n\\nACTIVE SHIPMENTS:\\n";
      shipments.forEach(s => {
        contextData += `- Shipment ${s.id}: Vehicle ${s.vehicle_id || 'N/A'}, Driver: ${s.driver_name || 'N/A'}, Status: ${s.status}, From: ${s.from_location}, To: ${s.to_location}, ETA: ${s.eta || 'N/A'}\\n`;
      });
    }

    if (vehicles && vehicles.length > 0) {
      contextData += "\\n\\nVEHICLES:\\n";
      vehicles.forEach(v => {
        contextData += `- ${v.registration_number}: Type: ${v.vehicle_type}, Status: ${v.status}, Location: ${v.current_latitude && v.current_longitude ? `${v.current_latitude}, ${v.current_longitude}` : 'N/A'}\\n`;
      });
    }

    if (driverWellbeing && driverWellbeing.length > 0) {
      contextData += "\\n\\nDRIVER WELLBEING:\\n";
      driverWellbeing.forEach(d => {
        const driverName = d.shipments?.driver_name || 'Unknown';
        contextData += `- ${driverName}: Mood: ${d.mood_rating || 'N/A'}/5, Fatigue: ${d.fatigue_level || 'N/A'}/5, Stress: ${d.stress_level || 'N/A'}/5\\n`;
      });
    }

    const systemPrompt = `You are a helpful dispatcher assistant for TobaccoTrace logistics system.

Current System Data:
${contextData}

IMPORTANT: Use the data above to answer questions. If you can't find specific information:
- For trucks: "I'm checking our system for Truck [number], but I don't have real-time data on it right now. Would you like me to help you contact the driver directly?"
- For orders: "I don't see Order [number] in our active shipments. It might have been delivered already, or the order number might be slightly different. Can you double-check the order number?"
- For drivers: "I'm sorry, I don't have current wellbeing data for that driver. This might mean they haven't logged in today yet. Would you like me to help you reach out to them?"

Be supportive, professional, and proactive in offering alternatives.`;

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemPrompt + '\n\nUser: ' + message }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || 
      "I'm having trouble right now. Please try again!";

    console.log("Assistant response generated");

    return new Response(JSON.stringify({ message: assistantMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      message: "I'm having trouble connecting right now. Please try again in a moment or use the voice feature."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
