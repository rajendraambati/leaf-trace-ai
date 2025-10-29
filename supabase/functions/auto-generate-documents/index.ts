import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutoGenerateRequest {
  trigger_type: 'shipment_created' | 'batch_approved' | 'delivery_confirmed' | 'scheduled';
  entity_id: string;
  entity_type: 'batch' | 'shipment' | 'order';
  document_types?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const request: AutoGenerateRequest = await req.json();
    
    console.log('Auto-generating documents:', request);

    const generatedDocuments = [];
    const documentTypes = request.document_types || getDefaultDocuments(request.trigger_type);

    // Generate each document type
    for (const docType of documentTypes) {
      try {
        // Get template
        const { data: template } = await supabase
          .from('document_templates')
          .select('*')
          .eq('template_type', docType)
          .eq('is_active', true)
          .limit(1)
          .single();

        if (!template) {
          console.log(`No template found for ${docType}, skipping`);
          continue;
        }

        // Fetch entity data
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
            .select('*, procurement_batches(*, farmers(*))')
            .eq('id', request.entity_id)
            .single();
          entityData = data;
        }

        if (!entityData) {
          console.log(`Entity not found: ${request.entity_id}`);
          continue;
        }

        // Generate document number
        const timestamp = Date.now();
        const documentNumber = `${docType.toUpperCase().replace('_', '-')}-${timestamp}`;

        // Generate QR code data
        const qrCodeData = JSON.stringify({
          document_number: documentNumber,
          entity_id: request.entity_id,
          entity_type: request.entity_type,
          generated_at: new Date().toISOString(),
          verification_url: `${supabaseUrl}/verify/${documentNumber}`
        });

        // Build document data based on type
        let documentData: any = buildDocumentData(docType, entityData, request);

        // Insert document
        const { data: document, error: docError } = await supabase
          .from('generated_documents')
          .insert({
            document_type: docType,
            document_number: documentNumber,
            template_id: template.id,
            entity_id: request.entity_id,
            entity_type: request.entity_type,
            document_data: documentData,
            qr_code_data: qrCodeData,
            status: 'generated',
            metadata: {
              auto_generated: true,
              trigger_type: request.trigger_type,
              generated_at: new Date().toISOString()
            }
          })
          .select()
          .single();

        if (docError) {
          console.error(`Error generating ${docType}:`, docError);
          continue;
        }

        generatedDocuments.push(document);
        console.log(`Generated document: ${documentNumber}`);

      } catch (error) {
        console.error(`Error processing ${docType}:`, error);
      }
    }

    // Log automation event
    await supabase.from('audit_logs').insert({
      action: 'AUTO_DOCUMENT_GENERATION',
      resource: 'generated_documents',
      resource_id: request.entity_id,
      data_snapshot: {
        trigger_type: request.trigger_type,
        documents_generated: generatedDocuments.length,
        document_numbers: generatedDocuments.map(d => d.document_number)
      }
    });

    return new Response(JSON.stringify({
      success: true,
      documents_generated: generatedDocuments.length,
      documents: generatedDocuments
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in auto-generate-documents function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getDefaultDocuments(triggerType: string): string[] {
  switch (triggerType) {
    case 'shipment_created':
      return ['dispatch_manifest', 'packing_list'];
    case 'batch_approved':
      return ['tpd_label', 'invoice'];
    case 'delivery_confirmed':
      return ['invoice'];
    default:
      return [];
  }
}

function buildDocumentData(docType: string, entityData: any, request: any): any {
  const documentNumber = `${docType.toUpperCase().replace('_', '-')}-${Date.now()}`;
  
  switch (docType) {
    case 'tpd_label':
      return {
        product_name: 'Tobacco Product',
        batch_number: entityData.id,
        health_warning: 'Smoking kills - quit now',
        nicotine_content: entityData?.metadata?.nicotine_content || 'N/A',
        manufacture_date: entityData?.procurement_date || entityData?.created_at,
        expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        manufacturer_info: 'LeafTrace Supply Chain'
      };

    case 'dispatch_manifest':
      return {
        manifest_number: documentNumber,
        dispatch_date: new Date().toISOString(),
        origin: entityData?.from_location || 'Origin',
        destination: entityData?.to_location || 'Destination',
        vehicle_info: {
          vehicle_id: entityData?.vehicle_id,
          driver_name: entityData?.driver_name
        },
        batch_details: {
          batch_id: entityData?.batch_id || entityData?.id,
          quantity_kg: entityData?.procurement_batches?.quantity_kg || entityData?.quantity_kg,
          grade: entityData?.procurement_batches?.grade || entityData?.grade
        },
        compliance_docs: ['EMD', 'BG', 'GST', 'Tender']
      };

    case 'invoice':
      const subtotal = entityData?.total_price || 0;
      const gstRate = 18;
      const gstAmount = (subtotal * gstRate) / 100;
      const total = subtotal + gstAmount;

      return {
        invoice_number: documentNumber,
        invoice_date: new Date().toISOString(),
        customer_info: {
          name: entityData?.farmers?.name || entityData?.procurement_batches?.farmers?.name || 'Customer',
          location: entityData?.farmers?.location || entityData?.procurement_batches?.farmers?.location || 'Location',
          phone: entityData?.farmers?.phone || entityData?.procurement_batches?.farmers?.phone
        },
        subtotal,
        gst_rate: gstRate,
        gst_amount: gstAmount,
        total,
        payment_terms: 'Net 30 days'
      };

    case 'packing_list':
      return {
        list_number: documentNumber,
        shipment_id: entityData?.id,
        package_count: 1,
        total_weight: entityData?.procurement_batches?.quantity_kg || entityData?.quantity_kg || 0,
        package_details: [],
        handling_instructions: 'Handle with care. Keep dry.'
      };

    default:
      return {};
  }
}