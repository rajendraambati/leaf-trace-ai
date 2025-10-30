import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { 
      contractType,
      partyA,
      partyB,
      selectedClauses,
      customizations,
      contractDetails 
    } = await req.json();

    // Fetch clause templates
    const { data: clauses, error: clausesError } = await supabase
      .from('contract_clauses')
      .select('*')
      .in('id', selectedClauses);

    if (clausesError) throw clausesError;

    // Replace placeholders with customizations
    const processedClauses = clauses.map(clause => {
      let content = clause.clause_content;
      const customFields = JSON.parse(clause.customization_fields || '[]');
      
      customFields.forEach((field: any) => {
        const value = customizations[clause.id]?.[field.field] || field.default || '';
        content = content.replace(`{{${field.field}}}`, value);
      });
      
      return {
        ...clause,
        processed_content: content
      };
    });

    // Use AI to generate full contract
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const prompt = `Generate a professional legal contract with the following details:

Contract Type: ${contractType}
Party A (First Party): ${partyA.name}
${partyA.address ? `Address: ${partyA.address}` : ''}
${partyA.email ? `Email: ${partyA.email}` : ''}

Party B (Second Party): ${partyB.name}
${partyB.address ? `Address: ${partyB.address}` : ''}
${partyB.email ? `Email: ${partyB.email}` : ''}

Contract Value: ${contractDetails.value} ${contractDetails.currency}
Effective Date: ${contractDetails.effectiveDate}
${contractDetails.expiryDate ? `Expiry Date: ${contractDetails.expiryDate}` : ''}

Include the following clauses in order:

${processedClauses.map((c: any, i: number) => `
${i + 1}. ${c.clause_name}
${c.processed_content}
`).join('\n')}

Format the contract professionally with:
- Proper legal heading
- Article/Section numbering
- Signature blocks for both parties
- Date line
- Witness line (if applicable)

Make it formal, legally sound, and ready to use. Do not add extra clauses not specified above.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert legal contract drafter. Generate professional, legally sound contracts based on the provided clauses and details. Use proper legal formatting and language.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', errorText);
      throw new Error('Failed to generate contract with AI');
    }

    const aiData = await aiResponse.json();
    const generatedContent = aiData.choices[0]?.message?.content;

    if (!generatedContent) {
      throw new Error('No content generated from AI');
    }

    // Generate contract number
    const contractNumber = `CON-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Store in database
    const { data: { user } } = await supabase.auth.getUser(req.headers.get('Authorization')?.replace('Bearer ', '') || '');

    const { data: contract, error: insertError } = await supabase
      .from('generated_contracts')
      .insert({
        contract_number: contractNumber,
        contract_type: contractType,
        party_a_name: partyA.name,
        party_a_details: partyA,
        party_b_name: partyB.name,
        party_b_details: partyB,
        selected_clauses: selectedClauses,
        customizations: customizations,
        generated_content: generatedContent,
        contract_value: contractDetails.value,
        currency: contractDetails.currency,
        effective_date: contractDetails.effectiveDate,
        expiry_date: contractDetails.expiryDate || null,
        created_by: user?.id,
        status: 'draft'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert Error:', insertError);
      throw insertError;
    }

    // Create initial version
    await supabase
      .from('contract_versions')
      .insert({
        contract_id: contract.id,
        version_number: 1,
        content: generatedContent,
        changes_summary: 'Initial contract generation',
        created_by: user?.id
      });

    return new Response(
      JSON.stringify({ 
        success: true,
        contract,
        content: generatedContent
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating contract:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
