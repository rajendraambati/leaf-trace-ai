import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Search,
  FileText,
  Calendar,
  MapPin,
  QrCode,
  Loader2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { parseDocumentQRData } from '@/utils/qrcode';

export default function DocumentVerification() {
  const [searchParams] = useSearchParams();
  const [documentNumber, setDocumentNumber] = useState(searchParams.get('doc') || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const { data: recentScans } = useQuery({
    queryKey: ['recent-document-scans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_tracking')
        .select('*, generated_documents(*)')
        .order('scan_timestamp', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  const verifyDocument = async (docNumber: string) => {
    setIsSearching(true);
    setVerificationResult(null);

    try {
      const { data: document, error } = await supabase
        .from('generated_documents')
        .select('*')
        .eq('document_number', docNumber)
        .single();

      if (error) throw error;

      if (document) {
        setVerificationResult({
          verified: true,
          document,
          message: 'Document verified successfully'
        });
      } else {
        setVerificationResult({
          verified: false,
          message: 'Document not found in system'
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationResult({
        verified: false,
        message: 'Document verification failed'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      verifyDocument(searchQuery.trim());
    }
  };

  const handleQRScan = (qrData: string) => {
    try {
      const parsed = parseDocumentQRData(qrData);
      if (parsed && parsed.documentNumber) {
        setSearchQuery(parsed.documentNumber);
        verifyDocument(parsed.documentNumber);
      }
    } catch (error) {
      console.error('Error parsing QR data:', error);
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'tpd_label': 'TPD Label',
      'dispatch_manifest': 'Dispatch Manifest',
      'invoice': 'GST Invoice',
      'customs_declaration': 'Customs Declaration',
      'packing_list': 'Packing List'
    };
    return labels[type] || type;
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Document Verification</h1>
            <p className="text-muted-foreground">
              Verify authenticity and track documents using QR codes or document numbers
            </p>
          </div>
          <Shield className="h-12 w-12 text-primary" />
        </div>

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Verify Document
            </CardTitle>
            <CardDescription>
              Enter document number or scan QR code to verify
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter document number (e.g., TPD-LABEL-1234567890)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Verification Result */}
            {verificationResult && (
              <Alert variant={verificationResult.verified ? 'default' : 'destructive'}>
                <div className="flex items-start gap-3">
                  {verificationResult.verified ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <div className="flex-1">
                    <AlertDescription className="font-semibold mb-2">
                      {verificationResult.message}
                    </AlertDescription>
                    
                    {verificationResult.verified && verificationResult.document && (
                      <div className="grid gap-4 md:grid-cols-2 mt-4">
                        <div>
                          <p className="text-sm font-medium mb-1">Document Type</p>
                          <p className="text-sm text-muted-foreground">
                            {getDocumentTypeLabel(verificationResult.document.document_type)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Status</p>
                          <Badge variant={
                            verificationResult.document.status === 'generated' ? 'default' :
                            verificationResult.document.status === 'sent' ? 'secondary' :
                            'outline'
                          }>
                            {verificationResult.document.status}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Entity</p>
                          <p className="text-sm text-muted-foreground">
                            {verificationResult.document.entity_type}: {verificationResult.document.entity_id}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Generated</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(verificationResult.document.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {verificationResult.verified && verificationResult.document?.qr_code_data && (
                      <div className="mt-4 flex justify-center">
                        <div className="p-4 bg-white rounded-lg border inline-block">
                          <QRCodeSVG
                            value={verificationResult.document.qr_code_data}
                            size={150}
                            level="H"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Recent Scans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Recent Scans
            </CardTitle>
            <CardDescription>
              Latest document verification scans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentScans && recentScans.length > 0 ? (
                recentScans.map((scan) => (
                  <div 
                    key={scan.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{scan.qr_code}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(scan.scan_timestamp).toLocaleString()}</span>
                          {scan.scan_location && (
                            <>
                              <span>•</span>
                              <MapPin className="h-3 w-3" />
                              <span>{scan.scan_location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        setSearchQuery(scan.qr_code);
                        verifyDocument(scan.qr_code);
                      }}
                    >
                      Verify
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <QrCode className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No recent scans</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}