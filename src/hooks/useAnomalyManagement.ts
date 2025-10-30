import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Anomaly {
  id: string;
  anomaly_type: string;
  severity: string;
  status: string;
  title: string;
  description: string;
  suggested_resolution?: string | null;
  ai_root_cause?: string | null;
  root_cause?: string | null;
  detected_at: string;
  resolved_at?: string | null;
  resolved_by?: string | null;
  resolution_notes?: string | null;
  escalated_at?: string | null;
  escalated_to?: string | null;
  escalation_reason?: string | null;
  auto_resolved?: boolean;
  metadata?: any;
  affected_resource_type?: string | null;
  affected_resource_id?: string | null;
  created_at: string;
  updated_at: string;
  detected_by?: string;
  entity_type: string;
  entity_id: string;
  escalated?: boolean;
  resolution_applied?: string;
  impact_assessment?: string;
  resolution_suggested?: string;
}

export interface ResolutionHistory {
  id: string;
  anomaly_id: string;
  action: string;
  performed_by: string | null;
  performed_at: string;
  notes: string | null;
  metadata: any;
}

export const useAnomalyManagement = () => {
  const queryClient = useQueryClient();

  // Fetch anomalies with optional filters
  const useAnomalies = (filters?: { 
    severity?: string; 
    type?: string; 
    status?: string;
  }) => {
    return useQuery({
      queryKey: ['anomalies', filters],
      queryFn: async () => {
        let query = supabase
          .from('anomaly_logs')
          .select('*')
          .order('detected_at', { ascending: false });

        if (filters?.severity) {
          query = query.eq('severity', filters.severity);
        }
        if (filters?.type) {
          query = query.eq('anomaly_type', filters.type);
        }
        if (filters?.status) {
          query = query.eq('status', filters.status);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as Anomaly[];
      },
      refetchInterval: 30000, // Refresh every 30 seconds
    });
  };

  // Fetch resolution history for an anomaly
  const useResolutionHistory = (anomalyId: string) => {
    return useQuery({
      queryKey: ['resolution-history', anomalyId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('anomaly_resolution_history')
          .select('*')
          .eq('anomaly_id', anomalyId)
          .order('performed_at', { ascending: false });

        if (error) throw error;
        return data as ResolutionHistory[];
      },
      enabled: !!anomalyId,
    });
  };

  // Trigger anomaly detection
  const detectAnomalies = useMutation({
    mutationFn: async (scanType?: string) => {
      const { data, error } = await supabase.functions.invoke('detect-anomalies', {
        body: { scanType }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Scan complete: ${data.detected} anomalies detected`);
      queryClient.invalidateQueries({ queryKey: ['anomalies'] });
    },
    onError: (error) => {
      toast.error('Failed to run anomaly detection: ' + error.message);
    }
  });

  // Resolve an anomaly
  const resolveAnomaly = useMutation({
    mutationFn: async ({ 
      anomalyId, 
      resolutionNotes,
      autoResolved = false
    }: { 
      anomalyId: string; 
      resolutionNotes: string;
      autoResolved?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('anomaly_logs')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
          resolution_notes: resolutionNotes,
          auto_resolved: autoResolved
        })
        .eq('id', anomalyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Anomaly resolved successfully');
      queryClient.invalidateQueries({ queryKey: ['anomalies'] });
      queryClient.invalidateQueries({ queryKey: ['resolution-history'] });
    },
    onError: (error) => {
      toast.error('Failed to resolve anomaly: ' + error.message);
    }
  });

  // Escalate an anomaly
  const escalateAnomaly = useMutation({
    mutationFn: async ({ 
      anomalyId, 
      escalationReason,
      escalatedTo
    }: { 
      anomalyId: string; 
      escalationReason: string;
      escalatedTo?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('anomaly_logs')
        .update({
          status: 'escalated',
          escalated_at: new Date().toISOString(),
          escalated_to: escalatedTo || null,
          escalation_reason: escalationReason
        })
        .eq('id', anomalyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Anomaly escalated to management');
      queryClient.invalidateQueries({ queryKey: ['anomalies'] });
      queryClient.invalidateQueries({ queryKey: ['resolution-history'] });
    },
    onError: (error) => {
      toast.error('Failed to escalate anomaly: ' + error.message);
    }
  });

  // Mark anomaly as investigating
  const investigateAnomaly = useMutation({
    mutationFn: async (anomalyId: string) => {
      const { data, error } = await supabase
        .from('anomaly_logs')
        .update({ status: 'investigating' })
        .eq('id', anomalyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.info('Marked anomaly as under investigation');
      queryClient.invalidateQueries({ queryKey: ['anomalies'] });
    },
    onError: (error) => {
      toast.error('Failed to update status: ' + error.message);
    }
  });

  return {
    useAnomalies,
    useResolutionHistory,
    detectAnomalies,
    resolveAnomaly,
    escalateAnomaly,
    investigateAnomaly
  };
};
