import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { DocumentGenerator } from '@/components/DocumentGenerator';
import { BulkDocumentGenerator } from '@/components/BulkDocumentGenerator';
import { DocumentAnalytics } from '@/components/DocumentAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { 
  FileText, 
  Package, 
  Receipt, 
  FileCheck,
  Search,
  Download,
  Eye,
  Calendar,
  Shield,
  QrCode,
  Settings
} from 'lucide-react';

export default function DocumentManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Fetch recent documents
  const { data: recentDocuments } = useQuery({
    queryKey: ['recent-documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_documents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch document stats
  const { data: stats } = useQuery({
    queryKey: ['document-stats'],
    queryFn: async () => {
      const { data: allDocs } = await supabase
        .from('generated_documents')
        .select('document_type, status');

      const stats = {
        total: allDocs?.length || 0,
        tpd_labels: allDocs?.filter(d => d.document_type === 'tpd_label').length || 0,
        manifests: allDocs?.filter(d => d.document_type === 'dispatch_manifest').length || 0,
        invoices: allDocs?.filter(d => d.document_type === 'invoice').length || 0,
        customs: allDocs?.filter(d => d.document_type === 'customs_declaration').length || 0,
        generated: allDocs?.filter(d => d.status === 'generated').length || 0,
        sent: allDocs?.filter(d => d.status === 'sent').length || 0
      };

      return stats;
    }
  });

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'tpd_label':
        return <FileCheck className="h-4 w-4" />;
      case 'dispatch_manifest':
        return <Package className="h-4 w-4" />;
      case 'invoice':
        return <Receipt className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
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

  const filteredDocuments = recentDocuments?.filter(doc => 
    doc.document_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.entity_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Document Management</h1>
            <p className="text-muted-foreground">
              Generate and manage TPD labels, manifests, invoices, and declarations
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate('/document-templates')}
              variant="outline"
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Templates
            </Button>
            <Button 
              onClick={() => navigate('/document-verification')}
              variant="outline"
              className="gap-2"
            >
              <QrCode className="h-4 w-4" />
              Verify Document
            </Button>
            <Button 
              onClick={() => navigate('/compliance-management')}
              variant="outline"
              className="gap-2"
            >
              <Shield className="h-4 w-4" />
              Compliance Validation
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                TPD Labels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.tpd_labels || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Manifests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.manifests || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.invoices || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="generate" className="space-y-6">
          <TabsList>
            <TabsTrigger value="generate">Generate Document</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Generation</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="recent">Recent Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="generate">
            <DocumentGenerator />
          </TabsContent>

          <TabsContent value="bulk">
            <BulkDocumentGenerator />
          </TabsContent>

          <TabsContent value="analytics">
            <DocumentAnalytics />
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Documents</CardTitle>
                    <CardDescription>View and manage generated documents</CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredDocuments?.map((doc) => (
                    <div 
                      key={doc.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded">
                          {getDocumentIcon(doc.document_type)}
                        </div>
                        <div>
                          <p className="font-medium">{doc.document_number}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{getDocumentTypeLabel(doc.document_type)}</span>
                            <span>•</span>
                            <span>{doc.entity_type}: {doc.entity_id}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={
                          doc.status === 'generated' ? 'default' :
                          doc.status === 'sent' ? 'secondary' :
                          'outline'
                        }>
                          {doc.status}
                        </Badge>
                        
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(doc.created_at).toLocaleDateString()}
                        </div>

                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {(!filteredDocuments || filteredDocuments.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No documents found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}