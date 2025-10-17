import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MapPin, CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Checkpoint {
  id: string;
  checkpoint_name: string;
  checkpoint_type: string;
  scheduled_time: string;
  actual_time: string | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
  status: string;
  notes: string | null;
}

interface LogisticsCheckpointsProps {
  shipmentId: string;
}

const LogisticsCheckpoints = ({ shipmentId }: LogisticsCheckpointsProps) => {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCheckpoints();
    
    const channel = supabase
      .channel(`checkpoints-${shipmentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'logistics_checkpoints',
          filter: `shipment_id=eq.${shipmentId}`,
        },
        () => {
          fetchCheckpoints();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shipmentId]);

  const fetchCheckpoints = async () => {
    try {
      const { data, error } = await supabase
        .from('logistics_checkpoints')
        .select('*')
        .eq('shipment_id', shipmentId)
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      setCheckpoints(data || []);
    } catch (error) {
      console.error('Error fetching checkpoints:', error);
      toast.error('Failed to load checkpoints');
    } finally {
      setLoading(false);
    }
  };

  const updateCheckpointStatus = async (checkpointId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('logistics_checkpoints')
        .update({
          status,
          actual_time: status === 'reached' ? new Date().toISOString() : null,
        })
        .eq('id', checkpointId);

      if (error) throw error;
      toast.success('Checkpoint status updated');
    } catch (error) {
      console.error('Error updating checkpoint:', error);
      toast.error('Failed to update checkpoint');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'reached':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'missed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'skipped':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getCheckpointColor = (type: string) => {
    switch (type) {
      case 'departure':
        return 'bg-blue-500/20 border-blue-500';
      case 'destination':
        return 'bg-green-500/20 border-green-500';
      case 'waypoint':
        return 'bg-purple-500/20 border-purple-500';
      case 'rest_stop':
        return 'bg-orange-500/20 border-orange-500';
      case 'inspection':
        return 'bg-yellow-500/20 border-yellow-500';
      default:
        return 'bg-muted border-border';
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">Loading checkpoints...</p>
      </Card>
    );
  }

  if (checkpoints.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          No checkpoints configured for this shipment
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <MapPin className="h-5 w-5" />
        Route Checkpoints & Waypoints
      </h2>
      
      <div className="relative space-y-6">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
        
        {checkpoints.map((checkpoint, index) => (
          <div key={checkpoint.id} className="relative pl-12">
            {/* Status indicator */}
            <div className="absolute left-0 flex items-center justify-center w-8 h-8 rounded-full bg-background border-2 border-border">
              {getStatusIcon(checkpoint.status)}
            </div>
            
            <Card className={`p-4 border-2 ${getCheckpointColor(checkpoint.checkpoint_type)}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{checkpoint.checkpoint_name}</h3>
                    <span className="text-xs px-2 py-1 rounded bg-background/50">
                      {checkpoint.checkpoint_type.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      <strong>Scheduled:</strong>{' '}
                      {new Date(checkpoint.scheduled_time).toLocaleString()}
                    </p>
                    {checkpoint.actual_time && (
                      <p>
                        <strong>Actual:</strong>{' '}
                        {new Date(checkpoint.actual_time).toLocaleString()}
                      </p>
                    )}
                    {checkpoint.gps_latitude && checkpoint.gps_longitude && (
                      <p>
                        <strong>Location:</strong>{' '}
                        {checkpoint.gps_latitude.toFixed(4)}, {checkpoint.gps_longitude.toFixed(4)}
                      </p>
                    )}
                    {checkpoint.notes && (
                      <p className="italic">
                        <strong>Notes:</strong> {checkpoint.notes}
                      </p>
                    )}
                  </div>
                </div>
                
                {checkpoint.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateCheckpointStatus(checkpoint.id, 'reached')}
                    >
                      Mark Reached
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateCheckpointStatus(checkpoint.id, 'skipped')}
                    >
                      Skip
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default LogisticsCheckpoints;
