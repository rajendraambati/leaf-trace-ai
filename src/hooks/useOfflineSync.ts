import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingOperations();
      toast.success('Back online - syncing data...');
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are offline - changes will sync when online');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending operations on mount
    checkPendingOperations();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkPendingOperations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { count } = await supabase
      .from('offline_sync_queue')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('synced', false);

    setPendingSync(count || 0);
  };

  const queueOperation = async (
    tableName: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    data: any
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('offline_sync_queue').insert({
      user_id: user.id,
      table_name: tableName,
      operation,
      data
    });

    setPendingSync(prev => prev + 1);

    if (isOnline) {
      syncPendingOperations();
    }
  };

  const syncPendingOperations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: operations } = await supabase
      .from('offline_sync_queue')
      .select('*')
      .eq('user_id', user.id)
      .eq('synced', false)
      .order('created_at');

    if (!operations || operations.length === 0) return;

    for (const op of operations) {
      try {
        const tableName = op.table_name as string;
        const opData = op.data as any;

        switch (op.operation) {
          case 'INSERT':
            await (supabase as any).from(tableName).insert(opData);
            break;
          case 'UPDATE':
            await (supabase as any).from(tableName).update(opData).eq('id', opData.id);
            break;
          case 'DELETE':
            await (supabase as any).from(tableName).delete().eq('id', opData.id);
            break;
        }

        // Mark as synced
        await supabase
          .from('offline_sync_queue')
          .update({ synced: true, synced_at: new Date().toISOString() })
          .eq('id', op.id);

        setPendingSync(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Sync error:', error);
      }
    }

    toast.success('Data synced successfully');
  };

  return {
    isOnline,
    pendingSync,
    queueOperation,
    syncNow: syncPendingOperations
  };
}
