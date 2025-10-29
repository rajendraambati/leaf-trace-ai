import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  generateTPDLabelPDF,
  generateDispatchManifestPDF,
  generateInvoicePDF,
  generateCustomsDeclarationPDF
} from '@/utils/pdfGenerator';

type DocumentType = 'tpd_label' | 'dispatch_manifest' | 'invoice' | 'customs_declaration' | 'packing_list';
type EntityType = 'batch' | 'shipment' | 'order' | 'warehouse';

interface GenerateDocumentParams {
  documentType: DocumentType;
  entityId: string;
  entityType: EntityType;
  customData?: any;
  templateId?: string;
}

export function useDocumentGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<any>(null);
  const { toast } = useToast();

  const generateDocument = async (params: GenerateDocumentParams) => {
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-document', {
        body: {
          document_type: params.documentType,
          entity_id: params.entityId,
          entity_type: params.entityType,
          template_id: params.templateId,
          custom_data: params.customData
        }
      });

      if (error) throw error;

      setGeneratedDocument(data.document);

      toast({
        title: "Document Generated",
        description: `Document ${data.document.document_number} created successfully`,
      });

      return data;
    } catch (error) {
      console.error('Error generating document:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate document",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadDocumentPDF = async (document: any, qrCodeData?: string) => {
    try {
      const docData = { ...document.document_data, qr_code_data: qrCodeData };

      switch (document.document_type) {
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
          throw new Error('Unsupported document type for PDF generation');
      }

      toast({
        title: "PDF Downloaded",
        description: "Document has been downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const fetchDocuments = async (filters?: {
    documentType?: DocumentType;
    entityId?: string;
    status?: string;
    limit?: number;
  }) => {
    try {
      let query = supabase
        .from('generated_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.documentType) {
        query = query.eq('document_type', filters.documentType);
      }
      if (filters?.entityId) {
        query = query.eq('entity_id', filters.entityId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Fetch Failed",
        description: "Failed to fetch documents",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateDocumentStatus = async (documentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('generated_documents')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: "Document status has been updated",
      });
    } catch (error) {
      console.error('Error updating document status:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update document status",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getDocumentTemplates = async (documentType?: DocumentType) => {
    try {
      let query = supabase
        .from('document_templates')
        .select('*')
        .eq('is_active', true);

      if (documentType) {
        query = query.eq('template_type', documentType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Fetch Failed",
        description: "Failed to fetch document templates",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    isGenerating,
    generatedDocument,
    generateDocument,
    downloadDocumentPDF,
    fetchDocuments,
    updateDocumentStatus,
    getDocumentTemplates,
    setGeneratedDocument
  };
}