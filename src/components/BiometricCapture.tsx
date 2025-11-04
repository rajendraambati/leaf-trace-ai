import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Fingerprint, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BiometricCaptureProps {
  onCapture: (biometricData: BiometricData) => void;
  disabled?: boolean;
  captured?: boolean;
}

export interface BiometricData {
  fingerprint_data: {
    template: string;
    quality: number;
    timestamp: string;
    finger_position: string;
  };
  fingerprint_template: string;
  capture_device: string;
  capture_quality: number;
}

export const BiometricCapture = ({ onCapture, disabled, captured: externalCaptured }: BiometricCaptureProps) => {
  const [capturing, setCapturing] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [captureQuality, setCaptureQuality] = useState<number | null>(null);

  const isCapture = externalCaptured || captured;

  const simulateFingerprintCapture = async (): Promise<BiometricData> => {
    // Simulate fingerprint capture process
    // In production, this would integrate with actual fingerprint reader SDK
    return new Promise((resolve) => {
      setTimeout(() => {
        const quality = Math.floor(Math.random() * 20) + 80; // 80-100% quality
        const biometricData: BiometricData = {
          fingerprint_data: {
            template: `FP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            quality: quality,
            timestamp: new Date().toISOString(),
            finger_position: "right_index"
          },
          fingerprint_template: btoa(JSON.stringify({
            minutiae: Array.from({ length: 50 }, () => ({
              x: Math.random() * 256,
              y: Math.random() * 256,
              angle: Math.random() * 360,
              type: Math.random() > 0.5 ? "ridge_ending" : "bifurcation"
            }))
          })),
          capture_device: "Web Fingerprint Reader v1.0",
          capture_quality: quality
        };
        resolve(biometricData);
      }, 2000);
    });
  };

  const handleCapture = async () => {
    setCapturing(true);
    setCaptured(false);
    setCaptureQuality(null);

    try {
      toast.info("Place your finger on the scanner...");
      
      const biometricData = await simulateFingerprintCapture();
      
      setCaptureQuality(biometricData.capture_quality);
      setCaptured(true);
      
      if (biometricData.capture_quality >= 70) {
        toast.success(`Fingerprint captured successfully! Quality: ${biometricData.capture_quality}%`);
        onCapture(biometricData);
      } else {
        toast.error("Poor fingerprint quality. Please try again.");
        setCaptured(false);
      }
    } catch (error) {
      toast.error("Failed to capture fingerprint. Please try again.");
      console.error("Biometric capture error:", error);
    } finally {
      setCapturing(false);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Biometric Data</h3>
        </div>
        {isCapture && captureQuality && (
          <div className="flex items-center gap-1 text-sm text-success">
            <CheckCircle className="h-4 w-4" />
            <span>Quality: {captureQuality}%</span>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-4 py-6 bg-muted/50 rounded-lg border-2 border-dashed border-border">
        {!isCapture ? (
          <>
            <div className="relative">
              <Fingerprint 
                className={`h-20 w-20 ${capturing ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} 
              />
              {capturing && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                </div>
              )}
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">
                {capturing ? "Scanning fingerprint..." : "Ready to capture fingerprint"}
              </p>
              <p className="text-xs text-muted-foreground">
                {capturing 
                  ? "Please keep your finger steady on the scanner" 
                  : "Click the button below to start capture"}
              </p>
            </div>

            <Button 
              onClick={handleCapture} 
              disabled={capturing || disabled}
              className="w-full max-w-xs"
            >
              {capturing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Capturing...
                </>
              ) : (
                <>
                  <Fingerprint className="mr-2 h-4 w-4" />
                  Capture Fingerprint
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="relative">
              <Fingerprint className="h-20 w-20 text-success" />
              <CheckCircle className="h-8 w-8 text-success absolute -bottom-1 -right-1" />
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-success">Fingerprint captured successfully!</p>
              <p className="text-xs text-muted-foreground">
                Quality: {captureQuality}% • Ready to register
              </p>
            </div>

            <Button 
              onClick={handleCapture} 
              variant="outline"
              disabled={disabled}
              className="w-full max-w-xs"
            >
              Recapture
            </Button>
          </>
        )}
      </div>

      {!isCapture && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted p-3 rounded-md">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            Biometric data is required for farmer registration. Ensure the fingerprint scanner is 
            connected and the farmer's finger is clean and dry for best results.
          </p>
        </div>
      )}
    </Card>
  );
};
