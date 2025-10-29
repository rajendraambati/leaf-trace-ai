import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationRequest {
  entity_id: string;
  entity_type: 'batch' | 'shipment' | 'warehouse' | 'processing_unit' | 'farmer' | 'vehicle';
  validation_type: 'pre_dispatch' | 'customs' | 'excise' | 'manual';
  region?: string;
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

    const { entity_id, entity_type, validation_type, region }: ValidationRequest = await req.json();

    console.log('Validating compliance for:', { entity_id, entity_type, validation_type, region });

    // Define required documents based on validation type and region
    const requiredDocuments: string[] = [];
    
    if (validation_type === 'pre_dispatch') {
      requiredDocuments.push('emd', 'bg', 'gst', 'tender');
    }
    
    if (validation_type === 'customs') {
      requiredDocuments.push('customs', 'gst');
    }
    
    if (validation_type === 'excise') {
      requiredDocuments.push('excise', 'gst');
    }

    // Fetch existing documents for this entity
    const { data: documents, error: docError } = await supabase
      .from('compliance_documents')
      .select('*')
      .eq('entity_id', entity_id)
      .eq('entity_type', entity_type);

    if (docError) {
      console.error('Error fetching documents:', docError);
      throw docError;
    }

    console.log('Found documents:', documents?.length);

    const now = new Date();
    const missingDocuments: string[] = [];
    const expiredDocuments: string[] = [];
    const validationDetails: any = {
      checked_documents: [],
      warnings: []
    };

    // Check each required document
    for (const docType of requiredDocuments) {
      const doc = documents?.find(d => d.document_type === docType);
      
      if (!doc) {
        missingDocuments.push(docType);
        validationDetails.warnings.push(`Missing ${docType.toUpperCase()} document`);
      } else {
        validationDetails.checked_documents.push({
          type: docType,
          number: doc.document_number,
          status: doc.status,
          expiry: doc.expiry_date
        });

        // Check if document is expired
        if (doc.expiry_date && new Date(doc.expiry_date) < now) {
          expiredDocuments.push(docType);
          validationDetails.warnings.push(`${docType.toUpperCase()} document expired on ${doc.expiry_date}`);
        }

        // Check document status
        if (doc.status !== 'active') {
          validationDetails.warnings.push(`${docType.toUpperCase()} document status is ${doc.status}`);
        }
      }
    }

    // Determine validation status
    let validation_status: 'passed' | 'failed' | 'warning' = 'passed';
    
    if (missingDocuments.length > 0) {
      validation_status = 'failed';
      validationDetails.reason = 'Missing required documents';
    } else if (expiredDocuments.length > 0) {
      validation_status = 'failed';
      validationDetails.reason = 'Expired documents found';
    } else if (validationDetails.warnings.length > 0) {
      validation_status = 'warning';
      validationDetails.reason = 'Document warnings detected';
    }

    // Insert validation result
    const { data: validationResult, error: validationError } = await supabase
      .from('compliance_validations')
      .insert({
        entity_id,
        entity_type,
        validation_type,
        validation_status,
        required_documents: requiredDocuments,
        missing_documents: missingDocuments,
        expired_documents: expiredDocuments,
        validation_details: validationDetails,
        validated_by: user.id
      })
      .select()
      .single();

    if (validationError) {
      console.error('Error inserting validation:', validationError);
      throw validationError;
    }

    // If this is a pre-dispatch validation for a shipment, create dispatch compliance check
    if (validation_type === 'pre_dispatch' && entity_type === 'shipment') {
      const blockingIssues: string[] = [];
      const warnings: string[] = [];
      
      if (missingDocuments.length > 0) {
        blockingIssues.push(`Missing documents: ${missingDocuments.join(', ')}`);
      }
      
      if (expiredDocuments.length > 0) {
        blockingIssues.push(`Expired documents: ${expiredDocuments.join(', ')}`);
      }
      
      validationDetails.warnings.forEach((w: string) => warnings.push(w));

      const complianceStatus = blockingIssues.length > 0 ? 'blocked' : 
                               warnings.length > 0 ? 'warning' : 'cleared';

      const { error: checkError } = await supabase
        .from('dispatch_compliance_checks')
        .insert({
          shipment_id: entity_id,
          compliance_status: complianceStatus,
          blocking_issues: blockingIssues,
          warnings: warnings,
          cleared_by: complianceStatus === 'cleared' ? user.id : null,
          cleared_at: complianceStatus === 'cleared' ? new Date().toISOString() : null,
          metadata: { validation_id: validationResult.id }
        });

      if (checkError) {
        console.error('Error creating dispatch compliance check:', checkError);
      }
    }

    console.log('Validation completed:', validation_status);

    return new Response(JSON.stringify({
      success: true,
      validation: validationResult,
      status: validation_status,
      missing_documents: missingDocuments,
      expired_documents: expiredDocuments,
      warnings: validationDetails.warnings
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in compliance-validation function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});