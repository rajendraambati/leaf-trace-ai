import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, X } from 'lucide-react';
import { AlertMessage } from './AlertMessage';
import { LogisticsAlert, getSampleAlerts } from '@/utils/alertMessages';

export function LiveAlertsPanel() {
  const [alerts, setAlerts] = useState<LogisticsAlert[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Load sample alerts
    setAlerts(getSampleAlerts());
  }, []);

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg z-50"
      >
        <Bell className="h-5 w-5" />
        {alerts.length > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {alerts.length}
          </span>
        )}
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] shadow-2xl z-50">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Live Alerts</h3>
          {alerts.length > 0 && (
            <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
              {alerts.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {alerts.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllAlerts}
              className="text-xs h-8"
            >
              Clear all
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsVisible(false)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="p-4 space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No active alerts</p>
              <p className="text-xs mt-1">You're all caught up! 🎉</p>
            </div>
          ) : (
            alerts.map(alert => (
              <div key={alert.id} className="relative group">
                <AlertMessage {...alert} />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => dismissAlert(alert.id)}
                  className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
