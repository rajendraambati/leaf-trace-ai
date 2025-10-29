import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { AISummary } from '@/hooks/useDispatcherData';

interface AISummaryCardProps {
  summary: AISummary;
}

export function AISummaryCard({ summary }: AISummaryCardProps) {
  return (
    <Card className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10">
      <h2 className="text-xl font-semibold mb-4">AI Operations Summary</h2>
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-sm text-muted-foreground">Active Trips</p>
          <p className="text-2xl font-bold">{summary.statistics.active_trips}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Delayed Trips</p>
          <p className="text-2xl font-bold text-red-500">{summary.statistics.delayed_trips}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Avg Driver Mood</p>
          <p className="text-2xl font-bold">{summary.statistics.average_mood.toFixed(1)}/5</p>
        </div>
      </div>
      
      {summary.critical_alerts.length > 0 && (
        <div className="mb-4">
          <p className="font-semibold mb-2 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Critical Alerts
          </p>
          <ul className="list-disc list-inside space-y-1">
            {summary.critical_alerts.map((alert, i) => (
              <li key={i} className="text-sm">{alert}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="font-semibold mb-2">AI Recommendations</p>
        <ul className="list-disc list-inside space-y-1">
          {summary.recommendations.map((rec, i) => (
            <li key={i} className="text-sm">{rec}</li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
