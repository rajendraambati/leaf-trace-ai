import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportSubmissionRequest {
  authority_id: string;
  report_type: string;
  period_start: string;
  period_end: string;
  entity_ids?: string[];
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

    const request: ReportSubmissionRequest = await req.json();
    
    console.log('Submitting compliance report:', request);

    // Get authority details
    const { data: authority, error: authError } = await supabase
      .from('reporting_authorities')
      .select('*, countries(*)')
      .eq('id', request.authority_id)
      .single();

    if (authError || !authority) {
      throw new Error('Reporting authority not found');
    }

    // Gather report data based on report type and period
    const reportData = await gatherReportData(
      supabase,
      request.report_type,
      request.period_start,
      request.period_end,
      authority.country_id,
      request.entity_ids
    );

    // Generate report number
    const reportNumber = `${authority.authority_code}-${request.report_type.toUpperCase()}-${Date.now()}`;

    // Create compliance report
    const { data: report, error: reportError } = await supabase
      .from('compliance_reports')
      .insert({
        report_number: reportNumber,
        authority_id: request.authority_id,
        country_id: authority.country_id,
        report_type: request.report_type,
        report_period_start: request.period_start,
        report_period_end: request.period_end,
        report_data: reportData,
        submission_status: 'draft',
        submitted_by: user.id
      })
      .select()
      .single();

    if (reportError) throw reportError;

    // Submit to authority endpoint if configured
    let submissionResponse = null;
    if (authority.endpoint_url && authority.is_active) {
      try {
        submissionResponse = await submitToAuthority(
          authority.endpoint_url,
          reportData,
          authority.authentication_method,
          authority.api_key_name,
          authority.report_format
        );

        // Update report status
        await supabase
          .from('compliance_reports')
          .update({
            submission_status: 'submitted',
            submitted_at: new Date().toISOString(),
            response_data: submissionResponse
          })
          .eq('id', report.id);

      } catch (error) {
        console.error('Error submitting to authority:', error);
        await supabase
          .from('compliance_reports')
          .update({
            submission_status: 'failed',
            response_data: { error: error instanceof Error ? error.message : 'Submission failed' }
          })
          .eq('id', report.id);
      }
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'COMPLIANCE_REPORT_SUBMITTED',
      resource: 'compliance_reports',
      resource_id: report.id,
      data_snapshot: {
        report_number: reportNumber,
        authority: authority.authority_name,
        report_type: request.report_type,
        period: `${request.period_start} to ${request.period_end}`
      }
    });

    console.log('Compliance report created:', reportNumber);

    return new Response(JSON.stringify({
      success: true,
      report,
      submission_response: submissionResponse
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in submit-compliance-report function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function gatherReportData(
  supabase: any,
  reportType: string,
  startDate: string,
  endDate: string,
  countryId: string,
  entityIds?: string[]
): Promise<any> {
  const reportData: any = {
    report_type: reportType,
    period: { start: startDate, end: endDate },
    country_id: countryId,
    generated_at: new Date().toISOString()
  };

  // Fetch shipments
  let shipmentsQuery = supabase
    .from('shipments')
    .select('*, procurement_batches(*, farmers(*))')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (entityIds && entityIds.length > 0) {
    shipmentsQuery = shipmentsQuery.in('id', entityIds);
  }

  const { data: shipments } = await shipmentsQuery;

  // Fetch batches
  const { data: batches } = await supabase
    .from('procurement_batches')
    .select('*, farmers(*)')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  // Fetch documents
  const { data: documents } = await supabase
    .from('generated_documents')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  reportData.summary = {
    total_shipments: shipments?.length || 0,
    total_batches: batches?.length || 0,
    total_documents: documents?.length || 0,
    total_quantity_kg: batches?.reduce((sum: number, b: any) => sum + (b.quantity_kg || 0), 0) || 0
  };

  reportData.shipments = shipments || [];
  reportData.batches = batches || [];
  reportData.documents = documents || [];

  return reportData;
}

async function submitToAuthority(
  endpointUrl: string,
  reportData: any,
  authMethod: string,
  apiKeyName: string,
  format: string
): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': format === 'json' ? 'application/json' : 
                    format === 'xml' ? 'application/xml' : 'text/csv'
  };

  // Add authentication
  if (authMethod === 'api_key' && apiKeyName) {
    const apiKey = Deno.env.get(apiKeyName);
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }
  }

  // Format data based on report format
  let body: string;
  if (format === 'json') {
    body = JSON.stringify(reportData);
  } else if (format === 'xml') {
    body = convertToXML(reportData);
  } else {
    body = convertToCSV(reportData);
  }

  const response = await fetch(endpointUrl, {
    method: 'POST',
    headers,
    body
  });

  if (!response.ok) {
    throw new Error(`Authority submission failed: ${response.statusText}`);
  }

  return await response.json();
}

function convertToXML(data: any): string {
  // Simple XML conversion
  return `<?xml version="1.0"?><report>${JSON.stringify(data)}</report>`;
}

function convertToCSV(data: any): string {
  // Simple CSV conversion
  const rows = [
    ['Field', 'Value'],
    ...Object.entries(data).map(([key, value]) => [key, String(value)])
  ];
  return rows.map(row => row.join(',')).join('\n');
}