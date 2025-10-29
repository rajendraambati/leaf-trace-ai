import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClientPortalData {
  access: any;
  orders: any[];
  shipments: any[];
  documents: any[];
  invoices: any[];
  notifications: any[];
  stats: {
    total_orders: number;
    pending_orders: number;
    active_shipments: number;
    pending_invoices: number;
    unread_notifications: number;
  };
}

export function useClientPortal() {
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<any[]>([]);

  // Fetch portal data
  const { data: portalData, isLoading, error } = useQuery<ClientPortalData>({
    queryKey: ['client-portal-data'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('client-portal-data');
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Real-time notifications subscription
  useEffect(() => {
    if (!portalData?.access) return;

    const channel = supabase
      .channel('client-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'client_notifications',
          filter: `user_id=eq.${portalData.access.user_id}`
        },
        (payload) => {
          toast.info(payload.new.title, {
            description: payload.new.message
          });
          queryClient.invalidateQueries({ queryKey: ['client-portal-data'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [portalData?.access, queryClient]);

  // Mark notification as read
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('client_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-portal-data'] });
    },
  });

  // Mark all notifications as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!portalData?.access) return;
      const { error } = await supabase
        .from('client_notifications')
        .update({ is_read: true })
        .eq('user_id', portalData.access.user_id)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['client-portal-data'] });
    },
  });

  return {
    portalData,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
  };
}
