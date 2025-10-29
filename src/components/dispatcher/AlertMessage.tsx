import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, CheckCircle, Wrench, AlertCircle, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AlertType = 'reroute' | 'success' | 'maintenance' | 'delay' | 'info';

interface AlertMessageProps {
  type: AlertType;
  message: string;
  timestamp?: string;
  vehicleId?: string;
}

export function AlertMessage({ type, message, timestamp, vehicleId }: AlertMessageProps) {
  const getAlertConfig = (alertType: AlertType) => {
    switch (alertType) {
      case 'reroute':
        return {
          icon: <MapPin className="h-5 w-5" />,
          bgColor: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
          badgeColor: 'bg-blue-500',
          iconColor: 'text-blue-600 dark:text-blue-400'
        };
      case 'success':
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          bgColor: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
          badgeColor: 'bg-green-500',
          iconColor: 'text-green-600 dark:text-green-400'
        };
      case 'maintenance':
        return {
          icon: <Wrench className="h-5 w-5" />,
          bgColor: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800',
          badgeColor: 'bg-orange-500',
          iconColor: 'text-orange-600 dark:text-orange-400'
        };
      case 'delay':
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          bgColor: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
          badgeColor: 'bg-red-500',
          iconColor: 'text-red-600 dark:text-red-400'
        };
      default:
        return {
          icon: <Truck className="h-5 w-5" />,
          bgColor: 'bg-slate-50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800',
          badgeColor: 'bg-slate-500',
          iconColor: 'text-slate-600 dark:text-slate-400'
        };
    }
  };

  const config = getAlertConfig(type);

  return (
    <Card className={cn('p-4 border-l-4 transition-all hover:shadow-md', config.bgColor)}>
      <div className="flex items-start gap-3">
        <div className={cn('mt-0.5', config.iconColor)}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {vehicleId && (
              <Badge className={cn('text-xs', config.badgeColor)}>
                {vehicleId}
              </Badge>
            )}
            {timestamp && (
              <span className="text-xs text-muted-foreground">
                {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed">{message}</p>
        </div>
      </div>
    </Card>
  );
}
