import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PortalSubmission {
  portalType: 'gst' | 'fctc' | 'esg';
  reportData: any;
  portalUrl: string;
  credentials?: {
    apiKey?: string;
    username?: string;
    password?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { portalType, reportData, portalUrl, credentials }: PortalSubmission = await req.json();

    console.log(`Submitting ${portalType} report to government portal: ${portalUrl}`);

    // Prepare submission payload based on portal type
    let submissionPayload: any;
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authentication headers if provided
    if (credentials?.apiKey) {
      headers['Authorization'] = `Bearer ${credentials.apiKey}`;
    } else if (credentials?.username && credentials?.password) {
      const auth = btoa(`${credentials.username}:${credentials.password}`);
      headers['Authorization'] = `Basic ${auth}`;
    }

    switch (portalType) {
      case 'gst':
        submissionPayload = {
          gstin: reportData.gstin || 'DEMO_GSTIN',
          period: reportData.period,
          summary: reportData.summary,
          transactions: reportData.transactions,
          submittedAt: new Date().toISOString(),
        };
        break;

      case 'fctc':
        submissionPayload = {
          organizationId: reportData.organizationId || 'DEMO_ORG',
          reportType: 'FCTC_COMPLIANCE',
          period: reportData.period,
          complianceMetrics: reportData.farmersCompliance,
          auditSummary: reportData.complianceAudits,
          certifications: reportData.activeCertifications,
          traceability: reportData.traceabilityMetrics,
          submittedAt: new Date().toISOString(),
        };
        break;

      case 'esg':
        submissionPayload = {
          organizationId: reportData.organizationId || 'DEMO_ORG',
          reportType: 'ESG_DISCLOSURE',
          period: reportData.period,
          scores: reportData.overallScores,
          metrics: reportData.sustainabilityMetrics,
          assessments: reportData.assessmentCount,
          submittedAt: new Date().toISOString(),
        };
        break;

      default:
        throw new Error(`Unsupported portal type: ${portalType}`);
    }

    // Submit to government portal (simulated for demo)
    let submissionResult;
    try {
      const response = await fetch(portalUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(submissionPayload),
      });

      if (!response.ok) {
        throw new Error(`Portal returned ${response.status}: ${await response.text()}`);
      }

      submissionResult = await response.json();
      console.log('Portal submission successful:', submissionResult);
    } catch (fetchError: any) {
      console.error('Portal submission failed:', fetchError.message);
      
      // Log failed submission
      await supabase.from('audit_logs').insert({
        action: 'SUBMIT_GOVERNMENT_REPORT',
        resource: `${portalType}_portal`,
        data_snapshot: { portalUrl, error: fetchError.message },
        status: 'error',
        error_message: fetchError.message,
      });

      return new Response(
        JSON.stringify({ 
          error: 'Portal submission failed', 
          details: fetchError.message,
          note: 'This is a demo. Configure actual government portal endpoints for production.'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Log successful submission
    await supabase.from('audit_logs').insert({
      action: 'SUBMIT_GOVERNMENT_REPORT',
      resource: `${portalType}_portal`,
      data_snapshot: { 
        portalUrl, 
        submissionId: submissionResult?.id || 'demo',
        reportType: portalType,
      },
      status: 'success',
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        submissionId: submissionResult?.id || `demo-${Date.now()}`,
        message: 'Report submitted successfully',
        portalResponse: submissionResult,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error submitting to government portal:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
