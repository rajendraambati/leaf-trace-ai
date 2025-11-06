import { AadhaarVerification } from "@/components/AadhaarVerification";
import { Card } from "@/components/ui/card";

export default function AadhaarVerificationPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Aadhaar Verification</h1>
        <p className="text-muted-foreground mt-2">
          Verify Aadhaar documents using OCR technology
        </p>
      </div>
      <AadhaarVerification />
    </div>
  );
}
