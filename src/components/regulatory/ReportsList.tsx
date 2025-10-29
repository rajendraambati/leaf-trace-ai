import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import ReportCard from './ReportCard';
import ReportFilters from './ReportFilters';

interface ReportsListProps {
  reports: any[];
  authorities: any[];
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  filterAuthority: string;
  setFilterAuthority: (value: string) => void;
  onRetry: (reportId: string) => void;
  onDownload: (report: any) => void;
}

export default function ReportsList({
  reports,
  authorities,
  filterStatus,
  setFilterStatus,
  filterAuthority,
  setFilterAuthority,
  onRetry,
  onDownload
}: ReportsListProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>
              View submitted compliance reports and their status
            </CardDescription>
          </div>
          <ReportFilters
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterAuthority={filterAuthority}
            setFilterAuthority={setFilterAuthority}
            authorities={authorities || []}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {reports?.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onRetry={onRetry}
              onDownload={onDownload}
            />
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
  );
}
