import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Plus,
  Edit,
  Trash2,
  Eye,
  Copy,
  Settings
} from 'lucide-react';

type DocumentType = 'tpd_label' | 'dispatch_manifest' | 'invoice' | 'customs_declaration' | 'packing_list';

export default function DocumentTemplates() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_type: 'tpd_label' as DocumentType,
    template_config: '{}',
    is_active: true
  });

  const { data: templates, isLoading } = useQuery({
    queryKey: ['document-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const createTemplate = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('document_templates')
        .insert({
          name: data.name,
          description: data.description,
          template_type: data.template_type,
          template_config: JSON.parse(data.template_config),
          is_active: data.is_active
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      toast({ title: "Template Created", description: "Document template created successfully" });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ 
        title: "Creation Failed", 
        description: error instanceof Error ? error.message : "Failed to create template",
        variant: "destructive" 
      });
    }
  });

  const updateTemplate = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('document_templates')
        .update({
          name: data.name,
          description: data.description,
          template_config: JSON.parse(data.template_config),
          is_active: data.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      toast({ title: "Template Updated", description: "Document template updated successfully" });
      setIsEditOpen(false);
      setSelectedTemplate(null);
      resetForm();
    },
    onError: (error) => {
      toast({ 
        title: "Update Failed", 
        description: error instanceof Error ? error.message : "Failed to update template",
        variant: "destructive" 
      });
    }
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('document_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      toast({ title: "Template Deleted", description: "Document template deleted successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Deletion Failed", 
        description: error instanceof Error ? error.message : "Failed to delete template",
        variant: "destructive" 
      });
    }
  });

  const duplicateTemplate = async (template: any) => {
    const duplicatedData = {
      name: `${template.name} (Copy)`,
      description: template.description,
      template_type: template.template_type,
      template_config: JSON.stringify(template.template_config, null, 2),
      is_active: false
    };
    
    createTemplate.mutate(duplicatedData);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      template_type: 'tpd_label',
      template_config: '{}',
      is_active: true
    });
  };

  const handleEdit = (template: any) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      template_type: template.template_type,
      template_config: JSON.stringify(template.template_config, null, 2),
      is_active: template.is_active
    });
    setIsEditOpen(true);
  };

  const handleCreate = () => {
    createTemplate.mutate(formData);
  };

  const handleUpdate = () => {
    if (selectedTemplate) {
      updateTemplate.mutate({ ...formData, id: selectedTemplate.id });
    }
  };

  const getTemplateTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'tpd_label': 'TPD Label',
      'dispatch_manifest': 'Dispatch Manifest',
      'invoice': 'GST Invoice',
      'customs_declaration': 'Customs Declaration',
      'packing_list': 'Packing List'
    };
    return labels[type] || type;
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Document Templates</h1>
            <p className="text-muted-foreground">
              Manage templates for document generation
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/document-management')} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Documents
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Create Document Template</DialogTitle>
                  <DialogDescription>
                    Define a new template for document generation
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Standard TPD Label"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional description"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Document Type</Label>
                    <Select 
                      value={formData.template_type} 
                      onValueChange={(value: DocumentType) => setFormData({ ...formData, template_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tpd_label">TPD Label</SelectItem>
                        <SelectItem value="dispatch_manifest">Dispatch Manifest</SelectItem>
                        <SelectItem value="invoice">GST Invoice</SelectItem>
                        <SelectItem value="customs_declaration">Customs Declaration</SelectItem>
                        <SelectItem value="packing_list">Packing List</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="config">Template Configuration (JSON)</Label>
                    <Textarea
                      id="config"
                      value={formData.template_config}
                      onChange={(e) => setFormData({ ...formData, template_config: e.target.value })}
                      placeholder='{"format": "A4", "include_qr": true}'
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="active">Active Template</Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={!formData.name || !formData.template_config}>
                    Create Template
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates?.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {getTemplateTypeLabel(template.template_type)}
                    </CardDescription>
                  </div>
                  <Badge variant={template.is_active ? 'default' : 'secondary'}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {template.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {template.description}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(template)}>
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => duplicateTemplate(template)}>
                    <Copy className="h-3 w-3 mr-1" />
                    Duplicate
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => deleteTemplate.mutate(template.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!isLoading && (!templates || templates.length === 0) && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Settings className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Templates Found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first document template to get started
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Edit Document Template</DialogTitle>
              <DialogDescription>
                Update template configuration
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Template Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-config">Template Configuration (JSON)</Label>
                <Textarea
                  id="edit-config"
                  value={formData.template_config}
                  onChange={(e) => setFormData({ ...formData, template_config: e.target.value })}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="edit-active">Active Template</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdate}>Update Template</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}