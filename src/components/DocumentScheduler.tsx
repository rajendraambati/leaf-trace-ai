import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar as CalendarIcon, 
  Clock,
  Plus,
  Trash2,
  Play,
  Pause
} from 'lucide-react';

type DocumentType = 'tpd_label' | 'dispatch_manifest' | 'invoice' | 'customs_declaration' | 'packing_list';
type Frequency = 'daily' | 'weekly' | 'monthly';

interface ScheduledJob {
  id: string;
  name: string;
  documentType: DocumentType;
  frequency: Frequency;
  time: string;
  enabled: boolean;
  lastRun?: string;
  nextRun: string;
}

export function DocumentScheduler() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<ScheduledJob[]>([
    {
      id: '1',
      name: 'Daily TPD Labels',
      documentType: 'tpd_label',
      frequency: 'daily',
      time: '08:00',
      enabled: true,
      nextRun: '2025-10-30 08:00'
    }
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [newJob, setNewJob] = useState({
    name: '',
    documentType: 'tpd_label' as DocumentType,
    frequency: 'daily' as Frequency,
    time: '09:00'
  });

  const documentTypes = [
    { value: 'tpd_label', label: 'TPD Label' },
    { value: 'dispatch_manifest', label: 'Dispatch Manifest' },
    { value: 'invoice', label: 'GST Invoice' },
    { value: 'customs_declaration', label: 'Customs Declaration' },
    { value: 'packing_list', label: 'Packing List' }
  ];

  const frequencies = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  const handleCreateJob = () => {
    if (!newJob.name) {
      toast({
        title: "Missing Information",
        description: "Please provide a job name",
        variant: "destructive"
      });
      return;
    }

    const job: ScheduledJob = {
      id: Date.now().toString(),
      ...newJob,
      enabled: true,
      nextRun: calculateNextRun(newJob.frequency, newJob.time)
    };

    setJobs([...jobs, job]);
    setNewJob({
      name: '',
      documentType: 'tpd_label',
      frequency: 'daily',
      time: '09:00'
    });
    setIsCreating(false);

    toast({
      title: "Job Created",
      description: "Scheduled document generation job created successfully"
    });
  };

  const handleToggleJob = (jobId: string) => {
    setJobs(jobs.map(job => 
      job.id === jobId ? { ...job, enabled: !job.enabled } : job
    ));
  };

  const handleDeleteJob = (jobId: string) => {
    setJobs(jobs.filter(job => job.id !== jobId));
    toast({
      title: "Job Deleted",
      description: "Scheduled job has been removed"
    });
  };

  const calculateNextRun = (frequency: Frequency, time: string): string => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    
    const next = new Date(now);
    next.setHours(hours, minutes, 0, 0);
    
    if (next < now) {
      next.setDate(next.getDate() + 1);
    }

    return next.toLocaleString('en-US', { 
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Document Scheduler
            </CardTitle>
            <CardDescription>
              Schedule automatic document generation at specific times
            </CardDescription>
          </div>
          <Button onClick={() => setIsCreating(!isCreating)}>
            <Plus className="h-4 w-4 mr-2" />
            New Schedule
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCreating && (
          <div className="p-4 border rounded-lg space-y-4 bg-muted/50">
            <h3 className="font-semibold">Create Scheduled Job</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="job-name">Job Name</Label>
                <Input
                  id="job-name"
                  value={newJob.name}
                  onChange={(e) => setNewJob({ ...newJob, name: e.target.value })}
                  placeholder="e.g., Daily TPD Labels"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc-type">Document Type</Label>
                <Select 
                  value={newJob.documentType} 
                  onValueChange={(value: DocumentType) => setNewJob({ ...newJob, documentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select 
                  value={newJob.frequency} 
                  onValueChange={(value: Frequency) => setNewJob({ ...newJob, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencies.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={newJob.time}
                  onChange={(e) => setNewJob({ ...newJob, time: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateJob}>
                Create Job
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {jobs.map((job) => (
            <div 
              key={job.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{job.name}</h4>
                  <Badge variant={job.enabled ? 'default' : 'secondary'}>
                    {job.enabled ? 'Active' : 'Paused'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    {job.frequency.charAt(0).toUpperCase() + job.frequency.slice(1)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {job.time}
                  </span>
                  <span>Next: {job.nextRun}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => handleToggleJob(job.id)}
                >
                  {job.enabled ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleDeleteJob(job.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {jobs.length === 0 && !isCreating && (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No scheduled jobs yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}