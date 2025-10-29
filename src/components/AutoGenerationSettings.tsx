import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Zap, 
  Save,
  CheckCircle
} from 'lucide-react';

interface TriggerConfig {
  enabled: boolean;
  documentTypes: string[];
}

interface AutoGenerationConfig {
  shipment_created: TriggerConfig;
  batch_approved: TriggerConfig;
  delivery_confirmed: TriggerConfig;
}

const DOCUMENT_TYPES = [
  { value: 'tpd_label', label: 'TPD Label' },
  { value: 'dispatch_manifest', label: 'Dispatch Manifest' },
  { value: 'invoice', label: 'GST Invoice' },
  { value: 'customs_declaration', label: 'Customs Declaration' },
  { value: 'packing_list', label: 'Packing List' }
];

const TRIGGERS = [
  { 
    key: 'shipment_created', 
    label: 'Shipment Created',
    description: 'Generate documents when a new shipment is created',
    defaultDocs: ['dispatch_manifest', 'packing_list']
  },
  { 
    key: 'batch_approved', 
    label: 'Batch Approved',
    description: 'Generate documents when a batch is approved',
    defaultDocs: ['tpd_label', 'invoice']
  },
  { 
    key: 'delivery_confirmed', 
    label: 'Delivery Confirmed',
    description: 'Generate documents when delivery is confirmed',
    defaultDocs: ['invoice']
  }
];

export function AutoGenerationSettings() {
  const { toast } = useToast();
  const [config, setConfig] = useState<AutoGenerationConfig>({
    shipment_created: { enabled: true, documentTypes: ['dispatch_manifest', 'packing_list'] },
    batch_approved: { enabled: true, documentTypes: ['tpd_label', 'invoice'] },
    delivery_confirmed: { enabled: false, documentTypes: ['invoice'] }
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleToggleTrigger = (triggerKey: string) => {
    setConfig(prev => ({
      ...prev,
      [triggerKey]: {
        ...prev[triggerKey as keyof AutoGenerationConfig],
        enabled: !prev[triggerKey as keyof AutoGenerationConfig].enabled
      }
    }));
  };

  const handleToggleDocumentType = (triggerKey: string, docType: string) => {
    setConfig(prev => {
      const trigger = prev[triggerKey as keyof AutoGenerationConfig];
      const currentTypes = trigger.documentTypes;
      const newTypes = currentTypes.includes(docType)
        ? currentTypes.filter(t => t !== docType)
        : [...currentTypes, docType];

      return {
        ...prev,
        [triggerKey]: {
          ...trigger,
          documentTypes: newTypes
        }
      };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // In a real implementation, this would save to a settings table
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Settings Saved",
        description: "Auto-generation settings have been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Automated Document Generation
        </CardTitle>
        <CardDescription>
          Configure automatic document generation based on system events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {TRIGGERS.map((trigger) => {
          const triggerConfig = config[trigger.key as keyof AutoGenerationConfig];
          
          return (
            <div key={trigger.key} className="space-y-4 pb-6 border-b last:border-b-0 last:pb-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={trigger.key} className="text-base font-semibold">
                      {trigger.label}
                    </Label>
                    <Badge variant={triggerConfig.enabled ? 'default' : 'secondary'}>
                      {triggerConfig.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {trigger.description}
                  </p>
                </div>
                <Switch
                  id={trigger.key}
                  checked={triggerConfig.enabled}
                  onCheckedChange={() => handleToggleTrigger(trigger.key)}
                />
              </div>

              {triggerConfig.enabled && (
                <div className="ml-6 space-y-2">
                  <Label className="text-sm font-medium">Documents to Generate:</Label>
                  <div className="grid gap-2">
                    {DOCUMENT_TYPES.map((docType) => (
                      <div key={docType.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${trigger.key}-${docType.value}`}
                          checked={triggerConfig.documentTypes.includes(docType.value)}
                          onCheckedChange={() => handleToggleDocumentType(trigger.key, docType.value)}
                        />
                        <label
                          htmlFor={`${trigger.key}-${docType.value}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {docType.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            <CheckCircle className="inline-block h-4 w-4 mr-1 text-success" />
            Changes will take effect immediately
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}