import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userRole } = await req.json();
    console.log("Received message:", message, "Role:", userRole);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch relevant data based on message content
    const context = await gatherContext(supabase, message, userRole);

    // Build system prompt with empathetic guidelines
    const systemPrompt = buildSystemPrompt(userRole, context);

    // Build messages with action suggestions
    const userPrompt = `${message}

Based on my query, if there are specific actions I can take (like viewing order details, checking vehicle status, marking shipment status, etc.), please suggest them at the end of your response in the format:
ACTIONS: [{"label": "Action Name", "action": "action_type", "params": {...}}]

Available actions:
- get_order_details: View order details (needs orderId)
- get_vehicle_status: Check vehicle status (needs vehicleId)
- mark_shipment_in_transit: Mark shipment in transit (needs shipmentId)
- confirm_delivery: Confirm delivery (needs shipmentId)
- get_warehouse_stock: Check warehouse stock (needs warehouseId)
- list_pending_documents: View pending documents`;

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          reply: "I'm experiencing high demand right now. Please try again in a moment." 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    let reply = data.choices[0]?.message?.content || "I'm having trouble processing that right now.";
    
    // Extract actions if present
    let actions = [];
    const actionsMatch = reply.match(/ACTIONS:\s*(\[.*?\])/s);
    if (actionsMatch) {
      try {
        actions = JSON.parse(actionsMatch[1]);
        // Remove the ACTIONS section from the reply
        reply = reply.replace(/ACTIONS:\s*\[.*?\]/s, '').trim();
      } catch (e) {
        console.error('Failed to parse actions:', e);
      }
    }

    return new Response(
      JSON.stringify({ reply, actions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        reply: "I apologize, but I'm experiencing technical difficulties. Please try again or contact support if this persists." 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function gatherContext(supabase: any, message: string, userRole: string) {
  const context: any = {};
  const lowerMessage = message.toLowerCase();

  // Dispatch history queries
  if (lowerMessage.includes('dispatch') || lowerMessage.includes('order')) {
    const orderMatch = message.match(/order\s+(\w+)/i) || message.match(/(\d+)/);
    if (orderMatch) {
      const orderId = orderMatch[1];
      const { data: orders } = await supabase
        .from('erp_procurement_orders')
        .select('*, warehouse_dispatches(*)')
        .or(`id.eq.${orderId},order_number.ilike.%${orderId}%`)
        .limit(5);
      context.orders = orders || [];
    }
  }

  // Compliance/BG validation queries
  if (lowerMessage.includes('validate') || lowerMessage.includes('bg') || lowerMessage.includes('bank guarantee')) {
    const entityMatch = message.match(/for\s+(.+?)(?:\?|$)/i);
    if (entityMatch) {
      const entityName = entityMatch[1].trim();
      const { data: compliance } = await supabase
        .from('compliance_documents')
        .select('*')
        .ilike('entity_name', `%${entityName}%`)
        .limit(5);
      context.compliance = compliance || [];
    }
  }

  // Vehicle maintenance queries
  if (lowerMessage.includes('vehicle') || lowerMessage.includes('service') || lowerMessage.includes('maintenance')) {
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('*, vehicle_maintenance(*)')
      .order('next_maintenance_date', { ascending: true })
      .limit(10);
    context.vehicles = vehicles || [];
  }

  // Shipments data
  if (lowerMessage.includes('shipment') || lowerMessage.includes('delivery')) {
    const { data: shipments } = await supabase
      .from('shipments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    context.shipments = shipments || [];
  }

  // Regulatory reports
  if (lowerMessage.includes('report') || lowerMessage.includes('regulatory')) {
    const { data: reports } = await supabase
      .from('regulatory_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    context.reports = reports || [];
  }

  // Document queries
  if (lowerMessage.includes('document') || lowerMessage.includes('template') || lowerMessage.includes('generate')) {
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    context.documents = documents || [];
  }

  // Warehouse queries
  if (lowerMessage.includes('warehouse') || lowerMessage.includes('inventory') || lowerMessage.includes('stock')) {
    const { data: warehouses } = await supabase
      .from('warehouses')
      .select('*')
      .limit(10);
    context.warehouses = warehouses || [];
  }

  return context;
}

function buildSystemPrompt(userRole: string, context: any) {
  const roleContextMap: Record<string, string> = {
    'dispatcher': 'You are a helpful assistant for dispatchers managing logistics operations.',
    'compliance_officer': 'You are a helpful assistant for compliance officers managing regulatory requirements.',
    'document_manager': 'You are a helpful assistant for document management and generation.',
    'warehouse_manager': 'You are a helpful assistant for warehouse and inventory management.'
  };

  const roleContext = roleContextMap[userRole] || 'You are a helpful assistant.';

  let prompt = `${roleContext}

EMPATHETIC COMMUNICATION GUIDELINES:
Always be supportive, professional, and proactive. When data is missing or unclear:

For Dispatch Queries:
- "I'm checking our system for Order [number], but I don't see it in recent records. It might have been completed already, or the order number might be slightly different. Can you double-check the order number?"
- "I don't have real-time data on Truck [number] right now. Would you like me to help you contact the driver directly?"
- "I see you're asking about [entity], but I don't have current dispatch records for them. This might mean they haven't had recent orders. Would you like me to check historical data?"

For Compliance Queries:
- "I'm looking for Bank Guarantee information for [entity], but I don't see any records yet. This might mean the documents haven't been uploaded to the system. Would you like guidance on how to submit them?"
- "I don't have compliance data for that entity in our system. It's possible they're registered under a different name. Can you provide any alternative names or IDs?"
- "I see you're checking compliance status, but the records appear incomplete. Let me help you identify what documentation is missing so you can follow up."

For Vehicle Maintenance:
- "I'm checking maintenance schedules, but I don't see any vehicles requiring service next week. That's good news! Would you like me to show the upcoming maintenance for the next month?"
- "I don't have current maintenance records for that vehicle. This might mean it's a new vehicle or the data hasn't been updated. Would you like me to help you create a maintenance schedule?"

For Document Queries:
- "I'm looking for documents matching your request, but I don't see any in the system yet. Would you like guidance on creating a new document or template?"
- "I don't have information about that specific document. It might have been archived or removed. Can you provide more details like the document type or creation date?"

For Warehouse Queries:
- "I'm checking inventory for that item, but I don't see current stock levels. This might mean the data needs to be updated. Would you like me to help you update the inventory?"
- "I don't have records for that warehouse location. Can you verify the warehouse name or ID?"

Always offer helpful alternatives and next steps when you can't find the exact information requested.

CURRENT DATA CONTEXT:
${JSON.stringify(context, null, 2)}

RESPONSE GUIDELINES:
- Be concise but friendly
- Provide specific data when available
- Offer empathetic alternatives when data is missing
- Suggest actionable next steps
- Use natural, conversational language
`;

  return prompt;
}
