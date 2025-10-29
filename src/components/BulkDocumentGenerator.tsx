import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileStack, 
  Loader2,
  CheckCircle,
  XCircle,
  Download,
  FileText
} from 'lucide-react';

type DocumentType = 'tpd_label' | 'dispatch_manifest' | 'invoice' | 'customs_declaration' | 'packing_list';
type EntityType = 'batch' | 'shipment' | 'order' | 'warehouse';

interface BulkGenerationResult {
  entityId: string;
  success: boolean;
  documentNumber?: string;
  error?: string;
}

export function BulkDocumentGenerator() {
  const { toast } = useToast();
  const [documentType, setDocumentType] = useState<DocumentType>('dispatch_manifest');
  const [entityType, setEntityType] = useState<EntityType>('shipment');
  const [entityIds, setEntityIds] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<BulkGenerationResult[]>([]);

  const documentTypes = [
    { value: 'tpd_label', label: 'TPD Labels' },
    { value: 'dispatch_manifest', label: 'Dispatch Manifests' },
    { value: 'invoice', label: 'GST Invoices' },
    { value: 'customs_declaration', label: 'Customs Declarations' },
    { value: 'packing_list', label: 'Packing Lists' }
  ];

  const handleBulkGenerate = async () => {
    const ids = entityIds
      .split('\n')
      .map(id => id.trim())
      .filter(id => id.length > 0);

    if (ids.length === 0) {
      toast({
        title: "No IDs Provided",
        description: "Please enter at least one entity ID",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setResults([]);

    const generationResults: BulkGenerationResult[] = [];

    for (let i = 0; i < ids.length; i++) {
      const entityId = ids[i];
      
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

        generationResults.push({
          entityId,
          success: true,
          documentNumber: data.document.document_number
        });
      } catch (error) {
        console.error(`Error generating document for ${entityId}:`, error);
        generationResults.push({
          entityId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      setProgress(((i + 1) / ids.length) * 100);
      setResults([...generationResults]);
    }

    setIsGenerating(false);

    const successCount = generationResults.filter(r => r.success).length;
    const failCount = generationResults.filter(r => !r.success).length;

    toast({
      title: "Bulk Generation Complete",
      description: `Generated ${successCount} documents successfully. ${failCount} failed.`,
    });
  };

  const downloadResultsCSV = () => {
    const csv = [
      ['Entity ID', 'Status', 'Document Number', 'Error'],
      ...results.map(r => [
        r.entityId,
        r.success ? 'Success' : 'Failed',
        r.documentNumber || '',
        r.error || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bulk-generation-results-${Date.now()}.csv`;
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileStack className="h-5 w-5" />
          Bulk Document Generation
        </CardTitle>
        <CardDescription>
          Generate multiple documents at once from a list of entity IDs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Document Type</label>
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
            <label className="text-sm font-medium">Entity Type</label>
            <Select value={entityType} onValueChange={(value: EntityType) => setEntityType(value)}>
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
          <label className="text-sm font-medium">Entity IDs (one per line)</label>
          <Textarea
            placeholder="BATCH-001&#10;BATCH-002&#10;BATCH-003"
            value={entityIds}
            onChange={(e) => setEntityIds(e.target.value)}
            rows={8}
            disabled={isGenerating}
          />
        </div>

        {isGenerating && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Generating documents...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        <Button
          onClick={handleBulkGenerate}
          disabled={isGenerating || !entityIds.trim()}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileStack className="mr-2 h-5 w-5" />
              Generate All Documents
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Generation Results</h3>
              <Button size="sm" variant="outline" onClick={downloadResultsCSV}>
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
            </div>

            <div className="max-h-64 overflow-auto space-y-2">
              {results.map((result, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{result.entityId}</p>
                      {result.success && result.documentNumber && (
                        <p className="text-xs text-muted-foreground">{result.documentNumber}</p>
                      )}
                      {!result.success && result.error && (
                        <p className="text-xs text-destructive">{result.error}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={result.success ? 'default' : 'destructive'}>
                    {result.success ? 'Success' : 'Failed'}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>{results.filter(r => r.success).length} successful</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                <span>{results.filter(r => !r.success).length} failed</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}