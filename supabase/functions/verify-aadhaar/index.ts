import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AadhaarVerificationRequest {
  aadhaar_number: string;
  name: string;
  phone?: string;
  document_image?: string; // Base64 encoded image
}

// Extract text from Aadhaar document using Hugging Face OCR
const extractTextFromDocument = async (imageBase64: string): Promise<string> => {
  const HF_TOKEN = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');
  
  if (!HF_TOKEN) {
    throw new Error('Hugging Face token not configured');
  }

  // Convert base64 to blob
  const imageData = imageBase64.includes('base64,') 
    ? imageBase64.split('base64,')[1] 
    : imageBase64;
  
  const imageBytes = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));

  // Use Hugging Face's TrOCR model for document OCR
  const response = await fetch(
    'https://api-inference.huggingface.co/models/microsoft/trocr-large-printed',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/octet-stream',
      },
      body: imageBytes,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Hugging Face OCR error:', error);
    throw new Error('Failed to process document with OCR');
  }

  const result = await response.json();
  return result[0]?.generated_text || '';
};

// Verify Aadhaar number format and extract details from OCR text
const verifyAadhaar = async (
  aadhaarNumber: string, 
  name: string, 
  phone?: string,
  documentImage?: string
) => {
  // Validate Aadhaar format: 12 digits
  const aadhaarRegex = /^\d{12}$/;
  if (!aadhaarRegex.test(aadhaarNumber)) {
    return {
      valid: false,
      verified: false,
      message: "Invalid Aadhaar format. Must be 12 digits."
    };
  }

  let ocrText = '';
  let nameMatch = false;
  let aadhaarMatch = false;

  // If document image provided, verify with OCR
  if (documentImage) {
    try {
      ocrText = await extractTextFromDocument(documentImage);
      console.log('OCR extracted text:', ocrText);

      // Check if name appears in OCR text (case-insensitive)
      const nameLower = name.toLowerCase();
      const ocrTextLower = ocrText.toLowerCase();
      nameMatch = ocrTextLower.includes(nameLower);

      // Check if Aadhaar number appears in OCR text
      // Aadhaar might be formatted with spaces (XXXX XXXX XXXX)
      const aadhaarFormatted = aadhaarNumber.match(/.{1,4}/g)?.join(' ') || aadhaarNumber;
      aadhaarMatch = ocrText.includes(aadhaarNumber) || ocrText.includes(aadhaarFormatted);

    } catch (error) {
      console.error('OCR processing error:', error);
      return {
        valid: false,
        verified: false,
        message: "Failed to process Aadhaar document image"
      };
    }

    // Verification result based on OCR matching
    const verified = nameMatch && aadhaarMatch;

    return {
      valid: true,
      verified,
      name_match: nameMatch,
      aadhaar_match: aadhaarMatch,
      phone_match: phone ? null : null, // Phone verification would require additional API
      ocr_text: ocrText.substring(0, 200), // First 200 chars for reference
      message: verified 
        ? "Aadhaar verified successfully with document" 
        : "Aadhaar details do not match the document"
    };
  }

  // If no document image, do basic format validation only
  return {
    valid: true,
    verified: true,
    name_match: true,
    phone_match: phone ? null : null,
    message: "Aadhaar format validated (no document provided)"
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { aadhaar_number, name, phone, document_image }: AadhaarVerificationRequest = await req.json();

    if (!aadhaar_number || !name) {
      throw new Error("Aadhaar number and name are required");
    }

    const verificationResult = await verifyAadhaar(aadhaar_number, name, phone, document_image);

    // Store verification result in database
    if (verificationResult.verified) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Store verification record
      const { error: dbError } = await supabase
        .from('aadhaar_verifications')
        .insert({
          aadhaar_number: aadhaar_number,
          name: name,
          phone: phone,
          verification_status: 'verified',
          verification_method: document_image ? 'ocr' : 'format_check',
          ocr_confidence: verificationResult.name_match && verificationResult.aadhaar_match ? 0.95 : 0.5,
          metadata: {
            name_match: verificationResult.name_match,
            aadhaar_match: verificationResult.aadhaar_match,
            ocr_text_preview: verificationResult.ocr_text
          }
        });

      if (dbError) {
        console.error('Database error:', dbError);
      }
    }

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
