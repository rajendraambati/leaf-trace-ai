import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Play,
  XCircle,
  TrendingUp,
  Package,
  Truck,
  Database,
  Shield,
  Wrench
} from 'lucide-react';

interface Anomaly {
  id: string;
  anomaly_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  entity_type: string;
  entity_id: string;
  title: string;
  description: string;
  detected_at: string;
  status: 'open' | 'investigating' | 'resolved' | 'escalated';
  resolution_suggested: string;
  resolution_applied?: string;
  resolved_at?: string;
  escalated: boolean;
  root_cause?: string;
  metadata: any;
}

export default function AnomalyMonitor() {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const queryClient = useQueryClient();

  // Fetch anomalies
  const { data: anomalies, isLoading } = useQuery({
    queryKey: ['anomalies', selectedSeverity, selectedType],
    queryFn: async () => {
      let query = supabase
        .from('anomaly_logs')
        .select('*')
        .order('detected_at', { ascending: false })
        .limit(100);

      if (selectedSeverity !== 'all') {
        query = query.eq('severity', selectedSeverity);
      }
      if (selectedType !== 'all') {
        query = query.eq('anomaly_type', selectedType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Anomaly[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Run anomaly detection
  const runDetection = useMutation({
    mutationFn: async (scanType?: string) => {
      const { data, error } = await supabase.functions.invoke('detect-anomalies', {
        body: { scanType },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Scan complete: ${data.detected} anomalies detected`);
      queryClient.invalidateQueries({ queryKey: ['anomalies'] });
    },
    onError: (error) => {
      toast.error(`Detection failed: ${error.message}`);
    },
  });

  // Resolve anomaly
  const resolveAnomaly = useMutation({
    mutationFn: async ({ id, resolution }: { id: string; resolution: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('anomaly_logs')
        .update({ 
          status: 'resolved', 
          resolution_applied: resolution,
          resolved_at: new Date().toISOString(),
          resolved_by: userData.user?.id 
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Anomaly resolved');
      queryClient.invalidateQueries({ queryKey: ['anomalies'] });
    },
  });

  // Escalate anomaly
  const escalateAnomaly = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('anomaly_logs')
        .update({ 
          status: 'escalated',
          escalated: true,
          escalated_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Anomaly escalated to management team');
      queryClient.invalidateQueries({ queryKey: ['anomalies'] });
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'escalated': return <TrendingUp className="h-4 w-4 text-orange-500" />;
      case 'investigating': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'missing_serials': return <Package className="h-4 w-4" />;
      case 'delayed_dispatch': return <Truck className="h-4 w-4" />;
      case 'erp_sync_failed': return <Database className="h-4 w-4" />;
      case 'compliance_sync_failed': return <Shield className="h-4 w-4" />;
      case 'maintenance_overdue': return <Wrench className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const stats = {
    total: anomalies?.length || 0,
    critical: anomalies?.filter(a => a.severity === 'critical').length || 0,
    open: anomalies?.filter(a => a.status === 'open').length || 0,
    escalated: anomalies?.filter(a => a.escalated).length || 0,
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Anomalies</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-red-500">{stats.critical}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.open}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Escalated</p>
                <p className="text-2xl font-bold text-orange-500">{stats.escalated}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Anomaly Detection & Resolution
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => runDetection.mutate(undefined)}
                disabled={runDetection.isPending}
              >
                {runDetection.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Scan All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all" onClick={() => setSelectedType('all')}>All</TabsTrigger>
              <TabsTrigger value="serialization" onClick={() => setSelectedType('missing_serials')}>Serialization</TabsTrigger>
              <TabsTrigger value="logistics" onClick={() => setSelectedType('delayed_dispatch')}>Logistics</TabsTrigger>
              <TabsTrigger value="erp" onClick={() => setSelectedType('erp_sync_failed')}>ERP</TabsTrigger>
              <TabsTrigger value="compliance" onClick={() => setSelectedType('compliance_sync_failed')}>Compliance</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {isLoading ? (
                    <p className="text-muted-foreground text-center py-8">Loading anomalies...</p>
                  ) : anomalies?.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <p className="text-lg font-medium">No anomalies detected</p>
                      <p className="text-muted-foreground">All systems operating normally</p>
                    </div>
                  ) : (
                    anomalies?.map((anomaly) => (
                      <Card key={anomaly.id} className="border-l-4" style={{
                        borderLeftColor: anomaly.severity === 'critical' ? '#ef4444' : 
                                        anomaly.severity === 'high' ? '#f97316' : 
                                        anomaly.severity === 'medium' ? '#eab308' : '#64748b'
                      }}>
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                {getTypeIcon(anomaly.anomaly_type)}
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold">{anomaly.title}</h4>
                                    <Badge variant={getSeverityColor(anomaly.severity)}>
                                      {anomaly.severity}
                                    </Badge>
                                    <div className="flex items-center gap-1">
                                      {getStatusIcon(anomaly.status)}
                                      <span className="text-xs text-muted-foreground">{anomaly.status}</span>
                                    </div>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{anomaly.description}</p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Detected: {new Date(anomaly.detected_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {anomaly.resolution_suggested && (
                              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                                  💡 Suggested Resolution:
                                </p>
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                  {anomaly.resolution_suggested}
                                </p>
                              </div>
                            )}

                            {anomaly.root_cause && (
                              <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-md">
                                <p className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">
                                  🔍 AI Root Cause Analysis:
                                </p>
                                <p className="text-sm text-purple-800 dark:text-purple-200">
                                  {anomaly.root_cause}
                                </p>
                              </div>
                            )}

                            {anomaly.status === 'open' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => resolveAnomaly.mutate({ 
                                    id: anomaly.id, 
                                    resolution: anomaly.resolution_suggested || 'Manually resolved' 
                                  })}
                                  disabled={resolveAnomaly.isPending}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark Resolved
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => escalateAnomaly.mutate(anomaly.id)}
                                  disabled={escalateAnomaly.isPending}
                                >
                                  <TrendingUp className="h-4 w-4 mr-2" />
                                  Escalate
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
