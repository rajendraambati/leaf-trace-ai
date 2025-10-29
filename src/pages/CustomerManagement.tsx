import { useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Plus,
  Edit,
  Building2,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Target
} from 'lucide-react';

export default function CustomerManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreateMarketOpen, setIsCreateMarketOpen] = useState(false);
  const [customerFormData, setCustomerFormData] = useState({
    customer_code: '',
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country_id: '',
    postal_code: '',
    tax_id: '',
    customer_type: 'distributor',
    credit_limit: 0,
    payment_terms: 'Net 30',
    is_active: true
  });

  const [marketFormData, setMarketFormData] = useState({
    market_name: '',
    country_id: '',
    market_segment: '',
    target_volume_kg: 0,
    pricing_strategy: '',
    is_active: true
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*, countries(*)')
        .order('company_name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: targetMarkets } = useQuery({
    queryKey: ['target-markets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('target_markets')
        .select('*, countries(*)')
        .order('market_name');
      
      if (error) throw error;
      return data;
    }
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

  const createCustomer = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('customers').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: "Customer Created", description: "Customer added successfully" });
      setIsCreateOpen(false);
      resetCustomerForm();
    }
  });

  const createMarket = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('target_markets').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['target-markets'] });
      toast({ title: "Market Created", description: "Target market added successfully" });
      setIsCreateMarketOpen(false);
      resetMarketForm();
    }
  });

  const resetCustomerForm = () => {
    setCustomerFormData({
      customer_code: '',
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country_id: '',
      postal_code: '',
      tax_id: '',
      customer_type: 'distributor',
      credit_limit: 0,
      payment_terms: 'Net 30',
      is_active: true
    });
  };

  const resetMarketForm = () => {
    setMarketFormData({
      market_name: '',
      country_id: '',
      market_segment: '',
      target_volume_kg: 0,
      pricing_strategy: '',
      is_active: true
    });
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Users className="h-8 w-8" />
              Customer & Market Management
            </h1>
            <p className="text-muted-foreground">
              Manage customers, target markets, and distribution channels
            </p>
          </div>
        </div>

        <Tabs defaultValue="customers" className="space-y-6">
          <TabsList>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="markets">Target Markets</TabsTrigger>
          </TabsList>

          <TabsContent value="customers" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetCustomerForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Customer
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Customer</DialogTitle>
                    <DialogDescription>
                      Create a new customer profile for dispatch and invoicing
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Customer Code *</Label>
                      <Input
                        value={customerFormData.customer_code}
                        onChange={(e) => setCustomerFormData({ ...customerFormData, customer_code: e.target.value })}
                        placeholder="CUST-001"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Company Name *</Label>
                      <Input
                        value={customerFormData.company_name}
                        onChange={(e) => setCustomerFormData({ ...customerFormData, company_name: e.target.value })}
                        placeholder="Company Name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Contact Person</Label>
                      <Input
                        value={customerFormData.contact_person}
                        onChange={(e) => setCustomerFormData({ ...customerFormData, contact_person: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={customerFormData.email}
                        onChange={(e) => setCustomerFormData({ ...customerFormData, email: e.target.value })}
                        placeholder="contact@company.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={customerFormData.phone}
                        onChange={(e) => setCustomerFormData({ ...customerFormData, phone: e.target.value })}
                        placeholder="+1234567890"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Country *</Label>
                      <Select value={customerFormData.country_id} onValueChange={(value) => setCustomerFormData({ ...customerFormData, country_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries?.map((country) => (
                            <SelectItem key={country.id} value={country.id}>
                              {country.name} ({country.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Address</Label>
                      <Textarea
                        value={customerFormData.address}
                        onChange={(e) => setCustomerFormData({ ...customerFormData, address: e.target.value })}
                        placeholder="Street address"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        value={customerFormData.city}
                        onChange={(e) => setCustomerFormData({ ...customerFormData, city: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>State/Province</Label>
                      <Input
                        value={customerFormData.state}
                        onChange={(e) => setCustomerFormData({ ...customerFormData, state: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Postal Code</Label>
                      <Input
                        value={customerFormData.postal_code}
                        onChange={(e) => setCustomerFormData({ ...customerFormData, postal_code: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tax ID</Label>
                      <Input
                        value={customerFormData.tax_id}
                        onChange={(e) => setCustomerFormData({ ...customerFormData, tax_id: e.target.value })}
                        placeholder="GST/VAT Number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Customer Type</Label>
                      <Select value={customerFormData.customer_type} onValueChange={(value) => setCustomerFormData({ ...customerFormData, customer_type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="distributor">Distributor</SelectItem>
                          <SelectItem value="retailer">Retailer</SelectItem>
                          <SelectItem value="wholesaler">Wholesaler</SelectItem>
                          <SelectItem value="manufacturer">Manufacturer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Credit Limit</Label>
                      <Input
                        type="number"
                        value={customerFormData.credit_limit}
                        onChange={(e) => setCustomerFormData({ ...customerFormData, credit_limit: parseFloat(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Payment Terms</Label>
                      <Select value={customerFormData.payment_terms} onValueChange={(value) => setCustomerFormData({ ...customerFormData, payment_terms: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Net 15">Net 15 days</SelectItem>
                          <SelectItem value="Net 30">Net 30 days</SelectItem>
                          <SelectItem value="Net 45">Net 45 days</SelectItem>
                          <SelectItem value="Net 60">Net 60 days</SelectItem>
                          <SelectItem value="Immediate">Immediate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                    <Button onClick={() => createCustomer.mutate(customerFormData)} disabled={!customerFormData.customer_code || !customerFormData.company_name}>
                      Add Customer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {customers?.map((customer) => (
                <Card key={customer.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {customer.company_name}
                    </CardTitle>
                    <CardDescription>
                      {customer.customer_code} • {customer.customer_type}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{customer.countries?.name || 'N/A'}</span>
                    </div>
                    {customer.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span>Credit: ${customer.credit_limit?.toLocaleString()}</span>
                    </div>
                    <Badge variant={customer.is_active ? 'default' : 'secondary'}>
                      {customer.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="markets" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isCreateMarketOpen} onOpenChange={setIsCreateMarketOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetMarketForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Target Market
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Target Market</DialogTitle>
                    <DialogDescription>
                      Define a new target market segment
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Market Name *</Label>
                      <Input
                        value={marketFormData.market_name}
                        onChange={(e) => setMarketFormData({ ...marketFormData, market_name: e.target.value })}
                        placeholder="e.g., Premium Distributors - UAE"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Country *</Label>
                      <Select value={marketFormData.country_id} onValueChange={(value) => setMarketFormData({ ...marketFormData, country_id: value })}>
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
                      <Label>Market Segment</Label>
                      <Select value={marketFormData.market_segment} onValueChange={(value) => setMarketFormData({ ...marketFormData, market_segment: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select segment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="mid-market">Mid-Market</SelectItem>
                          <SelectItem value="economy">Economy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Target Volume (kg/year)</Label>
                      <Input
                        type="number"
                        value={marketFormData.target_volume_kg}
                        onChange={(e) => setMarketFormData({ ...marketFormData, target_volume_kg: parseFloat(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Pricing Strategy</Label>
                      <Input
                        value={marketFormData.pricing_strategy}
                        onChange={(e) => setMarketFormData({ ...marketFormData, pricing_strategy: e.target.value })}
                        placeholder="e.g., Competitive pricing"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateMarketOpen(false)}>Cancel</Button>
                    <Button onClick={() => createMarket.mutate(marketFormData)} disabled={!marketFormData.market_name || !marketFormData.country_id}>
                      Add Market
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {targetMarkets?.map((market) => (
                <Card key={market.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      {market.market_name}
                    </CardTitle>
                    <CardDescription>
                      {market.market_segment} • {market.countries?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Target Volume:</span>
                      <span className="font-medium ml-2">{market.target_volume_kg?.toLocaleString()} kg</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Current Volume:</span>
                      <span className="font-medium ml-2">{market.current_volume_kg?.toLocaleString()} kg</span>
                    </div>
                    {market.pricing_strategy && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Strategy:</span>
                        <span className="font-medium ml-2">{market.pricing_strategy}</span>
                      </div>
                    )}
                    <Badge variant={market.is_active ? 'default' : 'secondary'}>
                      {market.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}