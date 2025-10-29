import StatCard from '@/components/StatCard';
import { FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface ReportingStatsProps {
  stats: {
    total: number;
    submitted: number;
    draft: number;
    failed: number;
  };
}

export default function ReportingStats({ stats }: ReportingStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatCard
        title="Total Reports"
        value={stats.total}
        icon={FileText}
      />
      <StatCard
        title="Submitted"
        value={stats.submitted}
        icon={CheckCircle}
      />
      <StatCard
        title="Draft"
        value={stats.draft}
        icon={Clock}
      />
      <StatCard
        title="Failed"
        value={stats.failed}
        icon={AlertCircle}
      />
    </div>
  );
}
