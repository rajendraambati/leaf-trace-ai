import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ApprovalSchema = z.object({
  registrationId: z.string().uuid('Invalid registration ID format'),
  action: z.enum(['approve', 'decline'], { errorMap: () => ({ message: 'Action must be approve or decline' }) }),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional()
});

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

    const requestBody = await req.json();
    const { registrationId, action, notes } = ApprovalSchema.parse(requestBody);

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
      // User already exists in Auth, just assign the role
      const userId = registration.user_id;
      
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'User ID not found in registration' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Assign role
      const { error: roleError } = await supabaseClient
        .from('user_roles')
        .insert({
          user_id: userId,
          role: registration.requested_role
        });

      if (roleError) {
        console.error('Error assigning role:', roleError);
        return new Response(
          JSON.stringify({ error: 'Failed to assign role' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update registration status
      await supabaseClient.rpc('approve_registration', {
        _registration_id: registrationId,
        _admin_id: user.id,
        _notes: notes
      });

      // Ensure documents are linked to the user
      await supabaseClient
        .from('user_documents')
        .update({ user_id: userId })
        .eq('registration_id', registrationId);

      console.log('Registration approved for:', registration.email);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Registration approved',
          userId: userId
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'decline') {
      // Delete the user account from Auth
      if (registration.user_id) {
        await supabaseClient.auth.admin.deleteUser(registration.user_id);
      }
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