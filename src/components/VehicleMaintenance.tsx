import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wrench, AlertTriangle, CheckCircle, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MaintenanceAlert {
  id: string;
  vehicle_id: string;
  maintenance_type: string;
  predicted_date: string;
  actual_date: string | null;
  description: string;
  severity: string;
  ai_confidence: number;
  status: string;
  created_at: string;
}

const VehicleMaintenance = () => {
  const [alerts, setAlerts] = useState<MaintenanceAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaintenanceAlerts();
    
    const channel = supabase
      .channel('maintenance-alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicle_maintenance',
        },
        () => {
          fetchMaintenanceAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMaintenanceAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicle_maintenance')
        .select('*')
        .order('predicted_date', { ascending: true });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching maintenance alerts:', error);
      toast.error('Failed to load maintenance alerts');
    } finally {
      setLoading(false);
    }
  };

  const updateMaintenanceStatus = async (alertId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('vehicle_maintenance')
        .update({
          status,
          actual_date: status === 'completed' ? new Date().toISOString() : null,
        })
        .eq('id', alertId);

      if (error) throw error;
      toast.success('Maintenance status updated');
    } catch (error) {
      console.error('Error updating maintenance:', error);
      toast.error('Failed to update maintenance');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/20 border-red-500 text-red-700 dark:text-red-300';
      case 'high':
        return 'bg-orange-500/20 border-orange-500 text-orange-700 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-500/20 border-yellow-500 text-yellow-700 dark:text-yellow-300';
      default:
        return 'bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300';
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      predicted: "secondary",
      scheduled: "default",
      completed: "outline",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status.toUpperCase()}</Badge>;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">Loading maintenance alerts...</p>
      </Card>
    );
  }

  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && a.status === 'predicted');
  const upcomingAlerts = alerts.filter(a => a.status === 'predicted' || a.status === 'scheduled');
  const completedAlerts = alerts.filter(a => a.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-2 border-red-500/50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/20 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Critical Alerts</p>
              <p className="text-2xl font-bold">{criticalAlerts.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 border-2 border-orange-500/50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500/20 rounded-full">
              <Calendar className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Upcoming</p>
              <p className="text-2xl font-bold">{upcomingAlerts.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 border-2 border-green-500/50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/20 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{completedAlerts.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Maintenance Alerts List */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          AI-Powered Predictive Maintenance
        </h2>
        
        {alerts.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No maintenance alerts. All vehicles are in good condition.
          </p>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card key={alert.id} className={`p-4 border-2 ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{alert.maintenance_type}</h3>
                      {getStatusBadge(alert.status)}
                      <span className="text-xs px-2 py-1 rounded bg-background/50">
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-sm">{alert.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div>
                        <strong>Vehicle ID:</strong> {alert.vehicle_id}
                      </div>
                      <div>
                        <strong>Predicted Date:</strong>{' '}
                        {new Date(alert.predicted_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        <strong>AI Confidence:</strong> {(alert.ai_confidence * 100).toFixed(0)}%
                      </div>
                      {alert.actual_date && (
                        <div>
                          <strong>Completed:</strong>{' '}
                          {new Date(alert.actual_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {(alert.status === 'predicted' || alert.status === 'scheduled') && (
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateMaintenanceStatus(alert.id, 'scheduled')}
                        disabled={alert.status === 'scheduled'}
                      >
                        Schedule
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateMaintenanceStatus(alert.id, 'completed')}
                      >
                        Complete
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default VehicleMaintenance;
