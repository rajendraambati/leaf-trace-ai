import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ERPOrderPayload {
  po_number: string;
  product_type: string;
  quantity_kg: number;
  delivery_date: string;
  processing_unit_id?: string;
  source_system: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Received ERP integration request', { method: req.method });

    // Only accept POST requests for new orders
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST to submit orders.' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: ERPOrderPayload = await req.json();
    console.log('ERP order payload received:', payload);

    // Validation
    const validationErrors: string[] = [];

    if (!payload.po_number || typeof payload.po_number !== 'string' || payload.po_number.trim().length === 0) {
      validationErrors.push('PO number is required and must be a non-empty string');
    }

    if (!payload.product_type || typeof payload.product_type !== 'string' || payload.product_type.trim().length === 0) {
      validationErrors.push('Product type is required and must be a non-empty string');
    }

    if (!payload.quantity_kg || typeof payload.quantity_kg !== 'number' || payload.quantity_kg <= 0) {
      validationErrors.push('Quantity (kg) is required and must be a positive number');
    }

    if (!payload.delivery_date || typeof payload.delivery_date !== 'string') {
      validationErrors.push('Delivery date is required and must be a valid date string');
    } else {
      // Validate date format
      const deliveryDate = new Date(payload.delivery_date);
      if (isNaN(deliveryDate.getTime())) {
        validationErrors.push('Delivery date must be a valid ISO date string');
      }
    }

    if (!payload.source_system || typeof payload.source_system !== 'string' || payload.source_system.trim().length === 0) {
      validationErrors.push('Source system is required and must be a non-empty string');
    }

    // Check if processing unit exists if provided
    if (payload.processing_unit_id) {
      const { data: unitExists, error: unitError } = await supabase
        .from('processing_units')
        .select('id')
        .eq('id', payload.processing_unit_id)
        .maybeSingle();

      if (unitError) {
        console.error('Error checking processing unit:', unitError);
        validationErrors.push('Error validating processing unit');
      } else if (!unitExists) {
        validationErrors.push(`Processing unit with ID ${payload.processing_unit_id} not found`);
      }
    }

    // If validation errors exist, return error response
    if (validationErrors.length > 0) {
      console.log('Validation failed:', validationErrors);
      
      // Store failed order with validation errors
      await supabase.from('erp_procurement_orders').insert({
        po_number: payload.po_number || `INVALID-${Date.now()}`,
        product_type: payload.product_type || 'UNKNOWN',
        quantity_kg: payload.quantity_kg || 0,
        delivery_date: payload.delivery_date || new Date().toISOString(),
        processing_unit_id: payload.processing_unit_id,
        source_system: payload.source_system || 'UNKNOWN',
        status: 'rejected',
        validation_errors: { errors: validationErrors },
      });

      return new Response(
        JSON.stringify({
          success: false,
          errors: validationErrors,
          message: 'Order validation failed',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert the valid order
    const { data: orderData, error: orderError } = await supabase
      .from('erp_procurement_orders')
      .insert({
        po_number: payload.po_number,
        product_type: payload.product_type,
        quantity_kg: payload.quantity_kg,
        delivery_date: payload.delivery_date,
        processing_unit_id: payload.processing_unit_id,
        source_system: payload.source_system,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error inserting order:', orderError);
      
      // Check for duplicate PO number
      if (orderError.code === '23505') {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Duplicate PO number. This order has already been received.',
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to process order',
          details: orderError.message,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Order successfully stored:', orderData);

    // Create warehouse notifications for all active warehouses
    const { data: warehouses, error: warehousesError } = await supabase
      .from('warehouses')
      .select('id, name')
      .eq('status', 'active');

    if (!warehousesError && warehouses && warehouses.length > 0) {
      const notifications = warehouses.map((warehouse) => ({
        warehouse_id: warehouse.id,
        order_id: orderData.id,
        notification_type: 'new_order',
        message: `New ERP order received: PO ${payload.po_number} for ${payload.quantity_kg}kg of ${payload.product_type}. Delivery date: ${payload.delivery_date}`,
      }));

      const { error: notifError } = await supabase
        .from('warehouse_notifications')
        .insert(notifications);

      if (notifError) {
        console.error('Error creating warehouse notifications:', notifError);
      } else {
        console.log(`Created ${notifications.length} warehouse notifications`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Order received and processed successfully',
        order_id: orderData.id,
        po_number: payload.po_number,
        timestamp: new Date().toISOString(),
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in ERP integration:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: errorMessage,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});