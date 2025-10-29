import { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Store, UserPlus, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function RetailerOnboarding() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country_id: '',
    license_number: '',
    tax_id: '',
    business_type: 'retail_store',
    credit_limit: '0',
    payment_terms: 'Net 30'
  });

  const { data: countries } = useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: retailers } = useQuery({
    queryKey: ['retailers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('retailers')
        .select('*, countries(*), sales_representatives(*)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    }
  });

  const submitRetailer = async () => {
    if (!formData.business_name || !formData.email || !formData.country_id) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const retailerCode = `RET-${Date.now().toString().slice(-8)}`;
      
      const { error } = await supabase
        .from('retailers')
        .insert({
          retailer_code: retailerCode,
          ...formData,
          credit_limit: parseFloat(formData.credit_limit) || 0
        });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['retailers'] });
      
      toast({
        title: "Retailer Created",
        description: `Retailer ${retailerCode} created successfully`
      });

      setFormData({
        business_name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        country_id: '',
        license_number: '',
        tax_id: '',
        business_type: 'retail_store',
        credit_limit: '0',
        payment_terms: 'Net 30'
      });
    } catch (error) {
      console.error('Error creating retailer:', error);
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create retailer",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'pending': { variant: 'secondary', icon: Clock, label: 'Pending' },
      'approved': { variant: 'default', icon: CheckCircle, label: 'Approved' },
      'active': { variant: 'default', icon: CheckCircle, label: 'Active' },
      'rejected': { variant: 'destructive', icon: XCircle, label: 'Rejected' }
    };
    
    const config = variants[status] || { variant: 'outline', icon: Store, label: status };
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Store className="h-8 w-8" />
              Retailer Onboarding
            </h1>
            <p className="text-muted-foreground">
              Onboard new retail partners to the distribution network
            </p>
          </div>
        </div>

        {/* Onboarding Form */}
        <Card>
          <CardHeader>
            <CardTitle>New Retailer Registration</CardTitle>
            <CardDescription>
              Enter retailer information to begin the onboarding process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Business Name *</Label>
                <Input
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  placeholder="ABC Retail Store"
                />
              </div>

              <div className="space-y-2">
                <Label>Contact Person *</Label>
                <Input
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@retailer.com"
                />
              </div>

              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1234567890"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Address</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address"
                />
              </div>

              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>State/Province</Label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Postal Code</Label>
                <Input
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Country *</Label>
                <Select value={formData.country_id} onValueChange={(value) => setFormData({ ...formData, country_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries?.map((country) => (
                      <SelectItem key={country.id} value={country.id}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Business Type</Label>
                <Select value={formData.business_type} onValueChange={(value) => setFormData({ ...formData, business_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail_store">Retail Store</SelectItem>
                    <SelectItem value="convenience_store">Convenience Store</SelectItem>
                    <SelectItem value="supermarket">Supermarket</SelectItem>
                    <SelectItem value="specialty_shop">Specialty Shop</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>License Number</Label>
                <Input
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Tax ID</Label>
                <Input
                  value={formData.tax_id}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Credit Limit</Label>
                <Input
                  type="number"
                  value={formData.credit_limit}
                  onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Payment Terms</Label>
                <Select value={formData.payment_terms} onValueChange={(value) => setFormData({ ...formData, payment_terms: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Net 15">Net 15</SelectItem>
                    <SelectItem value="Net 30">Net 30</SelectItem>
                    <SelectItem value="Net 60">Net 60</SelectItem>
                    <SelectItem value="COD">Cash on Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={submitRetailer} 
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              {isSubmitting ? 'Submitting...' : 'Register Retailer'}
            </Button>
          </CardContent>
        </Card>

        {/* Retailers List */}
        <Card>
          <CardHeader>
            <CardTitle>Registered Retailers</CardTitle>
            <CardDescription>
              View and manage onboarded retail partners
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {retailers?.map((retailer) => (
                <div 
                  key={retailer.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{retailer.business_name}</p>
                      <Badge variant="outline">{retailer.retailer_code}</Badge>
                      {getStatusBadge(retailer.onboarding_status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{retailer.contact_person}</span>
                      <span>{retailer.email}</span>
                      <span>{retailer.countries?.name}</span>
                      {retailer.sales_representatives && (
                        <span>Rep: {retailer.sales_representatives.full_name}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {(!retailers || retailers.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Store className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No retailers registered yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
