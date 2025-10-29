import Layout from '@/components/Layout';
import { SerializationManager } from '@/components/SerializationManager';

export default function Serialization() {
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <SerializationManager />
      </div>
    </Layout>
  );
}