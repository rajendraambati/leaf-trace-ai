import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import StatCard from '@/components/StatCard';
import { UserCheck, TrendingUp, DollarSign, Store, Award } from 'lucide-react';

export default function SalesRepTracking() {
  const { data: salesReps } = useQuery({
    queryKey: ['sales-representatives'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_representatives')
        .select('*')
        .eq('is_active', true)
        .order('full_name');
      if (error) throw error;
      return data;
    }
  });

  const { data: retailersCount } = useQuery({
    queryKey: ['retailers-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('retailers')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    }
  });

  const { data: ordersData } = useQuery({
    queryKey: ['retailer-orders-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('retailer_orders')
        .select('total_amount, sales_rep_id');
      if (error) throw error;
      
      const totalRevenue = data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      return { totalRevenue, ordersCount: data?.length || 0 };
    }
  });

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <UserCheck className="h-8 w-8" />
              Sales Representative Tracking
            </h1>
            <p className="text-muted-foreground">
              Monitor sales team performance and retail partner relationships
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Active Sales Reps"
            value={salesReps?.length || 0}
            icon={UserCheck}
          />
          <StatCard
            title="Total Retailers"
            value={retailersCount || 0}
            icon={Store}
          />
          <StatCard
            title="Total Orders"
            value={ordersData?.ordersCount || 0}
            icon={TrendingUp}
          />
          <StatCard
            title="Total Revenue"
            value={`$${(ordersData?.totalRevenue || 0).toLocaleString()}`}
            icon={DollarSign}
          />
        </div>

        {/* Sales Reps List */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Representatives</CardTitle>
            <CardDescription>
              Active sales team members and their performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {salesReps?.map((rep) => (
                <div 
                  key={rep.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{rep.full_name}</p>
                      <Badge variant="outline">{rep.employee_id}</Badge>
                      {rep.is_active && (
                        <Badge variant="default">Active</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{rep.email}</span>
                      {rep.territory && <span>Territory: {rep.territory}</span>}
                      {rep.region && <span>Region: {rep.region}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <Award className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              ))}

              {(!salesReps || salesReps.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <UserCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No sales representatives found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
