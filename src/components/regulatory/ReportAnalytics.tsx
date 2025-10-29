import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';

interface ReportAnalyticsProps {
  reports: any[];
}

export default function ReportAnalytics({ reports }: ReportAnalyticsProps) {
  // Status distribution
  const statusData = [
    { name: 'Submitted', value: reports.filter(r => r.submission_status === 'submitted').length, color: '#10b981' },
    { name: 'Draft', value: reports.filter(r => r.submission_status === 'draft').length, color: '#f59e0b' },
    { name: 'Failed', value: reports.filter(r => r.submission_status === 'failed').length, color: '#ef4444' }
  ];

  // Reports by type
  const typeData = reports.reduce((acc: any[], report) => {
    const existing = acc.find(item => item.type === report.report_type);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ type: report.report_type, count: 1 });
    }
    return acc;
  }, []);

  // Monthly trend (last 6 months)
  const monthlyData = reports.reduce((acc: any[], report) => {
    const month = new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const existing = acc.find(item => item.month === month);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ month, count: 1 });
    }
    return acc;
  }, []).slice(-6);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Submission Status Distribution
          </CardTitle>
          <CardDescription>
            Breakdown of report statuses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Reports by Type
          </CardTitle>
          <CardDescription>
            Distribution of report types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={typeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Monthly Submission Trend</CardTitle>
          <CardDescription>
            Report submissions over the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
