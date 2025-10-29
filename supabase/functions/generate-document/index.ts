import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentGenerationRequest {
  document_type: 'tpd_label' | 'dispatch_manifest' | 'invoice' | 'customs_declaration' | 'packing_list';
  entity_id: string;
  entity_type: 'batch' | 'shipment' | 'order' | 'warehouse';
  template_id?: string;
  custom_data?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const request: DocumentGenerationRequest = await req.json();
    
    console.log('Generating document:', request);

    // Get template
    let template;
    if (request.template_id) {
      const { data: templateData } = await supabase
        .from('document_templates')
        .select('*')
        .eq('id', request.template_id)
        .single();
      template = templateData;
    } else {
      const { data: templateData } = await supabase
        .from('document_templates')
        .select('*')
        .eq('template_type', request.document_type)
        .eq('is_active', true)
        .limit(1)
        .single();
      template = templateData;
    }

    if (!template) {
      throw new Error('Template not found');
    }

    // Fetch entity data based on type
    let entityData: any = {};
    
    if (request.entity_type === 'batch') {
      const { data } = await supabase
        .from('procurement_batches')
        .select('*, farmers(*)')
        .eq('id', request.entity_id)
        .single();
      entityData = data;
    } else if (request.entity_type === 'shipment') {
      const { data } = await supabase
        .from('shipments')
        .select('*, procurement_batches(*)')
        .eq('id', request.entity_id)
        .single();
      entityData = data;
    }

    // Generate document number
    const timestamp = Date.now();
    const documentNumber = `${request.document_type.toUpperCase().replace('_', '-')}-${timestamp}`;

    // Generate QR code data
    const qrCodeData = JSON.stringify({
      document_number: documentNumber,
      entity_id: request.entity_id,
      entity_type: request.entity_type,
      generated_at: new Date().toISOString(),
      verification_url: `${supabaseUrl}/track/${documentNumber}`
    });

    // Build document data based on type
    let documentData: any = {};

    switch (request.document_type) {
      case 'tpd_label':
        documentData = {
          product_name: 'Tobacco Product',
          batch_number: request.entity_id,
          health_warning: template.template_config.health_warning_text,
          nicotine_content: entityData?.metadata?.nicotine_content || 'N/A',
          manufacture_date: entityData?.procurement_date || entityData?.created_at,
          expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          manufacturer_info: 'LeafTrace Supply Chain',
          ...request.custom_data
        };
        break;

      case 'dispatch_manifest':
        documentData = {
          manifest_number: documentNumber,
          dispatch_date: new Date().toISOString(),
          origin: entityData?.from_location || 'Origin',
          destination: entityData?.to_location || 'Destination',
          vehicle_info: {
            vehicle_id: entityData?.vehicle_id,
            driver_name: entityData?.driver_name
          },
          batch_details: {
            batch_id: entityData?.batch_id,
            quantity_kg: entityData?.procurement_batches?.quantity_kg,
            grade: entityData?.procurement_batches?.grade
          },
          compliance_docs: ['EMD', 'BG', 'GST', 'Tender'],
          ...request.custom_data
        };
        break;

      case 'invoice':
        const subtotal = entityData?.total_price || 0;
        const gstRate = 18; // 18% GST
        const gstAmount = (subtotal * gstRate) / 100;
        const total = subtotal + gstAmount;

        documentData = {
          invoice_number: documentNumber,
          invoice_date: new Date().toISOString(),
          customer_info: {
            name: entityData?.farmers?.name || 'Customer',
            location: entityData?.farmers?.location || 'Location',
            phone: entityData?.farmers?.phone
          },
          subtotal,
          gst_rate: gstRate,
          gst_amount: gstAmount,
          total,
          payment_terms: 'Net 30 days',
          ...request.custom_data
        };
        break;

      case 'customs_declaration':
        documentData = {
          declaration_number: documentNumber,
          consignor: 'LeafTrace Supply Chain',
          consignee: request.custom_data?.consignee || 'Consignee',
          goods_description: 'Tobacco Products',
          hs_code: '2401.20', // Tobacco products HS code
          quantity: entityData?.quantity_kg || 0,
          value: entityData?.total_price || 0,
          origin_country: 'India',
          destination_country: request.custom_data?.destination_country || 'India',
          ...request.custom_data
        };
        break;

      case 'packing_list':
        documentData = {
          list_number: documentNumber,
          shipment_id: request.entity_id,
          package_count: request.custom_data?.package_count || 1,
          total_weight: entityData?.quantity_kg || 0,
          package_details: request.custom_data?.package_details || [],
          handling_instructions: 'Handle with care. Keep dry.',
          ...request.custom_data
        };
        break;
    }

    // Insert document record
    const { data: document, error: docError } = await supabase
      .from('generated_documents')
      .insert({
        document_type: request.document_type,
        document_number: documentNumber,
        template_id: template.id,
        entity_id: request.entity_id,
        entity_type: request.entity_type,
        document_data: documentData,
        qr_code_data: qrCodeData,
        generated_by: user.id,
        status: 'generated'
      })
      .select()
      .single();

    if (docError) throw docError;

    // If invoice, create line items
    if (request.document_type === 'invoice' && request.custom_data?.line_items) {
      const lineItems = request.custom_data.line_items.map((item: any) => ({
        invoice_id: document.id,
        item_description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate || 18,
        tax_amount: (item.quantity * item.unit_price * (item.tax_rate || 18)) / 100,
        line_total: item.quantity * item.unit_price * (1 + (item.tax_rate || 18) / 100),
        batch_id: item.batch_id
      }));

      await supabase.from('invoice_line_items').insert(lineItems);
    }

    console.log('Document generated successfully:', documentNumber);

    return new Response(JSON.stringify({
      success: true,
      document,
      qr_code_data: qrCodeData,
      pdf_generation_url: `${supabaseUrl}/functions/v1/generate-document-pdf?document_id=${document.id}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-document function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});