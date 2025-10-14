import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  ThumbsUp, 
  ThumbsDown,
  Activity,
  Star,
  Target,
  Zap
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import StatCard from "@/components/StatCard";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--destructive))'];

const AIInsights = () => {
  // Fetch feedback data
  const { data: feedbackData } = useQuery({
    queryKey: ['ai-feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_feedback')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Aggregate by feature type
      const byFeature = data.reduce((acc: any, fb) => {
        if (!acc[fb.feature_type]) {
          acc[fb.feature_type] = {
            feature: fb.feature_type,
            count: 0,
            avgRating: 0,
            ratings: []
          };
        }
        acc[fb.feature_type].count++;
        acc[fb.feature_type].ratings.push(fb.rating);
        return acc;
      }, {});

      Object.values(byFeature).forEach((f: any) => {
        f.avgRating = f.ratings.reduce((a: number, b: number) => a + b, 0) / f.ratings.length;
      });

      // Category distribution
      const byCategory = data.reduce((acc: any, fb) => {
        acc[fb.category] = (acc[fb.category] || 0) + 1;
        return acc;
      }, {});

      const categoryData = Object.entries(byCategory).map(([name, value]) => ({
        name: name.replace(/_/g, ' ').toUpperCase(),
        value
      }));

      return {
        all: data,
        byFeature: Object.values(byFeature),
        categoryData,
        avgRating: data.reduce((sum, fb) => sum + (fb.rating || 0), 0) / data.length
      };
    }
  });

  // Fetch AI usage analytics
  const { data: usageData } = useQuery({
    queryKey: ['ai-usage'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_usage_analytics')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;

      // Calculate acceptance rate
      const withDecision = data.filter(d => d.user_accepted !== null);
      const acceptanceRate = withDecision.length > 0
        ? (withDecision.filter(d => d.user_accepted).length / withDecision.length) * 100
        : 0;

      // Success rate
      const successRate = (data.filter(d => d.success).length / data.length) * 100;

      // Group by feature
      const byFeature = data.reduce((acc: any, usage) => {
        if (!acc[usage.feature_type]) {
          acc[usage.feature_type] = {
            feature: usage.feature_type,
            count: 0,
            avgConfidence: 0,
            avgTime: 0,
            confidences: [],
            times: []
          };
        }
        acc[usage.feature_type].count++;
        if (usage.confidence_score) acc[usage.feature_type].confidences.push(Number(usage.confidence_score));
        if (usage.execution_time_ms) acc[usage.feature_type].times.push(usage.execution_time_ms);
        return acc;
      }, {});

      Object.values(byFeature).forEach((f: any) => {
        f.avgConfidence = f.confidences.length > 0
          ? f.confidences.reduce((a: number, b: number) => a + b, 0) / f.confidences.length
          : 0;
        f.avgTime = f.times.length > 0
          ? f.times.reduce((a: number, b: number) => a + b, 0) / f.times.length
          : 0;
      });

      return {
        total: data.length,
        acceptanceRate,
        successRate,
        byFeature: Object.values(byFeature)
      };
    }
  });

  // Fetch model performance metrics
  const { data: performanceData } = useQuery({
    queryKey: ['model-performance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('model_performance_metrics')
        .select('*')
        .order('calculated_at', { ascending: true });
      
      if (error) throw error;

      // Group by feature and metric type
      const metrics = data.reduce((acc: any, metric) => {
        const key = `${metric.feature_type}_${metric.metric_type}`;
        if (!acc[key]) {
          acc[key] = {
            feature: metric.feature_type,
            metric: metric.metric_type,
            values: []
          };
        }
        acc[key].values.push({
          date: new Date(metric.calculated_at).toLocaleDateString(),
          value: Number(metric.metric_value)
        });
        return acc;
      }, {});

      return Object.values(metrics);
    }
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Insights & Feedback</h1>
        <p className="text-muted-foreground">
          User feedback, model performance, and enhancement priorities
        </p>
      </div>

      <Tabs defaultValue="feedback" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="feedback">User Feedback</TabsTrigger>
          <TabsTrigger value="usage">AI Usage Analytics</TabsTrigger>
          <TabsTrigger value="performance">Model Performance</TabsTrigger>
        </TabsList>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Total Feedback"
              value={feedbackData?.all.length || 0}
              icon={Activity}
            />
            <StatCard
              title="Average Rating"
              value={feedbackData?.avgRating.toFixed(1) || "0"}
              icon={Star}
            />
            <StatCard
              title="Bug Reports"
              value={feedbackData?.all.filter((f: any) => f.category === 'bug').length || 0}
              icon={ThumbsDown}
            />
            <StatCard
              title="Feature Requests"
              value={feedbackData?.all.filter((f: any) => f.category === 'feature_request').length || 0}
              icon={ThumbsUp}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Feedback by Feature</CardTitle>
                <CardDescription>Average ratings across AI features</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={feedbackData?.byFeature}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="feature" angle={-45} textAnchor="end" height={80} />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgRating" fill="hsl(var(--primary))" name="Avg Rating" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feedback Categories</CardTitle>
                <CardDescription>Distribution of feedback types</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={feedbackData?.categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {feedbackData?.categoryData?.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {feedbackData?.all.slice(0, 20).map((feedback: any) => (
                  <div key={feedback.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <Badge variant="outline">{feedback.feature_type}</Badge>
                        <Badge variant="secondary" className="ml-2">
                          {feedback.category.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < feedback.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {feedback.feedback_text && (
                      <p className="text-sm text-muted-foreground">{feedback.feedback_text}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(feedback.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Analytics Tab */}
        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Total AI Requests"
              value={usageData?.total || 0}
              icon={Activity}
            />
            <StatCard
              title="Success Rate"
              value={`${usageData?.successRate.toFixed(1)}%`}
              icon={Target}
            />
            <StatCard
              title="User Acceptance"
              value={`${usageData?.acceptanceRate.toFixed(1)}%`}
              icon={ThumbsUp}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Usage by Feature</CardTitle>
                <CardDescription>AI feature utilization</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={usageData?.byFeature}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="feature" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="hsl(var(--primary))" name="Requests" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Confidence Scores</CardTitle>
                <CardDescription>Model confidence by feature</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={usageData?.byFeature}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="feature" angle={-45} textAnchor="end" height={80} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgConfidence" fill="hsl(var(--secondary))" name="Avg Confidence" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Model Performance Trends
              </CardTitle>
              <CardDescription>Track metric improvements over time</CardDescription>
            </CardHeader>
            <CardContent>
              {performanceData && performanceData.length > 0 ? (
                <div className="space-y-6">
                  {performanceData.map((metric: any, index: number) => (
                    <div key={index}>
                      <h4 className="font-semibold mb-2">
                        {metric.feature} - {metric.metric.replace(/_/g, ' ').toUpperCase()}
                      </h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={metric.values}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No performance metrics available yet. Metrics will appear as AI models are evaluated.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIInsights;
