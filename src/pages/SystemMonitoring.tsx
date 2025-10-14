import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, Server, AlertCircle, CheckCircle } from "lucide-react";
import StatCard from "@/components/StatCard";

const SystemMonitoring = () => {
  const [systemStatus, setSystemStatus] = useState<'operational' | 'degraded' | 'down'>('operational');

  // Monitor recent audit logs
  const { data: recentLogs } = useQuery({
    queryKey: ['recent-audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Monitor database health
  const { data: dbHealth } = useQuery({
    queryKey: ['db-health'],
    queryFn: async () => {
      const tables = [
        'farmers',
        'procurement_batches',
        'shipments',
        'warehouse_inventory',
        'compliance_audits'
      ];
      
      const health = await Promise.all(
        tables.map(async (table) => {
          try {
            const { count, error } = await supabase
              .from(table as any)
              .select('*', { count: 'exact', head: true });
            
            return {
              table,
              status: error ? 'error' : 'healthy',
              count: count || 0,
              error: error?.message
            };
          } catch (err) {
            return {
              table,
              status: 'error',
              count: 0,
              error: err instanceof Error ? err.message : 'Unknown error'
            };
          }
        })
      );
      
      return health;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Monitor error rate
  const { data: errorMetrics } = useQuery({
    queryKey: ['error-metrics'],
    queryFn: async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('audit_logs')
        .select('status')
        .gte('created_at', oneHourAgo);
      
      if (error) throw error;
      
      const total = data.length;
      const errors = data.filter(log => log.status === 'error').length;
      const errorRate = total > 0 ? (errors / total) * 100 : 0;
      
      return {
        total,
        errors,
        errorRate: errorRate.toFixed(2)
      };
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (errorMetrics && parseFloat(errorMetrics.errorRate) > 10) {
      setSystemStatus('degraded');
    } else if (errorMetrics && parseFloat(errorMetrics.errorRate) > 25) {
      setSystemStatus('down');
    } else {
      setSystemStatus('operational');
    }
  }, [errorMetrics]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'down':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">Real-time system health and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(systemStatus)} animate-pulse`} />
          <Badge variant={systemStatus === 'operational' ? 'default' : 'destructive'}>
            {systemStatus.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Requests (1h)"
          value={errorMetrics?.total || 0}
          icon={Activity}
        />
        <StatCard
          title="Error Rate (1h)"
          value={`${errorMetrics?.errorRate || 0}%`}
          icon={AlertCircle}
        />
        <StatCard
          title="Database Tables"
          value={dbHealth?.length || 0}
          icon={Database}
        />
        <StatCard
          title="Healthy Services"
          value={dbHealth?.filter(h => h.status === 'healthy').length || 0}
          icon={CheckCircle}
        />
      </div>

      <Tabs defaultValue="database" className="w-full">
        <TabsList>
          <TabsTrigger value="database">Database Health</TabsTrigger>
          <TabsTrigger value="logs">Recent Activity</TabsTrigger>
          <TabsTrigger value="backend">Backend Access</TabsTrigger>
        </TabsList>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Status</CardTitle>
              <CardDescription>Monitor table health and record counts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dbHealth?.map((table) => (
                  <div key={table.table} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Database className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{table.table}</p>
                        {table.error && (
                          <p className="text-sm text-destructive">{table.error}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{table.count} records</span>
                      <Badge variant={table.status === 'healthy' ? 'default' : 'destructive'}>
                        {table.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity Logs</CardTitle>
              <CardDescription>Last 100 system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recentLogs?.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-2 border-b text-sm">
                    <div className="flex items-center gap-2">
                      {log.status === 'error' ? (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      <span className="font-medium">{log.action}</span>
                      <span className="text-muted-foreground">on {log.resource}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                      <Badge variant={log.status === 'error' ? 'destructive' : 'outline'}>
                        {log.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backend" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Backend Management
              </CardTitle>
              <CardDescription>Access detailed backend metrics and logs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <h3 className="font-semibold mb-2">Available Monitoring Tools:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Database query performance and logs
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Edge function execution logs
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Authentication and user activity
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Storage usage and operations
                  </li>
                </ul>
              </div>
              
              <div className="p-4 bg-primary/10 border border-primary rounded-lg">
                <p className="text-sm">
                  Access the backend dashboard through Lovable Cloud to view detailed logs, 
                  database analytics, edge function performance, and real-time metrics.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemMonitoring;
