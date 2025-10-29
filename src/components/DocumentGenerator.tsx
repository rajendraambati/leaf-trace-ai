import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import {
  FileText, 
  Package, 
  Receipt, 
  FileCheck, 
  Download,
  Loader2,
  QrCode
} from 'lucide-react';

type DocumentType = 'tpd_label' | 'dispatch_manifest' | 'invoice' | 'customs_declaration' | 'packing_list';

interface DocumentGeneratorProps {
  entityId?: string;
  entityType?: 'batch' | 'shipment' | 'order' | 'warehouse';
}

export function DocumentGenerator({ entityId: initialEntityId, entityType: initialEntityType }: DocumentGeneratorProps) {
  const { toast } = useToast();
  const [documentType, setDocumentType] = useState<DocumentType>('dispatch_manifest');
  const [entityId, setEntityId] = useState(initialEntityId || '');
  const [entityType, setEntityType] = useState(initialEntityType || 'shipment');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<any>(null);
  const [qrCodeData, setQrCodeData] = useState<string>('');

  const documentTypes = [
    { value: 'tpd_label', label: 'TPD Label', icon: FileCheck },
    { value: 'dispatch_manifest', label: 'Dispatch Manifest', icon: Package },
    { value: 'invoice', label: 'GST Invoice', icon: Receipt },
    { value: 'customs_declaration', label: 'Customs Declaration', icon: FileText },
    { value: 'packing_list', label: 'Packing List', icon: FileText }
  ];

  const handleGenerate = async () => {
    if (!entityId) {
      toast({
        title: "Missing Information",
        description: "Please provide an entity ID",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-document', {
        body: {
          document_type: documentType,
          entity_id: entityId,
          entity_type: entityType,
          custom_data: {}
        }
      });

      if (error) throw error;

      setGeneratedDocument(data.document);
      setQrCodeData(data.qr_code_data);

      toast({
        title: "Document Generated",
        description: `${documentTypes.find(d => d.value === documentType)?.label} created successfully`,
      });
    } catch (error) {
      console.error('Error generating document:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    const svg = document.querySelector('svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      canvas.width = 200;
      canvas.height = 200;
      
      img.onload = () => {
        ctx?.drawImage(img, 0, 0);
        const url = canvas.toDataURL();
        const link = document.createElement('a');
        link.download = `qr-${generatedDocument.document_number}.png`;
        link.href = url;
        link.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  const handleDownloadPDF = async () => {
    if (!generatedDocument) return;

    try {
      const { 
        generateTPDLabelPDF, 
        generateDispatchManifestPDF, 
        generateInvoicePDF,
        generateCustomsDeclarationPDF 
      } = await import('@/utils/pdfGenerator');
      
      const docData = { ...generatedDocument.document_data, qr_code_data: qrCodeData };

      switch (generatedDocument.document_type) {
        case 'tpd_label':
          await generateTPDLabelPDF(docData);
          break;
        case 'dispatch_manifest':
          await generateDispatchManifestPDF(docData);
          break;
        case 'invoice':
          await generateInvoicePDF(docData);
          break;
        case 'customs_declaration':
          await generateCustomsDeclarationPDF(docData);
          break;
        default:
          toast({
            title: "Unsupported Format",
            description: "PDF generation not available for this document type",
            variant: "destructive",
          });
      }

      toast({
        title: "PDF Downloaded",
        description: "Document PDF has been generated successfully",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePrintDocument = () => {
    if (!generatedDocument) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Document - ${generatedDocument.document_number}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { text-align: center; }
              .info { margin: 10px 0; }
              .label { font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>${documentTypes.find(d => d.value === generatedDocument.document_type)?.label}</h1>
            <div class="info"><span class="label">Document Number:</span> ${generatedDocument.document_number}</div>
            <div class="info"><span class="label">Status:</span> ${generatedDocument.status}</div>
            <div class="info"><span class="label">Entity:</span> ${generatedDocument.entity_type}: ${generatedDocument.entity_id}</div>
            <div class="info"><span class="label">Generated:</span> ${new Date(generatedDocument.created_at).toLocaleString()}</div>
            <hr/>
            <pre>${JSON.stringify(generatedDocument.document_data, null, 2)}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const SelectedIcon = documentTypes.find(d => d.value === documentType)?.icon || FileText;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SelectedIcon className="h-5 w-5" />
            Document Generator
          </CardTitle>
          <CardDescription>
            Generate TPD labels, manifests, invoices, and declarations with QR codes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={documentType} onValueChange={(value: DocumentType) => setDocumentType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Entity Type</Label>
              <Select value={entityType} onValueChange={(value: any) => setEntityType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="batch">Batch</SelectItem>
                  <SelectItem value="shipment">Shipment</SelectItem>
                  <SelectItem value="order">Order</SelectItem>
                  <SelectItem value="warehouse">Warehouse</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Entity ID</Label>
            <Input
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              placeholder="Enter batch ID, shipment ID, etc."
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !entityId}
            className="w-full"
            size="lg"
          >
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <FileText className="mr-2 h-5 w-5" />
            Generate Document
          </Button>
        </CardContent>
      </Card>

      {generatedDocument && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-success" />
              Generated Document
            </CardTitle>
            <CardDescription>
              Document Number: {generatedDocument.document_number}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Document Type</Label>
                <p className="text-sm font-medium">
                  {documentTypes.find(d => d.value === generatedDocument.document_type)?.label}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <p className="text-sm font-medium capitalize">{generatedDocument.status}</p>
              </div>

              <div className="space-y-2">
                <Label>Entity</Label>
                <p className="text-sm font-medium">
                  {generatedDocument.entity_type}: {generatedDocument.entity_id}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Generated At</Label>
                <p className="text-sm font-medium">
                  {new Date(generatedDocument.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="mb-2 block">Document Data</Label>
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-xs overflow-auto max-h-64">
                  {JSON.stringify(generatedDocument.document_data, null, 2)}
                </pre>
              </div>
            </div>

            {qrCodeData && (
              <div className="border-t pt-4">
                <Label className="mb-4 block flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  QR Code for Tracking & Verification
                </Label>
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-white rounded-lg border">
                    <QRCodeSVG
                      value={qrCodeData}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <Button onClick={downloadQRCode} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download QR Code
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button className="flex-1" variant="outline" onClick={handleDownloadPDF}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button className="flex-1" variant="outline" onClick={handlePrintDocument}>
                <FileText className="mr-2 h-4 w-4" />
                Print Document
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}