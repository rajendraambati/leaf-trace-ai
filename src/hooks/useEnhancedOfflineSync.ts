import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface QueueItem {
  id: string;
  table_name: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  created_at: string;
  priority: number; // Higher priority syncs first
}

export function useEnhancedOfflineSync() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Back Online",
        description: "Syncing your offline changes...",
      });
      syncPendingChanges();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Offline Mode",
        description: "Your changes will be saved and synced when back online.",
        variant: "default",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load pending count
  useEffect(() => {
    if (user) {
      loadPendingCount();
    }
  }, [user]);

  const loadPendingCount = async () => {
    try {
      const queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
      setPendingCount(queue.length);
    } catch (error) {
      console.error('Error loading pending count:', error);
    }
  };

  const queueOperation = useCallback(async (
    tableName: string,
    operation: 'insert' | 'update' | 'delete',
    data: any,
    priority: number = 5
  ) => {
    try {
      // Try immediate sync if online
      if (isOnline && user) {
        let result;
        
        switch (operation) {
          case 'insert':
            result = await (supabase.from as any)(tableName).insert(data);
            break;
          case 'update':
            result = await (supabase.from as any)(tableName).update(data).eq('id', data.id);
            break;
          case 'delete':
            result = await (supabase.from as any)(tableName).delete().eq('id', data.id);
            break;
        }

        if (result.error) throw result.error;
        
        return { success: true, synced: true };
      }

      // Queue for later sync
      const queue: QueueItem[] = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
      
      const queueItem: QueueItem = {
        id: `${Date.now()}_${Math.random()}`,
        table_name: tableName,
        operation,
        data,
        created_at: new Date().toISOString(),
        priority
      };

      queue.push(queueItem);
      
      // Sort by priority (higher first) then by created_at
      queue.sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      localStorage.setItem('offlineQueue', JSON.stringify(queue));
      setPendingCount(queue.length);

      return { success: true, synced: false, queued: true };
    } catch (error) {
      console.error('Error queuing operation:', error);
      return { success: false, error };
    }
  }, [isOnline, user]);

  const syncPendingChanges = useCallback(async () => {
    if (!user || !isOnline || isSyncing) return;

    setIsSyncing(true);

    try {
      const queue: QueueItem[] = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
      
      if (queue.length === 0) {
        setIsSyncing(false);
        return { success: true, synced: 0 };
      }

      let syncedCount = 0;
      const remainingQueue: QueueItem[] = [];

      for (const item of queue) {
        try {
          let result;
          
          switch (item.operation) {
            case 'insert':
              result = await (supabase.from as any)(item.table_name).insert(item.data);
              break;
            case 'update':
              result = await (supabase.from as any)(item.table_name).update(item.data).eq('id', item.data.id);
              break;
            case 'delete':
              result = await (supabase.from as any)(item.table_name).delete().eq('id', item.data.id);
              break;
          }

          if (result.error) {
            console.error(`Error syncing ${item.table_name}:`, result.error);
            remainingQueue.push(item);
          } else {
            syncedCount++;
          }
        } catch (error) {
          console.error(`Exception syncing ${item.table_name}:`, error);
          remainingQueue.push(item);
        }
      }

      localStorage.setItem('offlineQueue', JSON.stringify(remainingQueue));
      setPendingCount(remainingQueue.length);
      setLastSyncTime(new Date());

      if (syncedCount > 0) {
        toast({
          title: "Sync Complete",
          description: `Successfully synced ${syncedCount} change(s)`,
        });
      }

      if (remainingQueue.length > 0) {
        toast({
          title: "Partial Sync",
          description: `${remainingQueue.length} change(s) failed to sync. Will retry.`,
          variant: "destructive",
        });
      }

      return { success: true, synced: syncedCount, failed: remainingQueue.length };
    } catch (error) {
      console.error('Error syncing changes:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync offline changes. Will retry automatically.",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsSyncing(false);
    }
  }, [user, isOnline, isSyncing, toast]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      syncPendingChanges();
    }
  }, [isOnline, pendingCount]);

  const clearQueue = useCallback(() => {
    localStorage.setItem('offlineQueue', '[]');
    setPendingCount(0);
  }, []);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncTime,
    queueOperation,
    syncPendingChanges,
    clearQueue
  };
}