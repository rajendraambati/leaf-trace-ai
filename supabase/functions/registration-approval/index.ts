import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApprovalRequest {
  registrationId: string;
  action: 'approve' | 'decline';
  notes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { registrationId, action, notes }: ApprovalRequest = await req.json();

    // Get registration details
    const { data: registration, error: regError } = await supabaseClient
      .from('pending_registrations')
      .select('*')
      .eq('id', registrationId)
      .single();

    if (regError || !registration) {
      return new Response(
        JSON.stringify({ error: 'Registration not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'approve') {
      // Create user account using admin API
      const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
        email: registration.email,
        password: registration.password_hash,
        email_confirm: true,
        user_metadata: {
          full_name: registration.full_name,
          phone: registration.phone,
          role: registration.requested_role
        }
      });

      if (createError || !newUser.user) {
        console.error('Error creating user:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user account' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Assign role
      const { error: roleError } = await supabaseClient
        .from('user_roles')
        .insert({
          user_id: newUser.user.id,
          role: registration.requested_role
        });

      if (roleError) {
        console.error('Error assigning role:', roleError);
      }

      // Update registration status
      await supabaseClient.rpc('approve_registration', {
        _registration_id: registrationId,
        _admin_id: user.id,
        _notes: notes
      });

      // Transfer documents to new user
      const { data: documents } = await supabaseClient
        .from('user_documents')
        .select('*')
        .eq('registration_id', registrationId);

      if (documents) {
        for (const doc of documents) {
          await supabaseClient
            .from('user_documents')
            .update({ user_id: newUser.user.id })
            .eq('id', doc.id);
        }
      }

      console.log('Registration approved for:', registration.email);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Registration approved',
          userId: newUser.user.id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'decline') {
      // Update registration status
      await supabaseClient.rpc('decline_registration', {
        _registration_id: registrationId,
        _admin_id: user.id,
        _notes: notes
      });

      console.log('Registration declined for:', registration.email);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Registration declined'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in registration-approval:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});