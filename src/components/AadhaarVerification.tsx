import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, CheckCircle, XCircle, FileText } from "lucide-react";

interface VerificationResult {
  valid: boolean;
  verified: boolean;
  name_match?: boolean;
  aadhaar_match?: boolean;
  phone_match?: boolean | null;
  ocr_text?: string;
  message: string;
  error_details?: string;
}

export const AadhaarVerification = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    aadhaar_number: "",
    name: "",
    phone: "",
  });
  const [documentImage, setDocumentImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setDocumentImage(base64String);
      setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.aadhaar_number || !formData.name) {
      toast({
        title: "Missing information",
        description: "Please provide Aadhaar number and name",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("verify-aadhaar", {
        body: {
          aadhaar_number: formData.aadhaar_number,
          name: formData.name,
          phone: formData.phone || undefined,
          document_image: documentImage || undefined,
        },
      });

      if (error) {
        throw error;
      }

      setVerificationResult(data);

      if (data.verified) {
        toast({
          title: "Verification Successful",
          description: "Aadhaar details verified successfully",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: data.message || "Unable to verify Aadhaar details",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Verification error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        title: "Verification Error",
        description: `Failed to verify: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const resetForm = () => {
    setFormData({ aadhaar_number: "", name: "", phone: "" });
    setDocumentImage(null);
    setImagePreview(null);
    setVerificationResult(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Aadhaar Verification</CardTitle>
          <CardDescription>
            Upload Aadhaar document and verify details using OCR
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="aadhaar_number">Aadhaar Number</Label>
              <Input
                id="aadhaar_number"
                placeholder="Enter 12-digit Aadhaar number"
                value={formData.aadhaar_number}
                onChange={(e) =>
                  setFormData({ ...formData, aadhaar_number: e.target.value })
                }
                maxLength={12}
                pattern="\d{12}"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name (as on Aadhaar)</Label>
              <Input
                id="name"
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document">Aadhaar Document (Optional)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="document"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Aadhaar preview"
                    className="max-w-xs rounded-md border"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isVerifying}>
                {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Aadhaar
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {verificationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {verificationResult.verified ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Verification Successful
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  Verification Failed
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant={verificationResult.verified ? "default" : "destructive"}>
              <AlertDescription>
                {verificationResult.message}
                {verificationResult.error_details && (
                  <div className="mt-2 text-xs opacity-80">
                    Details: {verificationResult.error_details}
                  </div>
                )}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Format Valid</Label>
                <Badge variant={verificationResult.valid ? "default" : "destructive"}>
                  {verificationResult.valid ? "Valid" : "Invalid"}
                </Badge>
              </div>

              {verificationResult.name_match !== undefined && (
                <div className="space-y-2">
                  <Label>Name Match</Label>
                  <Badge variant={verificationResult.name_match ? "default" : "destructive"}>
                    {verificationResult.name_match ? "Matched" : "Not Matched"}
                  </Badge>
                </div>
              )}

              {verificationResult.aadhaar_match !== undefined && (
                <div className="space-y-2">
                  <Label>Aadhaar Match</Label>
                  <Badge variant={verificationResult.aadhaar_match ? "default" : "destructive"}>
                    {verificationResult.aadhaar_match ? "Matched" : "Not Matched"}
                  </Badge>
                </div>
              )}
            </div>

            {verificationResult.ocr_text && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  OCR Extracted Text (Preview)
                </Label>
                <div className="rounded-md bg-muted p-3 text-sm font-mono">
                  {verificationResult.ocr_text}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
