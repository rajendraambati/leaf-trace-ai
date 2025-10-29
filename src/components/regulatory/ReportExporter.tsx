import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, Table } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ReportExporterProps {
  reports: any[];
}

export default function ReportExporter({ reports }: ReportExporterProps) {
  const { toast } = useToast();

  const exportToCSV = () => {
    const headers = ['Report Number', 'Authority', 'Country', 'Type', 'Status', 'Period Start', 'Period End', 'Submitted At'];
    const rows = reports.map(report => [
      report.report_number,
      report.reporting_authorities?.authority_name || '',
      report.reporting_authorities?.countries?.name || '',
      report.report_type,
      report.submission_status,
      report.report_period_start,
      report.report_period_end,
      report.submitted_at || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-reports-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `Exported ${reports.length} reports to CSV`
    });
  };

  const exportToJSON = () => {
    const exportData = reports.map(report => ({
      report_number: report.report_number,
      authority: report.reporting_authorities?.authority_name,
      country: report.reporting_authorities?.countries?.name,
      type: report.report_type,
      status: report.submission_status,
      period: {
        start: report.report_period_start,
        end: report.report_period_end
      },
      submitted_at: report.submitted_at,
      data: report.report_data
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-reports-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `Exported ${reports.length} reports to JSON`
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Reports
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <Table className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON}>
          <FileText className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
