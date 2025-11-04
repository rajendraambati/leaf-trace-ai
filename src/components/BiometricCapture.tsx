import { useState } from "react";
import { Fingerprint, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface BiometricData {
  fingerprint_template: string;
  quality: number;
  captured_at: string;
  device: string;
  minutiae_points: number[];
}

interface BiometricCaptureProps {
  onCapture: (data: BiometricData) => void;
  captured: boolean;
}

export function BiometricCapture({ onCapture, captured }: BiometricCaptureProps) {
  const [capturing, setCapturing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const simulateFingerprintCapture = () => {
    setCapturing(true);
    setProgress(0);

    // Simulate fingerprint scanning progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Simulate capture completion after 2 seconds
    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      
      // Generate simulated biometric data
      const biometricData: BiometricData = {
        fingerprint_template: generateFingerprintTemplate(),
        quality: Math.floor(Math.random() * 20) + 80, // 80-100 quality
        captured_at: new Date().toISOString(),
        device: "Web Biometric Simulator v1.0",
        minutiae_points: generateMinutiaePoints()
      };

      setTimeout(() => {
        setCapturing(false);
        onCapture(biometricData);
        toast({
          title: "Fingerprint Captured",
          description: `Quality: ${biometricData.quality}%`,
        });
      }, 500);
    }, 2000);
  };

  const generateFingerprintTemplate = (): string => {
    // Generate a simulated fingerprint template (base64-like string)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let template = '';
    for (let i = 0; i < 256; i++) {
      template += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return template;
  };

  const generateMinutiaePoints = (): number[] => {
    // Generate simulated minutiae points (key features in fingerprint)
    const points = [];
    const numPoints = Math.floor(Math.random() * 30) + 40; // 40-70 points
    for (let i = 0; i < numPoints; i++) {
      points.push(
        Math.random() * 100, // x coordinate
        Math.random() * 100, // y coordinate
        Math.random() * 360  // angle
      );
    }
    return points;
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Fingerprint className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Biometric Authentication</h3>
      </div>

      <div className="flex flex-col items-center justify-center py-6 space-y-4">
        {!captured && !capturing && (
          <>
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-dashed border-muted-foreground/30 flex items-center justify-center">
                <Fingerprint className="h-16 w-16 text-muted-foreground/50" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Click below to capture fingerprint data
            </p>
          </>
        )}

        {capturing && (
          <>
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-primary flex items-center justify-center animate-pulse">
                <Fingerprint className="h-16 w-16 text-primary" />
              </div>
            </div>
            <div className="w-full max-w-xs space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                Scanning... {progress}%
              </p>
            </div>
          </>
        )}

        {captured && !capturing && (
          <>
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-success flex items-center justify-center">
                <CheckCircle2 className="h-16 w-16 text-success" />
              </div>
            </div>
            <p className="text-sm text-success font-medium text-center">
              Fingerprint captured successfully!
            </p>
          </>
        )}
      </div>

      {!captured && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={simulateFingerprintCapture}
          disabled={capturing}
        >
          <Fingerprint className="h-4 w-4 mr-2" />
          {capturing ? "Scanning..." : "Capture Fingerprint"}
        </Button>
      )}

      {captured && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={simulateFingerprintCapture}
        >
          <Fingerprint className="h-4 w-4 mr-2" />
          Re-capture Fingerprint
        </Button>
      )}

      <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
        <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          This is a simulated biometric capture for demonstration. In production, 
          integrate with actual fingerprint hardware/SDK for real biometric authentication.
        </p>
      </div>
    </Card>
  );
}
