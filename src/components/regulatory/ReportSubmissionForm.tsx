import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send } from 'lucide-react';

interface ReportSubmissionFormProps {
  formData: {
    authority_id: string;
    report_type: string;
    period_start: string;
    period_end: string;
  };
  setFormData: (data: any) => void;
  authorities: any[];
  isSubmitting: boolean;
  onSubmit: () => void;
}

export default function ReportSubmissionForm({
  formData,
  setFormData,
  authorities,
  isSubmitting,
  onSubmit
}: ReportSubmissionFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit New Report</CardTitle>
        <CardDescription>
          Generate and submit compliance reports to authorities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="authority">Reporting Authority *</Label>
            <Select value={formData.authority_id} onValueChange={(value) => setFormData({ ...formData, authority_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select authority" />
              </SelectTrigger>
              <SelectContent>
                {authorities?.map((authority) => (
                  <SelectItem key={authority.id} value={authority.id}>
                    {authority.authority_name} ({authority.countries?.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-type">Report Type *</Label>
            <Select value={formData.report_type} onValueChange={(value) => setFormData({ ...formData, report_type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shipment_summary">Shipment Summary</SelectItem>
                <SelectItem value="batch_tracking">Batch Tracking</SelectItem>
                <SelectItem value="tax_report">Tax Report</SelectItem>
                <SelectItem value="volume_report">Volume Report</SelectItem>
                <SelectItem value="compliance_audit">Compliance Audit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start-date">Period Start *</Label>
            <Input
              id="start-date"
              type="date"
              value={formData.period_start}
              onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-date">Period End *</Label>
            <Input
              id="end-date"
              type="date"
              value={formData.period_end}
              onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
            />
          </div>
        </div>

        <Button 
          onClick={onSubmit} 
          disabled={isSubmitting}
          className="w-full"
          size="lg"
        >
          <Send className="mr-2 h-5 w-5" />
          {isSubmitting ? 'Submitting...' : 'Generate & Submit Report'}
        </Button>
      </CardContent>
    </Card>
  );
}
