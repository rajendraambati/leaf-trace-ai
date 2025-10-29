import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileCheck,
  Loader2 
} from "lucide-react";

interface ComplianceValidationProps {
  entityId: string;
  entityType: 'batch' | 'shipment' | 'warehouse' | 'processing_unit' | 'farmer' | 'vehicle';
  region?: string;
  onValidationComplete?: (result: any) => void;
}

export function ComplianceValidation({ 
  entityId, 
  entityType, 
  region = 'default',
  onValidationComplete 
}: ComplianceValidationProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const { toast } = useToast();

  const validateCompliance = async (validationType: 'pre_dispatch' | 'customs' | 'excise') => {
    setIsValidating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('compliance-validation', {
        body: {
          entity_id: entityId,
          entity_type: entityType,
          validation_type: validationType,
          region: region
        }
      });

      if (error) throw error;

      setValidationResult(data);
      
      if (data.status === 'passed') {
        toast({
          title: "Compliance Check Passed",
          description: "All required documents are valid and up to date.",
        });
      } else if (data.status === 'warning') {
        toast({
          title: "Compliance Warning",
          description: `${data.warnings?.length || 0} warning(s) detected. Review required.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Compliance Check Failed",
          description: `${data.missing_documents?.length || 0} missing, ${data.expired_documents?.length || 0} expired documents.`,
          variant: "destructive",
        });
      }

      if (onValidationComplete) {
        onValidationComplete(data);
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: "Validation Failed",
        description: "Failed to validate compliance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
      case 'cleared':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'failed':
      case 'blocked':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <FileCheck className="h-5 w-5 text-muted" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      passed: "default",
      cleared: "default",
      warning: "secondary",
      failed: "destructive",
      blocked: "destructive",
      pending: "outline"
    };
    
    return (
      <Badge variant={variants[status] || "outline"}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="h-5 w-5" />
          Compliance Validation
        </CardTitle>
        <CardDescription>
          Validate EMD, BG, GST, and tender documents for dispatch
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => validateCompliance('pre_dispatch')}
            disabled={isValidating}
            variant="default"
          >
            {isValidating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Pre-Dispatch Check
          </Button>
          <Button
            onClick={() => validateCompliance('customs')}
            disabled={isValidating}
            variant="outline"
          >
            Customs Validation
          </Button>
          <Button
            onClick={() => validateCompliance('excise')}
            disabled={isValidating}
            variant="outline"
          >
            Excise Validation
          </Button>
        </div>

        {validationResult && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(validationResult.status)}
                <span className="font-medium">Validation Result</span>
              </div>
              {getStatusBadge(validationResult.status)}
            </div>

            {validationResult.missing_documents?.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <strong>Missing Documents:</strong>{' '}
                  {validationResult.missing_documents.map((doc: string) => doc.toUpperCase()).join(', ')}
                </AlertDescription>
              </Alert>
            )}

            {validationResult.expired_documents?.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <strong>Expired Documents:</strong>{' '}
                  {validationResult.expired_documents.map((doc: string) => doc.toUpperCase()).join(', ')}
                </AlertDescription>
              </Alert>
            )}

            {validationResult.warnings?.length > 0 && (
              <Alert>
                <AlertDescription>
                  <strong>Warnings:</strong>
                  <ul className="list-disc list-inside mt-2">
                    {validationResult.warnings.map((warning: string, idx: number) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {validationResult.status === 'passed' && (
              <Alert className="bg-success/10 border-success">
                <AlertDescription className="text-success">
                  All compliance requirements met. This {entityType} is cleared for dispatch.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}