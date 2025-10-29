import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportRequest {
  report_type: 'customs' | 'excise' | 'gst' | 'compliance_summary';
  region: string;
  start_date: string;
  end_date: string;
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

    const { report_type, region, start_date, end_date }: ReportRequest = await req.json();

    console.log('Generating report:', { report_type, region, start_date, end_date });

    const reportData: any = {
      report_type,
      region,
      period: { start: start_date, end: end_date },
      generated_at: new Date().toISOString(),
      summary: {}
    };

    // Fetch compliance documents for the region and period
    const { data: documents, error: docError } = await supabase
      .from('compliance_documents')
      .select('*')
      .eq('region', region)
      .gte('created_at', start_date)
      .lte('created_at', end_date);

    if (docError) {
      console.error('Error fetching documents:', docError);
      throw docError;
    }

    // Fetch shipments for the region and period
    const { data: shipments, error: shipError } = await supabase
      .from('shipments')
      .select('*')
      .gte('created_at', start_date)
      .lte('created_at', end_date);

    if (shipError) {
      console.error('Error fetching shipments:', shipError);
    }

    // Fetch compliance validations
    const { data: validations, error: valError } = await supabase
      .from('compliance_validations')
      .select('*')
      .gte('validated_at', start_date)
      .lte('validated_at', end_date);

    if (valError) {
      console.error('Error fetching validations:', valError);
    }

    // Generate report based on type
    if (report_type === 'customs') {
      reportData.summary = {
        total_shipments: shipments?.length || 0,
        total_customs_documents: documents?.filter(d => d.document_type === 'customs').length || 0,
        active_documents: documents?.filter(d => d.document_type === 'customs' && d.status === 'active').length || 0,
        expired_documents: documents?.filter(d => {
          return d.document_type === 'customs' && d.expiry_date && new Date(d.expiry_date) < new Date();
        }).length || 0
      };
      
      reportData.documents = documents?.filter(d => d.document_type === 'customs').map(d => ({
        document_number: d.document_number,
        entity_id: d.entity_id,
        entity_type: d.entity_type,
        issue_date: d.issue_date,
        expiry_date: d.expiry_date,
        status: d.status
      }));

      reportData.shipments = shipments?.map(s => ({
        id: s.id,
        from: s.from_location,
        to: s.to_location,
        status: s.status,
        departure: s.departure_time,
        arrival: s.actual_arrival
      }));
    }

    if (report_type === 'excise') {
      reportData.summary = {
        total_excise_documents: documents?.filter(d => d.document_type === 'excise').length || 0,
        active_documents: documents?.filter(d => d.document_type === 'excise' && d.status === 'active').length || 0,
        pending_documents: documents?.filter(d => d.document_type === 'excise' && d.status === 'pending').length || 0
      };

      reportData.documents = documents?.filter(d => d.document_type === 'excise').map(d => ({
        document_number: d.document_number,
        entity_id: d.entity_id,
        entity_type: d.entity_type,
        issue_date: d.issue_date,
        status: d.status
      }));
    }

    if (report_type === 'gst') {
      const gstDocs = documents?.filter(d => d.document_type === 'gst') || [];
      
      reportData.summary = {
        total_gst_documents: gstDocs.length,
        active_documents: gstDocs.filter(d => d.status === 'active').length,
        entities_covered: new Set(gstDocs.map(d => d.entity_id)).size
      };

      reportData.documents = gstDocs.map(d => ({
        document_number: d.document_number,
        entity_id: d.entity_id,
        entity_type: d.entity_type,
        issue_date: d.issue_date,
        status: d.status
      }));
    }

    if (report_type === 'compliance_summary') {
      const totalValidations = validations?.length || 0;
      const passedValidations = validations?.filter(v => v.validation_status === 'passed').length || 0;
      const failedValidations = validations?.filter(v => v.validation_status === 'failed').length || 0;
      const warningValidations = validations?.filter(v => v.validation_status === 'warning').length || 0;

      reportData.summary = {
        total_documents: documents?.length || 0,
        active_documents: documents?.filter(d => d.status === 'active').length || 0,
        expired_documents: documents?.filter(d => {
          return d.expiry_date && new Date(d.expiry_date) < new Date();
        }).length || 0,
        total_validations: totalValidations,
        passed_validations: passedValidations,
        failed_validations: failedValidations,
        warning_validations: warningValidations,
        compliance_rate: totalValidations > 0 ? ((passedValidations / totalValidations) * 100).toFixed(2) + '%' : '0%'
      };

      reportData.by_document_type = {};
      ['emd', 'bg', 'gst', 'tender', 'customs', 'excise'].forEach(type => {
        const typeDocs = documents?.filter(d => d.document_type === type) || [];
        reportData.by_document_type[type] = {
          total: typeDocs.length,
          active: typeDocs.filter(d => d.status === 'active').length,
          expired: typeDocs.filter(d => d.expiry_date && new Date(d.expiry_date) < new Date()).length
        };
      });

      reportData.recent_validations = validations?.slice(-10).map(v => ({
        entity_id: v.entity_id,
        entity_type: v.entity_type,
        validation_type: v.validation_type,
        status: v.validation_status,
        validated_at: v.validated_at
      }));
    }

    // Insert report into database
    const { data: report, error: reportError } = await supabase
      .from('regulatory_reports')
      .insert({
        report_type,
        region,
        report_period_start: start_date,
        report_period_end: end_date,
        report_data: reportData,
        generated_by: user.id,
        status: 'draft'
      })
      .select()
      .single();

    if (reportError) {
      console.error('Error inserting report:', reportError);
      throw reportError;
    }

    console.log('Report generated successfully:', report.id);

    return new Response(JSON.stringify({
      success: true,
      report: report,
      data: reportData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-regulatory-report function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});