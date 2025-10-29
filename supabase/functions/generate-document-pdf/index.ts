import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const documentId = url.searchParams.get('document_id');

    if (!documentId) {
      throw new Error('document_id parameter is required');
    }

    console.log('Fetching document:', documentId);

    // Fetch document from database
    const { data: document, error } = await supabase
      .from('generated_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error) throw error;
    if (!document) throw new Error('Document not found');

    console.log('Document fetched successfully:', document.document_number);

    // For now, return document data. In production, this would generate actual PDF
    // using a PDF library like puppeteer or jsPDF server-side
    return new Response(JSON.stringify({
      success: true,
      document_number: document.document_number,
      document_type: document.document_type,
      message: 'Use client-side PDF generation for download',
      data: document
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-document-pdf function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});