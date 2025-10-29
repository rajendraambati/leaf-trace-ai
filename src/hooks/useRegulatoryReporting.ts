import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useRegulatoryReporting() {
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

  return {
    authorities,
    reports,
    reportStats,
    formData,
    setFormData,
    isSubmitting,
    submitReport,
    retryReport,
    downloadReport,
    filterStatus,
    setFilterStatus,
    filterAuthority,
    setFilterAuthority
  };
}
