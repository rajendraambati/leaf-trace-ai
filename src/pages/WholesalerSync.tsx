import { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import StatCard from '@/components/StatCard';
import { RefreshCw, Database, CheckCircle, XCircle, Clock, ArrowRightLeft } from 'lucide-react';

export default function WholesalerSync() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncConfig, setSyncConfig] = useState({
    sync_type: 'pull',
    entity_type: 'all'
  });

  const { data: syncLogs } = useQuery({
    queryKey: ['wholesaler-erp-sync-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wholesaler_erp_sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    }
  });

  const syncStats = {
    total: syncLogs?.length || 0,
    completed: syncLogs?.filter(l => l.status === 'completed').length || 0,
    failed: syncLogs?.filter(l => l.status === 'failed').length || 0,
    inProgress: syncLogs?.filter(l => l.status === 'in_progress').length || 0
  };

  const startSync = async () => {
    setIsSyncing(true);

    try {
      const { data, error } = await supabase.functions.invoke('wholesaler-erp-sync', {
        body: syncConfig
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['wholesaler-erp-sync-logs'] });
      queryClient.invalidateQueries({ queryKey: ['retailers'] });
      queryClient.invalidateQueries({ queryKey: ['retailer-orders'] });
      
      toast({
        title: "Sync Started",
        description: `ERP sync initiated with ${data.records_processed} records processed`
      });
    } catch (error) {
      console.error('Error starting sync:', error);
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to start sync",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'completed': { variant: 'default', icon: CheckCircle },
      'failed': { variant: 'destructive', icon: XCircle },
      'in_progress': { variant: 'secondary', icon: Clock },
      'pending': { variant: 'outline', icon: Clock }
    };
    const config = variants[status] || { variant: 'outline', icon: Database };
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Database className="h-8 w-8" />
              Wholesaler ERP Synchronization
            </h1>
            <p className="text-muted-foreground">
              Sync data with wholesaler ERP systems for full supply chain visibility
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Total Syncs" value={syncStats.total} icon={Database} />
          <StatCard title="Completed" value={syncStats.completed} icon={CheckCircle} />
          <StatCard title="Failed" value={syncStats.failed} icon={XCircle} />
          <StatCard title="In Progress" value={syncStats.inProgress} icon={Clock} />
        </div>

        {/* Sync Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Initiate Synchronization</CardTitle>
            <CardDescription>
              Configure and start data synchronization with wholesaler ERP
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Sync Direction</Label>
                <Select value={syncConfig.sync_type} onValueChange={(value) => setSyncConfig({ ...syncConfig, sync_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pull">Pull from ERP</SelectItem>
                    <SelectItem value="push">Push to ERP</SelectItem>
                    <SelectItem value="bidirectional">Bidirectional Sync</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Entity Type</Label>
                <Select value={syncConfig.entity_type} onValueChange={(value) => setSyncConfig({ ...syncConfig, entity_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Entities</SelectItem>
                    <SelectItem value="retailers">Retailers Only</SelectItem>
                    <SelectItem value="orders">Orders Only</SelectItem>
                    <SelectItem value="campaigns">Campaigns Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={startSync} 
              disabled={isSyncing}
              className="w-full"
              size="lg"
            >
              <RefreshCw className={`mr-2 h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Start Synchronization'}
            </Button>
          </CardContent>
        </Card>

        {/* Sync Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Synchronization History</CardTitle>
            <CardDescription>
              View past synchronization attempts and their results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {syncLogs?.map((log) => (
                <div 
                  key={log.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                      <p className="font-semibold">{log.sync_type} - {log.entity_type}</p>
                      {getStatusBadge(log.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                      <span>Processed: {log.records_processed}</span>
                      {log.records_failed > 0 && (
                        <span className="text-destructive">Failed: {log.records_failed}</span>
                      )}
                    </div>
                    {log.error_message && (
                      <p className="text-sm text-destructive mt-1">{log.error_message}</p>
                    )}
                  </div>
                </div>
              ))}

              {(!syncLogs || syncLogs.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No synchronization history yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
