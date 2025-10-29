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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Megaphone, TrendingUp, DollarSign, Users, Calendar } from 'lucide-react';

export default function PromotionalCampaigns() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    campaign_name: '',
    campaign_type: 'discount',
    description: '',
    start_date: '',
    end_date: '',
    discount_percentage: '',
    budget: '',
    target_audience: 'all_retailers'
  });

  const { data: campaigns } = useQuery({
    queryKey: ['promotional-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotional_campaigns')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    }
  });

  const submitCampaign = async () => {
    if (!formData.campaign_name || !formData.start_date || !formData.end_date) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const campaignCode = `CAMP-${Date.now().toString().slice(-8)}`;
      
      const { error } = await supabase
        .from('promotional_campaigns')
        .insert({
          campaign_code: campaignCode,
          ...formData,
          discount_percentage: formData.discount_percentage ? parseFloat(formData.discount_percentage) : null,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          status: 'draft'
        });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['promotional-campaigns'] });
      
      toast({
        title: "Campaign Created",
        description: `Campaign ${campaignCode} created successfully`
      });

      setFormData({
        campaign_name: '',
        campaign_type: 'discount',
        description: '',
        start_date: '',
        end_date: '',
        discount_percentage: '',
        budget: '',
        target_audience: 'all_retailers'
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create campaign",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'draft': 'secondary',
      'active': 'default',
      'completed': 'outline',
      'cancelled': 'destructive'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Megaphone className="h-8 w-8" />
              Promotional Campaigns
            </h1>
            <p className="text-muted-foreground">
              Create and manage promotional campaigns for retail partners
            </p>
          </div>
        </div>

        {/* Campaign Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Campaign</CardTitle>
            <CardDescription>
              Set up promotional campaigns to drive retail sales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Campaign Name *</Label>
                <Input
                  value={formData.campaign_name}
                  onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                  placeholder="Summer Sale 2024"
                />
              </div>

              <div className="space-y-2">
                <Label>Campaign Type *</Label>
                <Select value={formData.campaign_type} onValueChange={(value) => setFormData({ ...formData, campaign_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">Discount</SelectItem>
                    <SelectItem value="volume_incentive">Volume Incentive</SelectItem>
                    <SelectItem value="seasonal">Seasonal</SelectItem>
                    <SelectItem value="loyalty">Loyalty Program</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select value={formData.target_audience} onValueChange={(value) => setFormData({ ...formData, target_audience: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_retailers">All Retailers</SelectItem>
                    <SelectItem value="new_retailers">New Retailers</SelectItem>
                    <SelectItem value="top_performers">Top Performers</SelectItem>
                    <SelectItem value="region_specific">Region Specific</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Campaign details and objectives"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Discount Percentage</Label>
                <Input
                  type="number"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                  placeholder="15"
                  step="0.1"
                />
              </div>

              <div className="space-y-2">
                <Label>Budget</Label>
                <Input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="10000"
                />
              </div>
            </div>

            <Button 
              onClick={submitCampaign} 
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              <Megaphone className="mr-2 h-5 w-5" />
              {isSubmitting ? 'Creating...' : 'Create Campaign'}
            </Button>
          </CardContent>
        </Card>

        {/* Campaigns List */}
        <Card>
          <CardHeader>
            <CardTitle>Active Campaigns</CardTitle>
            <CardDescription>
              Manage promotional campaigns and track performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {campaigns?.map((campaign) => (
                <div 
                  key={campaign.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{campaign.campaign_name}</p>
                      <Badge variant="outline">{campaign.campaign_code}</Badge>
                      {getStatusBadge(campaign.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                      </span>
                      {campaign.discount_percentage && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {campaign.discount_percentage}% off
                        </span>
                      )}
                      {campaign.budget && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Budget: ${campaign.budget.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {(!campaigns || campaigns.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Megaphone className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No campaigns created yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
