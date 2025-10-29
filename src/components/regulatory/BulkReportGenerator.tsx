import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, FileStack } from 'lucide-react';

interface BulkReportGeneratorProps {
  authorities: any[];
  onComplete: () => void;
}

export default function BulkReportGenerator({ authorities, onComplete }: BulkReportGeneratorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedAuthorities, setSelectedAuthorities] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['shipment_summary']);

  const reportTypes = [
    { value: 'shipment_summary', label: 'Shipment Summary' },
    { value: 'batch_tracking', label: 'Batch Tracking' },
    { value: 'tax_report', label: 'Tax Report' },
    { value: 'volume_report', label: 'Volume Report' },
    { value: 'compliance_audit', label: 'Compliance Audit' }
  ];

  const generateBulkReports = async () => {
    if (selectedAuthorities.length === 0 || selectedTypes.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one authority and report type",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);

      let successCount = 0;
      let failCount = 0;

      for (const authorityId of selectedAuthorities) {
        for (const reportType of selectedTypes) {
          try {
            const { error } = await supabase.functions.invoke('submit-compliance-report', {
              body: {
                authority_id: authorityId,
                report_type: reportType,
                period_start: startDate.toISOString().split('T')[0],
                period_end: endDate.toISOString().split('T')[0]
              }
            });

            if (error) throw error;
            successCount++;
          } catch (error) {
            console.error('Error generating report:', error);
            failCount++;
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ['compliance-reports'] });

      toast({
        title: "Bulk Generation Complete",
        description: `${successCount} reports generated successfully. ${failCount} failed.`
      });

      onComplete();
    } catch (error) {
      console.error('Error in bulk generation:', error);
      toast({
        title: "Bulk Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate reports",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileStack className="h-5 w-5" />
          Bulk Report Generation
        </CardTitle>
        <CardDescription>
          Generate multiple reports for the last month
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Select Authorities</Label>
          <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
            {authorities?.map((authority) => (
              <div key={authority.id} className="flex items-center space-x-2">
                <Checkbox
                  id={authority.id}
                  checked={selectedAuthorities.includes(authority.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedAuthorities([...selectedAuthorities, authority.id]);
                    } else {
                      setSelectedAuthorities(selectedAuthorities.filter(id => id !== authority.id));
                    }
                  }}
                />
                <label
                  htmlFor={authority.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {authority.authority_name} ({authority.countries?.code})
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Select Report Types</Label>
          <div className="space-y-2">
            {reportTypes.map((type) => (
              <div key={type.value} className="flex items-center space-x-2">
                <Checkbox
                  id={type.value}
                  checked={selectedTypes.includes(type.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedTypes([...selectedTypes, type.value]);
                    } else {
                      setSelectedTypes(selectedTypes.filter(t => t !== type.value));
                    }
                  }}
                />
                <label
                  htmlFor={type.value}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {type.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <Button 
          onClick={generateBulkReports} 
          disabled={isGenerating || selectedAuthorities.length === 0 || selectedTypes.length === 0}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Reports...
            </>
          ) : (
            <>
              <FileStack className="mr-2 h-4 w-4" />
              Generate {selectedAuthorities.length * selectedTypes.length} Reports
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
