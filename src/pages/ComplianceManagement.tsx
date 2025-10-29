import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ComplianceValidation } from "@/components/ComplianceValidation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { 
  FileCheck, 
  FileText, 
  Download, 
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  FileType
} from "lucide-react";

export default function ComplianceManagement() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedEntity, setSelectedEntity] = useState<{id: string, type: string} | null>(null);
  const [reportType, setReportType] = useState<'customs' | 'excise' | 'gst' | 'compliance_summary'>('compliance_summary');
  const [region, setRegion] = useState('North');
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch recent compliance validations
  const { data: validations } = useQuery({
    queryKey: ['compliance-validations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_validations')
        .select('*')
        .order('validated_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch dispatch compliance checks
  const { data: dispatchChecks } = useQuery({
    queryKey: ['dispatch-compliance-checks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dispatch_compliance_checks')
        .select('*')
        .order('checked_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch regulatory reports
  const { data: reports } = useQuery({
    queryKey: ['regulatory-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('regulatory_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch expiring documents
  const { data: expiringDocs } = useQuery({
    queryKey: ['expiring-documents'],
    queryFn: async () => {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const { data, error } = await supabase
        .from('compliance_documents')
        .select('*')
        .eq('status', 'active')
        .not('expiry_date', 'is', null)
        .lte('expiry_date', thirtyDaysFromNow.toISOString())
        .order('expiry_date', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const generateReport = async () => {
    setIsGenerating(true);
    
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);

      const { data, error } = await supabase.functions.invoke('generate-regulatory-report', {
        body: {
          report_type: reportType,
          region: region,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        }
      });

      if (error) throw error;

      toast({
        title: "Report Generated",
        description: "Your regulatory report has been generated successfully.",
      });
    } catch (error) {
      console.error('Report generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
      case 'cleared':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'failed':
      case 'blocked':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted" />;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Compliance Management</h1>
            <p className="text-muted-foreground">
              Auto-validate documents, flag issues, and generate regulatory reports
            </p>
          </div>
          <Button 
            onClick={() => navigate('/document-management')}
            variant="outline"
            className="gap-2"
          >
            <FileType className="h-4 w-4" />
            Document Generation
          </Button>
        </div>

        <Tabs defaultValue="validation" className="space-y-6">
          <TabsList>
            <TabsTrigger value="validation">Document Validation</TabsTrigger>
            <TabsTrigger value="reports">Regulatory Reports</TabsTrigger>
            <TabsTrigger value="alerts">Expiring Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="validation" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Validation</CardTitle>
                  <CardDescription>
                    Select an entity to validate compliance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Entity Type</Label>
                    <Select 
                      onValueChange={(value) => 
                        setSelectedEntity(prev => ({ id: prev?.id || '', type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select entity type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shipment">Shipment</SelectItem>
                        <SelectItem value="batch">Batch</SelectItem>
                        <SelectItem value="warehouse">Warehouse</SelectItem>
                        <SelectItem value="vehicle">Vehicle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Entity ID</Label>
                    <Input 
                      placeholder="Enter entity ID"
                      value={selectedEntity?.id || ''}
                      onChange={(e) => 
                        setSelectedEntity(prev => ({ id: e.target.value, type: prev?.type || '' }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {selectedEntity?.id && selectedEntity?.type && (
                <ComplianceValidation
                  entityId={selectedEntity.id}
                  entityType={selectedEntity.type as any}
                  region={region}
                />
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Validations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {validations?.map((validation) => (
                    <div 
                      key={validation.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(validation.validation_status)}
                        <div>
                          <p className="font-medium">
                            {validation.entity_type} - {validation.entity_id}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {validation.validation_type} validation
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          validation.validation_status === 'passed' ? 'default' :
                          validation.validation_status === 'warning' ? 'secondary' :
                          'destructive'
                        }>
                          {validation.validation_status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(validation.validated_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dispatch Compliance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dispatchChecks?.map((check) => (
                    <div 
                      key={check.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(check.compliance_status)}
                        <div>
                          <p className="font-medium">
                            Shipment {check.shipment_id}
                          </p>
                          {check.blocking_issues && check.blocking_issues.length > 0 && (
                            <p className="text-sm text-destructive">
                              {check.blocking_issues.length} blocking issue(s)
                            </p>
                          )}
                          {check.warnings && check.warnings.length > 0 && (
                            <p className="text-sm text-warning">
                              {check.warnings.length} warning(s)
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant={
                        check.compliance_status === 'cleared' ? 'default' :
                        check.compliance_status === 'warning' ? 'secondary' :
                        'destructive'
                      }>
                        {check.compliance_status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate Regulatory Report</CardTitle>
                <CardDescription>
                  Create region-specific reports for customs, excise, and GST compliance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Report Type</Label>
                    <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compliance_summary">Compliance Summary</SelectItem>
                        <SelectItem value="customs">Customs Report</SelectItem>
                        <SelectItem value="excise">Excise Report</SelectItem>
                        <SelectItem value="gst">GST Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Region</Label>
                    <Select value={region} onValueChange={setRegion}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="North">North</SelectItem>
                        <SelectItem value="South">South</SelectItem>
                        <SelectItem value="East">East</SelectItem>
                        <SelectItem value="West">West</SelectItem>
                        <SelectItem value="Central">Central</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button 
                      onClick={generateReport} 
                      disabled={isGenerating}
                      className="w-full"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reports?.map((report) => (
                    <div 
                      key={report.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">
                            {report.report_type.replace('_', ' ').toUpperCase()} - {report.region}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(report.report_period_start).toLocaleDateString()} - {new Date(report.report_period_end).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{report.status}</Badge>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Documents Expiring in 30 Days
                </CardTitle>
                <CardDescription>
                  Review and renew documents before they expire
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expiringDocs?.map((doc) => (
                    <div 
                      key={doc.id}
                      className="flex items-center justify-between p-3 border rounded-lg border-warning/50 bg-warning/5"
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-warning" />
                        <div>
                          <p className="font-medium">
                            {doc.document_type.toUpperCase()} - {doc.document_number}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {doc.entity_type}: {doc.entity_id}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-warning">
                          Expires: {new Date(doc.expiry_date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Math.ceil((new Date(doc.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days remaining
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!expiringDocs || expiringDocs.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-success" />
                      <p>No documents expiring in the next 30 days</p>
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