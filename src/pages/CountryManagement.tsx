import { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  Globe, 
  Plus,
  Edit,
  Settings,
  Shield,
  DollarSign,
  FileText
} from 'lucide-react';

export default function CountryManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    region: '',
    compliance_framework: '',
    hs_code_prefix: '2401',
    tax_rate: 0,
    currency: 'USD',
    regulatory_authority: '',
    reporting_endpoint: '',
    is_active: true
  });

  const { data: countries } = useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const createCountry = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('countries').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      toast({ title: "Country Added", description: "Country configuration created successfully" });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Creation Failed", description: error instanceof Error ? error.message : "Failed to create country", variant: "destructive" });
    }
  });

  const updateCountry = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('countries')
        .update(data)
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      toast({ title: "Country Updated", description: "Country configuration updated successfully" });
      setIsEditOpen(false);
      setSelectedCountry(null);
      resetForm();
    }
  });

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      region: '',
      compliance_framework: '',
      hs_code_prefix: '2401',
      tax_rate: 0,
      currency: 'USD',
      regulatory_authority: '',
      reporting_endpoint: '',
      is_active: true
    });
  };

  const handleEdit = (country: any) => {
    setSelectedCountry(country);
    setFormData(country);
    setIsEditOpen(true);
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Globe className="h-8 w-8" />
              Country Management
            </h1>
            <p className="text-muted-foreground">
              Configure countries, compliance frameworks, and reporting requirements
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Country
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Add Country Configuration</DialogTitle>
                <DialogDescription>
                  Configure country-specific compliance and reporting settings
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code">Country Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., IN, UAE, GB"
                    maxLength={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Country Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., India"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Select value={formData.region} onValueChange={(value) => setFormData({ ...formData, region: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia">Asia</SelectItem>
                      <SelectItem value="Europe">Europe</SelectItem>
                      <SelectItem value="Middle East">Middle East</SelectItem>
                      <SelectItem value="North America">North America</SelectItem>
                      <SelectItem value="South America">South America</SelectItem>
                      <SelectItem value="Africa">Africa</SelectItem>
                      <SelectItem value="Oceania">Oceania</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="framework">Compliance Framework</Label>
                  <Select value={formData.compliance_framework} onValueChange={(value) => setFormData({ ...formData, compliance_framework: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select framework" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TPD">EU TPD</SelectItem>
                      <SelectItem value="FCTC">WHO FCTC</SelectItem>
                      <SelectItem value="GCC">GCC Standards</SelectItem>
                      <SelectItem value="FDA">FDA Regulations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hs_code">HS Code Prefix</Label>
                  <Input
                    id="hs_code"
                    value={formData.hs_code_prefix}
                    onChange={(e) => setFormData({ ...formData, hs_code_prefix: e.target.value })}
                    placeholder="2401"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                  <Input
                    id="tax_rate"
                    type="number"
                    value={formData.tax_rate}
                    onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) })}
                    placeholder="18"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                    placeholder="USD"
                    maxLength={3}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="authority">Regulatory Authority</Label>
                  <Input
                    id="authority"
                    value={formData.regulatory_authority}
                    onChange={(e) => setFormData({ ...formData, regulatory_authority: e.target.value })}
                    placeholder="e.g., Central Board of Indirect Taxes and Customs"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="endpoint">Reporting Endpoint (URL)</Label>
                  <Input
                    id="endpoint"
                    value={formData.reporting_endpoint}
                    onChange={(e) => setFormData({ ...formData, reporting_endpoint: e.target.value })}
                    placeholder="https://api.authority.gov/reports"
                  />
                </div>

                <div className="flex items-center space-x-2 md:col-span-2">
                  <Switch
                    id="active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={() => createCountry.mutate(formData)} disabled={!formData.code || !formData.name}>
                  Add Country
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Countries Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {countries?.map((country) => (
            <Card key={country.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      {country.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {country.code} • {country.region}
                    </CardDescription>
                  </div>
                  <Badge variant={country.is_active ? 'default' : 'secondary'}>
                    {country.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{country.compliance_framework || 'N/A'}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>{country.tax_rate}% Tax • {country.currency}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground truncate">
                    {country.regulatory_authority || 'No authority set'}
                  </span>
                </div>

                <Button size="sm" variant="outline" className="w-full" onClick={() => handleEdit(country)}>
                  <Edit className="h-3 w-3 mr-1" />
                  Edit Configuration
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Edit Country Configuration</DialogTitle>
              <DialogDescription>
                Update country-specific settings
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Country Code</Label>
                <Input value={formData.code} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-name">Country Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-region">Region</Label>
                <Select value={formData.region} onValueChange={(value) => setFormData({ ...formData, region: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia">Asia</SelectItem>
                    <SelectItem value="Europe">Europe</SelectItem>
                    <SelectItem value="Middle East">Middle East</SelectItem>
                    <SelectItem value="North America">North America</SelectItem>
                    <SelectItem value="South America">South America</SelectItem>
                    <SelectItem value="Africa">Africa</SelectItem>
                    <SelectItem value="Oceania">Oceania</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-framework">Compliance Framework</Label>
                <Select value={formData.compliance_framework} onValueChange={(value) => setFormData({ ...formData, compliance_framework: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TPD">EU TPD</SelectItem>
                    <SelectItem value="FCTC">WHO FCTC</SelectItem>
                    <SelectItem value="GCC">GCC Standards</SelectItem>
                    <SelectItem value="FDA">FDA Regulations</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-tax">Tax Rate (%)</Label>
                <Input
                  id="edit-tax"
                  type="number"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-currency">Currency</Label>
                <Input
                  id="edit-currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                  maxLength={3}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-authority">Regulatory Authority</Label>
                <Input
                  id="edit-authority"
                  value={formData.regulatory_authority}
                  onChange={(e) => setFormData({ ...formData, regulatory_authority: e.target.value })}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-endpoint">Reporting Endpoint</Label>
                <Input
                  id="edit-endpoint"
                  value={formData.reporting_endpoint}
                  onChange={(e) => setFormData({ ...formData, reporting_endpoint: e.target.value })}
                  placeholder="https://api.authority.gov/reports"
                />
              </div>

              <div className="flex items-center space-x-2 md:col-span-2">
                <Switch
                  id="edit-active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="edit-active">Active</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button onClick={() => updateCountry.mutate({ ...formData, id: selectedCountry.id })}>
                Update Country
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}