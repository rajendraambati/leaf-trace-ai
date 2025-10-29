import { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import StatCard from '@/components/StatCard';
import { 
  FileText, 
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Calendar,
  Building2,
  RefreshCw,
  Filter,
  TrendingUp
} from 'lucide-react';

export default function RegulatoryReporting() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAuthority, setFilterAuthority] = useState<string>('all');
  const [formData, setFormData] = useState({
    authority_id: '',
    report_type: 'shipment_summary',
    period_start: '',
    period_end: ''
  });

  const { data: authorities } = useQuery({
    queryKey: ['reporting-authorities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reporting_authorities')
        .select('*, countries(*)')
        .eq('is_active', true)
        .order('authority_name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: reports } = useQuery({
    queryKey: ['compliance-reports', filterStatus, filterAuthority],
    queryFn: async () => {
      let query = supabase
        .from('compliance_reports')
        .select('*, reporting_authorities(*, countries(*)), countries(*)')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (filterStatus !== 'all') {
        query = query.eq('submission_status', filterStatus);
      }
      
      if (filterAuthority !== 'all') {
        query = query.eq('authority_id', filterAuthority);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    }
  });

  const reportStats = {
    total: reports?.length || 0,
    submitted: reports?.filter(r => r.submission_status === 'submitted').length || 0,
    draft: reports?.filter(r => r.submission_status === 'draft').length || 0,
    failed: reports?.filter(r => r.submission_status === 'failed').length || 0
  };

  const submitReport = async () => {
    if (!formData.authority_id || !formData.period_start || !formData.period_end) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('submit-compliance-report', {
        body: formData
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['compliance-reports'] });
      
      toast({
        title: "Report Submitted",
        description: `Report ${data.report.report_number} created successfully`
      });

      setFormData({
        authority_id: '',
        report_type: 'shipment_summary',
        period_start: '',
        period_end: ''
      });
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit report",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const retryReport = async (reportId: string) => {
    try {
      const report = reports?.find(r => r.id === reportId);
      if (!report) return;

      const { data, error } = await supabase.functions.invoke('submit-compliance-report', {
        body: {
          authority_id: report.authority_id,
          report_type: report.report_type,
          period_start: report.report_period_start,
          period_end: report.report_period_end
        }
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['compliance-reports'] });
      
      toast({
        title: "Report Resubmitted",
        description: "The report has been resubmitted successfully"
      });
    } catch (error) {
      console.error('Error retrying report:', error);
      toast({
        title: "Retry Failed",
        description: error instanceof Error ? error.message : "Failed to retry report",
        variant: "destructive"
      });
    }
  };

  const downloadReport = (report: any) => {
    const reportData = {
      report_number: report.report_number,
      authority: report.reporting_authorities?.authority_name,
      country: report.reporting_authorities?.countries?.name,
      report_type: report.report_type,
      period: {
        start: report.report_period_start,
        end: report.report_period_end
      },
      status: report.submission_status,
      submitted_at: report.submitted_at,
      data: report.report_data
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.report_number}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Report Downloaded",
      description: `${report.report_number} downloaded successfully`
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'draft': { variant: 'secondary', icon: Clock },
      'submitted': { variant: 'default', icon: CheckCircle },
      'failed': { variant: 'destructive', icon: AlertCircle }
    };
    
    const config = variants[status] || { variant: 'outline', icon: FileText };
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Regulatory Reporting
            </h1>
            <p className="text-muted-foreground">
              Submit compliance reports to regulatory authorities
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Reports"
            value={reportStats.total}
            icon={FileText}
          />
          <StatCard
            title="Submitted"
            value={reportStats.submitted}
            icon={CheckCircle}
          />
          <StatCard
            title="Draft"
            value={reportStats.draft}
            icon={Clock}
          />
          <StatCard
            title="Failed"
            value={reportStats.failed}
            icon={AlertCircle}
          />
        </div>

        {/* Submit Report Form */}
        <Card>
          <CardHeader>
            <CardTitle>Submit New Report</CardTitle>
            <CardDescription>
              Generate and submit compliance reports to authorities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="authority">Reporting Authority *</Label>
                <Select value={formData.authority_id} onValueChange={(value) => setFormData({ ...formData, authority_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select authority" />
                  </SelectTrigger>
                  <SelectContent>
                    {authorities?.map((authority) => (
                      <SelectItem key={authority.id} value={authority.id}>
                        {authority.authority_name} ({authority.countries?.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="report-type">Report Type *</Label>
                <Select value={formData.report_type} onValueChange={(value) => setFormData({ ...formData, report_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shipment_summary">Shipment Summary</SelectItem>
                    <SelectItem value="batch_tracking">Batch Tracking</SelectItem>
                    <SelectItem value="tax_report">Tax Report</SelectItem>
                    <SelectItem value="volume_report">Volume Report</SelectItem>
                    <SelectItem value="compliance_audit">Compliance Audit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start-date">Period Start *</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={formData.period_start}
                  onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">Period End *</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={formData.period_end}
                  onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                />
              </div>
            </div>

            <Button 
              onClick={submitReport} 
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              <Send className="mr-2 h-5 w-5" />
              {isSubmitting ? 'Submitting...' : 'Generate & Submit Report'}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Reports</CardTitle>
                <CardDescription>
                  View submitted compliance reports and their status
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterAuthority} onValueChange={setFilterAuthority}>
                  <SelectTrigger className="w-[180px]">
                    <Building2 className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Authorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Authorities</SelectItem>
                    {authorities?.map((authority) => (
                      <SelectItem key={authority.id} value={authority.id}>
                        {authority.authority_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reports?.map((report) => (
                <div 
                  key={report.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{report.report_number}</p>
                      {getStatusBadge(report.submission_status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {report.reporting_authorities?.authority_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(report.report_period_start).toLocaleDateString()} - {new Date(report.report_period_end).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {report.submission_status === 'failed' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => retryReport(report.id)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => downloadReport(report)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {(!reports || reports.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No reports submitted yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}