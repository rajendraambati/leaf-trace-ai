import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { FileText, Download, Send, Calendar, Plus, Trash2, Play, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AutomatedReports() {
  const [scheduledReports, setScheduledReports] = useState<any[]>([]);
  const [reportSubmissions, setReportSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const { toast } = useToast();
  const { logAction } = useAuditLog();

  // Form state for new scheduled report
  const [reportType, setReportType] = useState<'gst' | 'fctc' | 'esg' | 'all'>('gst');
  const [schedule, setSchedule] = useState('monthly');
  const [format, setFormat] = useState<'json' | 'csv' | 'xml'>('json');
  const [portalSubmission, setPortalSubmission] = useState(false);
  const [portalUrl, setPortalUrl] = useState('');

  useEffect(() => {
    fetchScheduledReports();
    fetchReportSubmissions();
  }, []);

  const fetchScheduledReports = async () => {
    const { data, error } = await supabase
      .from('scheduled_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setScheduledReports(data || []);
    }
  };

  const fetchReportSubmissions = async () => {
    const { data, error } = await supabase
      .from('report_submissions')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(20);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setReportSubmissions(data || []);
    }
  };

  const createScheduledReport = async () => {
    setLoading(true);
    try {
      const cronExpressions: Record<string, string> = {
        daily: '0 0 * * *',
        weekly: '0 0 * * 0',
        monthly: '0 0 1 * *',
        quarterly: '0 0 1 */3 *',
      };

      const { error } = await supabase.from('scheduled_reports').insert({
        report_type: reportType,
        schedule_cron: cronExpressions[schedule],
        format,
        portal_submission: portalSubmission,
        portal_url: portalSubmission ? portalUrl : null,
      });

      if (error) throw error;

      await logAction({
        action: 'CREATE',
        resource: 'scheduled_reports',
        dataSnapshot: { reportType, schedule, format, portalSubmission },
      });

      toast({
        title: 'Success',
        description: 'Scheduled report created successfully',
      });

      fetchScheduledReports();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleScheduledReport = async (id: string, enabled: boolean) => {
    const { error } = await supabase
      .from('scheduled_reports')
      .update({ enabled })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: `Report ${enabled ? 'enabled' : 'disabled'}`,
      });
      fetchScheduledReports();
    }
  };

  const deleteScheduledReport = async (id: string) => {
    const { error } = await supabase
      .from('scheduled_reports')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Scheduled report deleted',
      });
      fetchScheduledReports();
    }
  };

  const generateReportNow = async (type: string) => {
    setGeneratingReport(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);

      const { data, error } = await supabase.functions.invoke('generate-compliance-report', {
        body: {
          reportType: type,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          format: 'json',
        },
      });

      if (error) throw error;

      await logAction({
        action: 'GENERATE',
        resource: 'compliance_report',
        resourceId: type,
        dataSnapshot: { startDate, endDate },
      });

      // Create blob and download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report-${Date.now()}.json`;
      a.click();

      toast({
        title: 'Success',
        description: 'Report generated and downloaded',
      });

      fetchReportSubmissions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automated Compliance Reports</h1>
          <p className="text-muted-foreground">GST, FCTC, and ESG reporting automation</p>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Configure automated reports for government portals. Reports are generated on schedule and can be automatically submitted to configured endpoints.
        </AlertDescription>
      </Alert>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Generate GST Report</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => generateReportNow('gst')} 
              disabled={generatingReport}
              className="w-full"
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Now
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Generate FCTC Report</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => generateReportNow('fctc')} 
              disabled={generatingReport}
              className="w-full"
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Now
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Generate ESG Report</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => generateReportNow('esg')} 
              disabled={generatingReport}
              className="w-full"
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Now
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Schedule New Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Schedule New Report
          </CardTitle>
          <CardDescription>
            Create automated report generation and submission schedules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={(v: any) => setReportType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gst">GST Report</SelectItem>
                  <SelectItem value="fctc">FCTC Report</SelectItem>
                  <SelectItem value="esg">ESG Report</SelectItem>
                  <SelectItem value="all">All Reports</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Schedule</Label>
              <Select value={schedule} onValueChange={setSchedule}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={format} onValueChange={(v: any) => setFormat(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xml">XML</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Auto Submit to Portal</Label>
              <div className="flex items-center gap-2 h-10">
                <Switch
                  checked={portalSubmission}
                  onCheckedChange={setPortalSubmission}
                />
                <span className="text-sm text-muted-foreground">
                  {portalSubmission ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          {portalSubmission && (
            <div className="space-y-2">
              <Label>Portal URL</Label>
              <Input
                placeholder="https://api.government-portal.gov/submit"
                value={portalUrl}
                onChange={(e) => setPortalUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Configure the government portal endpoint for automatic submission
              </p>
            </div>
          )}

          <Button onClick={createScheduledReport} disabled={loading}>
            <Calendar className="mr-2 h-4 w-4" />
            Create Schedule
          </Button>
        </CardContent>
      </Card>

      {/* Scheduled Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Reports</CardTitle>
          <CardDescription>Manage automated report generation schedules</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Portal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scheduledReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium uppercase">{report.report_type}</TableCell>
                  <TableCell>{report.schedule_cron}</TableCell>
                  <TableCell className="uppercase">{report.format}</TableCell>
                  <TableCell>
                    {report.portal_submission ? (
                      <Badge variant="default">Enabled</Badge>
                    ) : (
                      <Badge variant="outline">Disabled</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={report.enabled}
                      onCheckedChange={(checked) => toggleScheduledReport(report.id, checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generateReportNow(report.report_type)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteScheduledReport(report.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {scheduledReports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No scheduled reports configured
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Report Submissions</CardTitle>
          <CardDescription>History of generated and submitted reports</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Generated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium uppercase">{submission.report_type}</TableCell>
                  <TableCell>
                    {new Date(submission.period_start).toLocaleDateString()} -{' '}
                    {new Date(submission.period_end).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="uppercase">{submission.format}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        submission.status === 'submitted'
                          ? 'default'
                          : submission.status === 'failed'
                          ? 'destructive'
                          : 'outline'
                      }
                    >
                      {submission.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(submission.generated_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {submission.file_url && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={submission.file_url} download>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {reportSubmissions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No report submissions yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
