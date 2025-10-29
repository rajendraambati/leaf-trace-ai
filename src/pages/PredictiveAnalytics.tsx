import Layout from '@/components/Layout';
import { PredictiveAnalyticsDashboard } from '@/components/PredictiveAnalyticsDashboard';

export default function PredictiveAnalytics() {
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <PredictiveAnalyticsDashboard />
      </div>
    </Layout>
  );
}