import { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useContractGeneration } from '@/hooks/useContractGeneration';
import { FileText, Info, CheckCircle2, AlertTriangle, Loader2, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function ContractGeneration() {
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [contractType, setContractType] = useState('');
  const [partyA, setPartyA] = useState({ name: '', address: '', email: '', phone: '' });
  const [partyB, setPartyB] = useState({ name: '', address: '', email: '', phone: '' });
  const [contractDetails, setContractDetails] = useState({
    value: '',
    currency: 'USD',
    effectiveDate: format(new Date(), 'yyyy-MM-dd'),
    expiryDate: ''
  });
  const [selectedClauses, setSelectedClauses] = useState<string[]>([]);
  const [customizations, setCustomizations] = useState<Record<string, any>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generatedContract, setGeneratedContract] = useState<any>(null);

  const { useTemplates, useClauses, generateContract, useGeneratedContracts } = useContractGeneration();
  const { data: templates = [] } = useTemplates();
  const { data: clauses = [] } = useClauses(contractType);
  const { data: contracts = [] } = useGeneratedContracts();

  const handleClauseToggle = (clauseId: string, mandatory: boolean) => {
    if (mandatory) return;
    
    setSelectedClauses(prev =>
      prev.includes(clauseId)
        ? prev.filter(id => id !== clauseId)
        : [...prev, clauseId]
    );
  };

  const handleCustomizationChange = (clauseId: string, field: string, value: any) => {
    setCustomizations(prev => ({
      ...prev,
      [clauseId]: {
        ...prev[clauseId],
        [field]: value
      }
    }));
  };

  const handleGenerate = async () => {
    const result = await generateContract.mutateAsync({
      contractType,
      partyA,
      partyB,
      selectedClauses,
      customizations,
      contractDetails
    });
    
    if (result.success) {
      setGeneratedContract(result.contract);
      setPreviewOpen(true);
    }
  };

  const getRiskBadge = (level: string) => {
    const colors = {
      low: 'secondary',
      medium: 'default',
      high: 'destructive',
      critical: 'destructive'
    };
    return <Badge variant={colors[level as keyof typeof colors] as any}>{level.toUpperCase()}</Badge>;
  };

  // Auto-select mandatory clauses
  const mandatoryClauses = clauses.filter(c => c.is_mandatory).map(c => c.id);
  if (mandatoryClauses.length > 0 && selectedClauses.length === 0) {
    setSelectedClauses(mandatoryClauses);
  }

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Contract Generation</h1>
            <p className="text-muted-foreground">
              Auto-generate NDAs, agreements, and vendor contracts with AI
            </p>
          </div>
          <Button variant="outline" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-4 w-4 mr-2" />
            View Contracts
          </Button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                step >= s ? 'border-primary bg-primary text-primary-foreground' : 'border-muted'
              }`}>
                {s}
              </div>
              {s < 4 && <div className="w-20 h-0.5 bg-muted mx-2" />}
            </div>
          ))}
        </div>

        <Card>
          <CardContent className="pt-6">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Select Contract Type</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    {templates.map((template) => (
                      <Card
                        key={template.id}
                        className={`cursor-pointer transition-all ${
                          selectedTemplate === template.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => {
                          setSelectedTemplate(template.id);
                          setContractType(template.template_type);
                        }}
                      >
                        <CardHeader>
                          <CardTitle className="text-base">{template.template_name}</CardTitle>
                          <CardDescription>{template.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Badge variant="outline">{template.category}</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                
                <Button onClick={() => setStep(2)} disabled={!selectedTemplate}>
                  Next: Party Details
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Party Details</h3>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="font-medium">Party A (First Party)</h4>
                    <div>
                      <Label>Name *</Label>
                      <Input
                        value={partyA.name}
                        onChange={(e) => setPartyA({ ...partyA, name: e.target.value })}
                        placeholder="Company or Individual Name"
                      />
                    </div>
                    <div>
                      <Label>Address</Label>
                      <Textarea
                        value={partyA.address}
                        onChange={(e) => setPartyA({ ...partyA, address: e.target.value })}
                        placeholder="Full Address"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={partyA.email}
                        onChange={(e) => setPartyA({ ...partyA, email: e.target.value })}
                        placeholder="contact@example.com"
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={partyA.phone}
                        onChange={(e) => setPartyA({ ...partyA, phone: e.target.value })}
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Party B (Second Party)</h4>
                    <div>
                      <Label>Name *</Label>
                      <Input
                        value={partyB.name}
                        onChange={(e) => setPartyB({ ...partyB, name: e.target.value })}
                        placeholder="Company or Individual Name"
                      />
                    </div>
                    <div>
                      <Label>Address</Label>
                      <Textarea
                        value={partyB.address}
                        onChange={(e) => setPartyB({ ...partyB, address: e.target.value })}
                        placeholder="Full Address"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={partyB.email}
                        onChange={(e) => setPartyB({ ...partyB, email: e.target.value })}
                        placeholder="contact@example.com"
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={partyB.phone}
                        onChange={(e) => setPartyB({ ...partyB, phone: e.target.value })}
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Contract Value *</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={contractDetails.value}
                        onChange={(e) => setContractDetails({ ...contractDetails, value: e.target.value })}
                        placeholder="0.00"
                      />
                      <Select
                        value={contractDetails.currency}
                        onValueChange={(v) => setContractDetails({ ...contractDetails, currency: v })}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="INR">INR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Effective Date *</Label>
                    <Input
                      type="date"
                      value={contractDetails.effectiveDate}
                      onChange={(e) => setContractDetails({ ...contractDetails, effectiveDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Expiry Date (Optional)</Label>
                    <Input
                      type="date"
                      value={contractDetails.expiryDate}
                      onChange={(e) => setContractDetails({ ...contractDetails, expiryDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button 
                    onClick={() => setStep(3)} 
                    disabled={!partyA.name || !partyB.name || !contractDetails.value}
                  >
                    Next: Select Clauses
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Select and Customize Clauses</h3>
                <p className="text-sm text-muted-foreground">
                  Choose clauses for your contract. Mandatory clauses are pre-selected.
                </p>

                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {clauses.map((clause) => (
                      <Card key={clause.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-3 flex-1">
                              <Checkbox
                                checked={selectedClauses.includes(clause.id)}
                                onCheckedChange={() => handleClauseToggle(clause.id, clause.is_mandatory)}
                                disabled={clause.is_mandatory}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold">{clause.clause_name}</h4>
                                  {getRiskBadge(clause.risk_level)}
                                  {clause.is_mandatory && (
                                    <Badge variant="outline">Mandatory</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">
                                  {clause.clause_content.substring(0, 200)}...
                                </p>
                                
                                {clause.legal_hint && (
                                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg mb-3">
                                    <div className="flex gap-2">
                                      <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                                      <p className="text-sm text-blue-900 dark:text-blue-100">
                                        <strong>Legal Hint:</strong> {clause.legal_hint}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {selectedClauses.includes(clause.id) && clause.customization_fields && (
                                  <div className="mt-4 space-y-3 border-t pt-4">
                                    <h5 className="font-medium text-sm">Customize this clause:</h5>
                                    {(typeof clause.customization_fields === 'string' 
                                      ? JSON.parse(clause.customization_fields) 
                                      : clause.customization_fields
                                    ).map((field: any) => (
                                      <div key={field.field}>
                                        <Label className="text-xs">{field.label} {field.required && '*'}</Label>
                                        {field.type === 'select' ? (
                                          <Select
                                            value={customizations[clause.id]?.[field.field] || field.default}
                                            onValueChange={(v) => handleCustomizationChange(clause.id, field.field, v)}
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {field.options.map((opt: string) => (
                                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        ) : field.type === 'number' ? (
                                          <Input
                                            type="number"
                                            value={customizations[clause.id]?.[field.field] || field.default || ''}
                                            onChange={(e) => handleCustomizationChange(clause.id, field.field, e.target.value)}
                                            placeholder={field.label}
                                          />
                                        ) : (
                                          <Input
                                            value={customizations[clause.id]?.[field.field] || field.default || ''}
                                            onChange={(e) => handleCustomizationChange(clause.id, field.field, e.target.value)}
                                            placeholder={field.label}
                                          />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button 
                    onClick={() => setStep(4)} 
                    disabled={selectedClauses.length === 0}
                  >
                    Next: Review & Generate
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Review & Generate Contract</h3>
                
                <div className="grid gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Contract Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium">{contractType.replace('_', ' ').toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Parties:</span>
                        <span className="font-medium">{partyA.name} ↔ {partyB.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Value:</span>
                        <span className="font-medium">{contractDetails.value} {contractDetails.currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Effective Date:</span>
                        <span className="font-medium">{format(new Date(contractDetails.effectiveDate), 'PPP')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Clauses:</span>
                        <span className="font-medium">{selectedClauses.length} selected</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleGenerate}
                    disabled={generateContract.isPending}
                  >
                    {generateContract.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Contract
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Generated Contract</DialogTitle>
            <DialogDescription>
              {generatedContract?.contract_number}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[600px] pr-4">
            <div className="whitespace-pre-wrap font-mono text-sm">
              {generatedContract?.generated_content || 'No contract generated yet'}
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
