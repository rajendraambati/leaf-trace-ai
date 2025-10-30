import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Key, Plus, Copy, Trash2, Eye, EyeOff, Activity } from 'lucide-react';
import { format } from 'date-fns';

export default function APIManagement() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [isSandbox, setIsSandbox] = useState(false);
  const [selectedEndpoints, setSelectedEndpoints] = useState<string[]>(['*']);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const queryClient = useQueryClient();

  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const createKeyMutation = useMutation({
    mutationFn: async () => {
      const apiKey = `sk_${isSandbox ? 'test' : 'live'}_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      
      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          key_name: keyName,
          api_key: apiKey,
          client_name: clientName,
          client_email: clientEmail,
          is_sandbox: isSandbox,
          allowed_endpoints: selectedEndpoints,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API key created successfully');
      setCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Error creating API key:', error);
      toast.error('Failed to create API key');
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API key deleted');
    },
  });

  const toggleKeyMutation = useMutation({
    mutationFn: async ({ keyId, isActive }: { keyId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: isActive })
        .eq('id', keyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API key status updated');
    },
  });

  const resetForm = () => {
    setKeyName('');
    setClientName('');
    setClientEmail('');
    setIsSandbox(false);
    setSelectedEndpoints(['*']);
  };

  const copyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    toast.success('API key copied to clipboard');
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const maskApiKey = (key: string) => {
    return `${key.substring(0, 12)}${'•'.repeat(20)}${key.substring(key.length - 4)}`;
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Key className="h-8 w-8" />
              API Key Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Generate and manage API keys for external integrations
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create API Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New API Key</DialogTitle>
                <DialogDescription>
                  Generate a new API key for external system integration
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="keyName">Key Name</Label>
                  <Input
                    id="keyName"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="Production ERP Integration"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="ABC Corporation"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Client Email</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="admin@abccorp.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Allowed Endpoints</Label>
                  <Select value={selectedEndpoints[0]} onValueChange={(v) => setSelectedEndpoints([v])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="*">All Endpoints</SelectItem>
                      <SelectItem value="erp-sync">ERP Sync Only</SelectItem>
                      <SelectItem value="vehicle-tracking">Vehicle Tracking Only</SelectItem>
                      <SelectItem value="serialization">Serialization Only</SelectItem>
                      <SelectItem value="compliance">Compliance Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sandbox">Sandbox Mode</Label>
                  <Switch
                    id="sandbox"
                    checked={isSandbox}
                    onCheckedChange={setIsSandbox}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => createKeyMutation.mutate()} disabled={createKeyMutation.isPending}>
                  {createKeyMutation.isPending ? 'Creating...' : 'Create Key'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* API Keys List */}
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading API keys...
            </CardContent>
          </Card>
        ) : apiKeys && apiKeys.length > 0 ? (
          <div className="grid gap-4">
            {apiKeys.map((key) => (
              <Card key={key.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {key.key_name}
                        {key.is_sandbox && <Badge variant="secondary">Sandbox</Badge>}
                        {!key.is_active && <Badge variant="destructive">Inactive</Badge>}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {key.client_name} • {key.client_email || 'No email'}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleKeyVisibility(key.id)}
                      >
                        {showKeys[key.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyApiKey(key.api_key)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteKeyMutation.mutate(key.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                    {showKeys[key.id] ? key.api_key : maskApiKey(key.api_key)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="text-sm font-medium">{format(new Date(key.created_at), 'PP')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Used</p>
                      <p className="text-sm font-medium">
                        {key.last_used_at ? format(new Date(key.last_used_at), 'PP') : 'Never'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Usage Count</p>
                      <p className="text-sm font-medium">{key.usage_count}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Rate Limit</p>
                      <p className="text-sm font-medium">{key.rate_limit}/hour</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {key.allowed_endpoints.includes('*') ? 'All Endpoints' : key.allowed_endpoints.join(', ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Active</span>
                      <Switch
                        checked={key.is_active}
                        onCheckedChange={(checked) => toggleKeyMutation.mutate({ keyId: key.id, isActive: checked })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Key className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No API keys created yet</p>
              <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First API Key
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
