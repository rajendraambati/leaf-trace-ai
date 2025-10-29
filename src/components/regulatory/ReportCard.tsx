import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Building2, Download, RefreshCw, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';

interface ReportCardProps {
  report: any;
  onRetry: (reportId: string) => void;
  onDownload: (report: any) => void;
}

export default function ReportCard({ report, onRetry, onDownload }: ReportCardProps) {
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
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
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
            onClick={() => onRetry(report.id)}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => onDownload(report)}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
