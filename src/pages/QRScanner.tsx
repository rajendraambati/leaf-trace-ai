import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { QrCode, CheckCircle2, Package, Truck, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";
import { parseBatchQRData, parseDocumentQRData } from "@/utils/qrcode";

export default function QRScanner() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [qrType, setQrType] = useState<'batch' | 'document' | null>(null);
  const [confirming, setConfirming] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop();
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        async (decodedText) => {
          try {
            const data = JSON.parse(decodedText);
            
            // Determine QR code type
            if (data.type === 'tobacco_batch') {
              setQrType('batch');
              setScannedData(data);
              toast.success("Batch QR Code scanned!");
            } else if (data.type === 'document_verification') {
              setQrType('document');
              setScannedData(data);
              toast.success("Document QR Code scanned!");
              
              // Log the scan
              await supabase.from('document_tracking').insert({
                document_id: data.documentId,
                qr_code: data.documentNumber,
                scan_timestamp: new Date().toISOString(),
                scan_location: 'Mobile Scanner'
              });
            } else {
              setScannedData(data);
              setQrType(null);
              toast.success("QR Code scanned!");
            }
            
            scanner.stop();
            setScanning(false);
          } catch {
            toast.error("Invalid QR code format");
          }
        },
        (errorMessage) => {
          // Scanning errors are normal, ignore
        }
      );

      setScanning(true);
    } catch (error: any) {
      toast.error("Camera access denied or not available");
      setScanning(false);
    }
  };

  const stopScanning = () => {
    if (scannerRef.current?.isScanning) {
      scannerRef.current.stop();
      setScanning(false);
    }
  };

  const confirmDelivery = async () => {
    if (!scannedData?.batchId) {
      toast.error("No batch ID found");
      return;
    }

    setConfirming(true);
    try {
      const { error } = await supabase
        .from('shipments')
        .update({
          status: 'delivered',
          actual_arrival: new Date().toISOString()
        })
        .eq('batch_id', scannedData.batchId);

      if (error) throw error;

      toast.success("Delivery confirmed successfully!");
      setScannedData(null);
      setQrType(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to confirm delivery");
    } finally {
      setConfirming(false);
    }
  };

  const verifyDocument = () => {
    if (scannedData?.documentNumber) {
      navigate(`/document-verification?doc=${scannedData.documentNumber}`);
    }
  };

  const resetScanner = () => {
    setScannedData(null);
    setQrType(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4 pb-20">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="text-center pt-6 pb-4">
          <QrCode className="h-12 w-12 mx-auto text-primary mb-3" />
          <h1 className="text-2xl font-bold">QR Scanner</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Scan batch or document QR codes
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Camera Scanner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              id="qr-reader"
              className="w-full rounded-lg overflow-hidden bg-black"
              style={{ minHeight: scanning ? "300px" : "0" }}
            />

            {!scanning && !scannedData && (
              <div className="text-center py-8">
                <QrCode className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Position QR code within the frame
                </p>
              </div>
            )}

            {!scannedData && (
              <Button
                onClick={scanning ? stopScanning : startScanning}
                className="w-full h-12 text-base"
                variant={scanning ? "destructive" : "default"}
              >
                {scanning ? "Stop Scanning" : "Start Camera"}
              </Button>
            )}
          </CardContent>
        </Card>

        {scannedData && qrType === 'batch' && (
          <Card className="border-success/50 bg-success/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Scanned Batch
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                  <Package className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Batch ID</p>
                    <p className="font-semibold text-lg">{scannedData.batchId}</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-background">
                  <p className="text-xs text-muted-foreground mb-1">Type</p>
                  <p className="text-sm font-medium">{scannedData.type}</p>
                </div>

                <div className="p-3 rounded-lg bg-background">
                  <p className="text-xs text-muted-foreground mb-1">Scanned At</p>
                  <p className="text-sm font-medium">
                    {new Date().toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                <Button
                  onClick={confirmDelivery}
                  disabled={confirming}
                  className="w-full h-12 text-base"
                >
                  <Truck className="h-5 w-5 mr-2" />
                  {confirming ? "Confirming..." : "Confirm Delivery"}
                </Button>

                <Button
                  onClick={resetScanner}
                  variant="outline"
                  className="w-full h-12 text-base"
                >
                  Scan Another
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {scannedData && qrType === 'document' && (
          <Card className="border-success/50 bg-success/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Scanned Document
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Document Number</p>
                    <p className="font-semibold text-lg">{scannedData.documentNumber}</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-background">
                  <p className="text-xs text-muted-foreground mb-1">Document Type</p>
                  <Badge>{scannedData.documentType}</Badge>
                </div>

                <div className="p-3 rounded-lg bg-background">
                  <p className="text-xs text-muted-foreground mb-1">Entity</p>
                  <p className="text-sm font-medium">{scannedData.entityId}</p>
                </div>

                <div className="p-3 rounded-lg bg-background">
                  <p className="text-xs text-muted-foreground mb-1">Scanned At</p>
                  <p className="text-sm font-medium">
                    {new Date().toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                <Button
                  onClick={verifyDocument}
                  className="w-full h-12 text-base"
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Verify Document
                </Button>

                <Button
                  onClick={resetScanner}
                  variant="outline"
                  className="w-full h-12 text-base"
                >
                  Scan Another
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
