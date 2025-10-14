import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const url = new URL(req.url);
    const reportType = url.searchParams.get('type'); // 'audit' or 'certification'
    const id = url.searchParams.get('id');
    const auditType = url.searchParams.get('audit_type');
    const status = url.searchParams.get('status');

    // GET - Retrieve compliance reports
    if (req.method === 'GET') {
      if (reportType === 'audit' || !reportType) {
        let query = supabaseClient.from('compliance_audits').select('*');

        if (id) {
          query = query.eq('id', id);
          const { data, error } = await query.maybeSingle();
          
          if (error) throw error;
          if (!data) {
            return new Response(
              JSON.stringify({ error: 'Audit not found' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          console.log('Retrieved audit:', id);
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (auditType) {
          query = query.eq('audit_type', auditType);
        }

        if (status) {
          query = query.eq('status', status);
        }

        query = query.order('audit_date', { ascending: false });
        const { data, error } = await query;

        if (error) throw error;

        console.log(`Retrieved ${data?.length || 0} audits`);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (reportType === 'certification') {
        let query = supabaseClient.from('compliance_certifications').select('*');

        if (id) {
          query = query.eq('id', id);
          const { data, error } = await query.maybeSingle();
          
          if (error) throw error;
          if (!data) {
            return new Response(
              JSON.stringify({ error: 'Certification not found' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          console.log('Retrieved certification:', id);
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (status) {
          query = query.eq('status', status);
        }

        query = query.order('issue_date', { ascending: false });
        const { data, error } = await query;

        if (error) throw error;

        console.log(`Retrieved ${data?.length || 0} certifications`);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // POST - Create compliance report
    if (req.method === 'POST') {
      const body = await req.json();

      if (body.report_type === 'audit') {
        const { data, error } = await supabaseClient
          .from('compliance_audits')
          .insert({
            audit_type: body.audit_type,
            audit_date: body.audit_date || new Date().toISOString().split('T')[0],
            score: body.score,
            status: body.status || 'completed',
            findings: body.findings,
            auditor_name: body.auditor_name,
          })
          .select()
          .single();

        if (error) throw error;

        console.log('Created audit:', data.id);
        return new Response(JSON.stringify(data), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (body.report_type === 'certification') {
        const { data, error } = await supabaseClient
          .from('compliance_certifications')
          .insert({
            name: body.name,
            issuer: body.issuer,
            certificate_number: body.certificate_number,
            issue_date: body.issue_date,
            expiry_date: body.expiry_date,
            status: body.status || 'active',
            document_url: body.document_url,
          })
          .select()
          .single();

        if (error) throw error;

        console.log('Created certification:', data.id);
        return new Response(JSON.stringify(data), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({ error: 'Invalid report_type. Use "audit" or "certification"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PUT - Update compliance report
    if (req.method === 'PUT') {
      if (!id) {
        return new Response(
          JSON.stringify({ error: 'ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();

      if (reportType === 'audit') {
        const { data, error } = await supabaseClient
          .from('compliance_audits')
          .update({
            score: body.score,
            status: body.status,
            findings: body.findings,
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        console.log('Updated audit:', id);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (reportType === 'certification') {
        const { data, error } = await supabaseClient
          .from('compliance_certifications')
          .update({
            status: body.status,
            expiry_date: body.expiry_date,
            document_url: body.document_url,
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        console.log('Updated certification:', id);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({ error: 'Invalid report type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE - Delete compliance report
    if (req.method === 'DELETE') {
      if (!id) {
        return new Response(
          JSON.stringify({ error: 'ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (reportType === 'audit') {
        const { error } = await supabaseClient
          .from('compliance_audits')
          .delete()
          .eq('id', id);

        if (error) throw error;

        console.log('Deleted audit:', id);
        return new Response(
          JSON.stringify({ message: 'Audit deleted successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (reportType === 'certification') {
        const { error } = await supabaseClient
          .from('compliance_certifications')
          .delete()
          .eq('id', id);

        if (error) throw error;

        console.log('Deleted certification:', id);
        return new Response(
          JSON.stringify({ message: 'Certification deleted successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Invalid report type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in compliance-reporting:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
