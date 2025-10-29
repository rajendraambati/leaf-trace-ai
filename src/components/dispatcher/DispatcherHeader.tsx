import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp } from 'lucide-react';

interface DispatcherHeaderProps {
  onRefresh: () => void;
  onGenerateSummary: () => void;
  summaryLoading: boolean;
}

export function DispatcherHeader({ onRefresh, onGenerateSummary, summaryLoading }: DispatcherHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Dispatcher Dashboard</h1>
        <p className="text-muted-foreground">Real-time fleet monitoring and control</p>
      </div>
      <div className="flex gap-2">
        <Button onClick={onRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button onClick={onGenerateSummary} disabled={summaryLoading}>
          <TrendingUp className="h-4 w-4 mr-2" />
          {summaryLoading ? 'Generating...' : 'AI Summary'}
        </Button>
      </div>
    </div>
  );
}
