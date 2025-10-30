import { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAnomalyManagement, type Anomaly } from '@/hooks/useAnomalyManagement';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Activity,
  Search,
  RefreshCw,
  FileText,
  ArrowUpCircle
} from 'lucide-react';
import { format } from 'date-fns';

export default function AnomalyMonitoring() {
  const [selectedStatus, setSelectedStatus] = useState<string>('open');
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [escalateDialogOpen, setEscalateDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [escalationReason, setEscalationReason] = useState('');

  const { 
    useAnomalies, 
    useResolutionHistory,
    detectAnomalies, 
    resolveAnomaly, 
    escalateAnomaly,
    investigateAnomaly 
  } = useAnomalyManagement();

  const { data: anomalies = [], isLoading } = useAnomalies({ status: selectedStatus });
  const { data: resolutionHistory = [] } = useResolutionHistory(selectedAnomaly?.id || '');

  const stats = {
    total: anomalies.length,
    critical: anomalies.filter(a => a.severity === 'CRITICAL').length,
    open: anomalies.filter(a => a.status === 'open').length,
    escalated: anomalies.filter(a => a.status === 'escalated').length
  };

  const handleResolve = async () => {
    if (!selectedAnomaly || !resolutionNotes.trim()) return;
    
    await resolveAnomaly.mutateAsync({
      anomalyId: selectedAnomaly.id,
      resolutionNotes
    });
    
    setResolveDialogOpen(false);
    setResolutionNotes('');
    setSelectedAnomaly(null);
  };

  const handleEscalate = async () => {
    if (!selectedAnomaly || !escalationReason.trim()) return;
    
    await escalateAnomaly.mutateAsync({
      anomalyId: selectedAnomaly.id,
      escalationReason,
      escalatedTo: undefined
    });
    
    setEscalateDialogOpen(false);
    setEscalationReason('');
    setSelectedAnomaly(null);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'default';
      case 'LOW': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle2 className="h-4 w-4" />;
      case 'escalated': return <ArrowUpCircle className="h-4 w-4" />;
      case 'investigating': return <Search className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Anomaly Monitoring</h1>
            <p className="text-muted-foreground">
              Detect and resolve supply chain anomalies with AI-powered insights
            </p>
          </div>
            <Button 
            onClick={() => detectAnomalies.mutate(undefined)}
            disabled={detectAnomalies.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${detectAnomalies.isPending ? 'animate-spin' : ''}`} />
            Run Detection Scan
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Anomalies</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.critical}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.open}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Escalated</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.escalated}</div>
            </CardContent>
          </Card>
        </div>

        {/* Anomalies List */}
        <Card>
          <CardHeader>
            <CardTitle>Detected Anomalies</CardTitle>
            <CardDescription>Review and manage system anomalies</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="investigating">Investigating</TabsTrigger>
                <TabsTrigger value="escalated">Escalated</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedStatus} className="space-y-4 mt-4">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading anomalies...
                  </div>
                ) : anomalies.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No {selectedStatus} anomalies found
                  </div>
                ) : (
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-4">
                      {anomalies.map((anomaly) => (
                        <Card key={anomaly.id}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {getStatusIcon(anomaly.status)}
                                  <h3 className="font-semibold">{anomaly.title}</h3>
                                  <Badge variant={getSeverityColor(anomaly.severity)}>
                                    {anomaly.severity}
                                  </Badge>
                                  {anomaly.auto_resolved && (
                                    <Badge variant="outline">Auto-Resolved</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">
                                  {anomaly.description}
                                </p>
                                
                                {anomaly.suggested_resolution && (
                                  <div className="bg-muted p-3 rounded-lg mb-3">
                                    <p className="text-sm font-medium mb-1">Suggested Resolution:</p>
                                    <p className="text-sm">{anomaly.suggested_resolution}</p>
                                  </div>
                                )}

                                {anomaly.ai_root_cause && (
                                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg mb-3">
                                    <p className="text-sm font-medium mb-1">AI Analysis:</p>
                                    <p className="text-sm whitespace-pre-wrap">{anomaly.ai_root_cause}</p>
                                  </div>
                                )}

                                <div className="flex gap-2 text-xs text-muted-foreground">
                                  <span>Detected: {format(new Date(anomaly.detected_at), 'PPp')}</span>
                                  {anomaly.resolved_at && (
                                    <span>• Resolved: {format(new Date(anomaly.resolved_at), 'PPp')}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {anomaly.status === 'open' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => investigateAnomaly.mutate(anomaly.id)}
                                  >
                                    <Search className="h-4 w-4 mr-1" />
                                    Investigate
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedAnomaly(anomaly);
                                      setResolveDialogOpen(true);
                                    }}
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    Resolve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      setSelectedAnomaly(anomaly);
                                      setEscalateDialogOpen(true);
                                    }}
                                  >
                                    <ArrowUpCircle className="h-4 w-4 mr-1" />
                                    Escalate
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedAnomaly(anomaly);
                                  setHistoryDialogOpen(true);
                                }}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                History
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Anomaly</DialogTitle>
            <DialogDescription>
              Provide details about how this anomaly was resolved
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="resolution">Resolution Notes</Label>
              <Textarea
                id="resolution"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describe the actions taken to resolve this anomaly..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={!resolutionNotes.trim()}>
              Mark Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Escalate Dialog */}
      <Dialog open={escalateDialogOpen} onOpenChange={setEscalateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escalate Anomaly</DialogTitle>
            <DialogDescription>
              Escalate this anomaly to senior management for review
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="escalation">Escalation Reason</Label>
              <Textarea
                id="escalation"
                value={escalationReason}
                onChange={(e) => setEscalationReason(e.target.value)}
                placeholder="Explain why this anomaly requires escalation..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEscalateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleEscalate} 
              disabled={!escalationReason.trim()}
            >
              Escalate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Anomaly Resolution History</DialogTitle>
            <DialogDescription>
              Complete audit trail for this anomaly
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {resolutionHistory.map((entry) => (
                <div key={entry.id} className="border-l-2 border-muted pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium capitalize">{entry.action.replace('_', ' ')}</p>
                      {entry.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(entry.performed_at), 'PPp')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
