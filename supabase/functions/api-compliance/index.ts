import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface ComplianceRequest {
  action: 'submit_report' | 'get_report' | 'list_reports' | 'validate_documents';
  report_data?: any;
  report_id?: string;
  entity_id?: string;
  entity_type?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single();

    if (keyError || !keyData) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!keyData.allowed_endpoints.includes('*') && !keyData.allowed_endpoints.includes('compliance')) {
      return new Response(
        JSON.stringify({ error: 'Endpoint not allowed' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, report_data, report_id, entity_id, entity_type }: ComplianceRequest = await req.json();

    let response: any;

    switch (action) {
      case 'submit_report':
        if (!report_data) throw new Error('report_data required');

        const { data: report, error: reportError } = await supabase
          .from('compliance_reports')
          .insert({
            report_number: `RPT-${Date.now()}`,
            report_type: report_data.report_type,
            report_period_start: report_data.period_start,
            report_period_end: report_data.period_end,
            report_data: report_data,
            submission_status: 'submitted',
          })
          .select()
          .single();

        if (reportError) throw reportError;
        response = { success: true, report_id: report.id, report_number: report.report_number };
        break;

      case 'get_report':
        if (!report_id) throw new Error('report_id required');

        const { data: reportData, error: getError } = await supabase
          .from('compliance_reports')
          .select('*')
          .eq('id', report_id)
          .single();

        if (getError) throw getError;
        response = { success: true, report: reportData };
        break;

      case 'list_reports':
        const { data: reports, error: listError } = await supabase
          .from('compliance_reports')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (listError) throw listError;
        response = { success: true, reports };
        break;

      case 'validate_documents':
        if (!entity_id || !entity_type) throw new Error('entity_id and entity_type required');

        const { data: documents, error: docsError } = await supabase
          .from('compliance_documents')
          .select('*')
          .eq('entity_id', entity_id)
          .eq('entity_type', entity_type);

        if (docsError) throw docsError;

        const requiredDocs = ['license', 'certificate', 'permit'];
        const existingTypes = documents?.map(d => d.document_type) || [];
        const missingDocs = requiredDocs.filter(type => !existingTypes.includes(type));

        response = {
          success: true,
          valid: missingDocs.length === 0,
          documents: documents,
          missing_documents: missingDocs,
          validation_status: missingDocs.length === 0 ? 'compliant' : 'non_compliant',
        };
        break;

      default:
        throw new Error('Invalid action');
    }

    await logRequest(supabase, keyData.id, req, 200, Date.now() - startTime);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Compliance API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function logRequest(
  supabase: any,
  apiKeyId: string | null,
  req: Request,
  status: number,
  responseTime: number,
  errorMessage?: string
) {
  try {
    const url = new URL(req.url);
    await supabase.from('api_request_logs').insert({
      api_key_id: apiKeyId,
      endpoint: url.pathname,
      method: req.method,
      response_status: status,
      response_time_ms: responseTime,
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent'),
      error_message: errorMessage,
    });
  } catch (error) {
    console.error('Failed to log request:', error);
  }
}
