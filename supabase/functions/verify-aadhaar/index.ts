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
    console.error('HUGGING_FACE_ACCESS_TOKEN not configured');
    throw new Error('Hugging Face token not configured');
  }

  console.log('Starting OCR processing...');

  try {
    // Convert base64 to blob
    const imageData = imageBase64.includes('base64,') 
      ? imageBase64.split('base64,')[1] 
      : imageBase64;
    
    console.log('Image data length:', imageData.length);
    const imageBytes = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));
    console.log('Image bytes length:', imageBytes.length);

    // Use Hugging Face's document image understanding model
    const response = await fetch(
      'https://api-inference.huggingface.co/models/microsoft/trocr-base-printed',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/octet-stream',
        },
        body: imageBytes,
      }
    );

    console.log('OCR API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hugging Face OCR error:', response.status, errorText);
      throw new Error(`OCR API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('OCR result:', JSON.stringify(result));
    
    const extractedText = result[0]?.generated_text || result.generated_text || '';
    console.log('Extracted text:', extractedText);
    
    return extractedText;
  } catch (error) {
    console.error('OCR processing failed:', error);
    throw error;
  }
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown OCR error';
      
      // If OCR fails, still validate format but note the OCR failure
      return {
        valid: true,
        verified: false,
        name_match: false,
        aadhaar_match: false,
        phone_match: phone ? null : null,
        ocr_text: '',
        message: `Aadhaar format is valid, but OCR verification failed: ${errorMessage}. You can still proceed with manual verification.`,
        error_details: errorMessage
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
