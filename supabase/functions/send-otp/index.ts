import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hash function using Web Crypto API
async function hashOTP(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send SMS via Fast2SMS
async function sendSMS(phoneNumber: string, otp: string): Promise<boolean> {
  const apiKey = Deno.env.get('FAST2SMS_API_KEY');
  
  if (!apiKey) {
    console.error('Fast2SMS API key not configured');
    return false;
  }

  // Format phone number (remove +91 if present)
  const formattedPhone = phoneNumber.replace(/^\+91/, '').replace(/\D/g, '');
  
  const message = `This is your CropTrace360 OTP ${otp}`;
  
  try {
    const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&route=v3&sender_id=TXTIND&message=${encodeURIComponent(message)}&language=english&numbers=${formattedPhone}`;
    
    const response = await fetch(url, {
      method: 'GET',
    });

    const result = await response.json();
    console.log('Fast2SMS Response:', result);
    
    if (result.return === true || result.status_code === 200) {
      return true;
    } else {
      console.error('Fast2SMS Error:', result);
      return false;
    }
  } catch (error) {
    console.error('SMS sending failed:', error);
    // In development, print OTP to console as fallback
    console.log(`[DEVELOPMENT] OTP for ${phoneNumber}: ${otp}`);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { phone_number } = await req.json();

    if (!phone_number) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check rate limiting: max 3 requests in last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    const { data: recentOTPs, error: checkError } = await supabase
      .from('phone_otp_verifications')
      .select('id')
      .eq('phone_number', phone_number)
      .gte('created_at', tenMinutesAgo);

    if (checkError) {
      console.error('Error checking rate limit:', checkError);
    }

    if (recentOTPs && recentOTPs.length >= 3) {
      return new Response(
        JSON.stringify({ 
          error: 'Too many OTP requests. Please try again after 10 minutes.' 
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);

    // Store OTP with 5-minute expiry
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    
    const { error: insertError } = await supabase
      .from('phone_otp_verifications')
      .insert({
        phone_number,
        otp_hash: otpHash,
        expires_at: expiresAt,
        verified: false,
        attempts: 0
      });

    if (insertError) {
      console.error('Error storing OTP:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate OTP' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Send SMS
    const smsSent = await sendSMS(phone_number, otp);
    
    if (!smsSent) {
      // Still return success but log for development
      console.log(`[DEVELOPMENT MODE] OTP for ${phone_number}: ${otp}`);
    }

    // Clean up expired OTPs
    await supabase.rpc('cleanup_expired_otps');

    return new Response(
      JSON.stringify({ 
        message: 'OTP sent successfully',
        development_mode: !smsSent,
        // Only include OTP in development/testing
        ...(Deno.env.get('ENVIRONMENT') === 'development' && { otp })
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in send-otp function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
