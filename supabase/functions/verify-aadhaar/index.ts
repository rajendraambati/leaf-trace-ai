import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AadhaarVerificationRequest {
  aadhaar_number: string;
  name: string;
  phone?: string;
}

// Simulated Aadhaar verification (In production, this would call UIDAI API)
const verifyAadhaar = (aadhaarNumber: string, name: string, phone?: string) => {
  // Validate Aadhaar format: 12 digits
  const aadhaarRegex = /^\d{12}$/;
  if (!aadhaarRegex.test(aadhaarNumber)) {
    return {
      valid: false,
      verified: false,
      message: "Invalid Aadhaar format. Must be 12 digits."
    };
  }

  // Simulate verification logic
  // In production, this would call actual UIDAI verification API
  const isVerified = true; // Simulated verification result
  
  return {
    valid: true,
    verified: isVerified,
    name_match: true, // In production, compare with UIDAI data
    phone_match: phone ? true : null, // In production, compare with UIDAI data
    message: isVerified ? "Aadhaar verified successfully" : "Aadhaar verification failed"
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { aadhaar_number, name, phone }: AadhaarVerificationRequest = await req.json();

    if (!aadhaar_number || !name) {
      throw new Error("Aadhaar number and name are required");
    }

    const verificationResult = verifyAadhaar(aadhaar_number, name, phone);

    return new Response(
      JSON.stringify(verificationResult),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
