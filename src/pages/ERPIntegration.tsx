import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ERPOrdersDashboard } from '@/components/ERPOrdersDashboard';
import { WarehouseERPValidation } from '@/components/WarehouseERPValidation';
import { Package, ClipboardCheck } from 'lucide-react';

export default function ERPIntegration() {
  return (
    <div className="container mx-auto py-8">
      <Tabs defaultValue="validation" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="validation">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Warehouse Validation
          </TabsTrigger>
          <TabsTrigger value="overview">
            <Package className="h-4 w-4 mr-2" />
            Orders Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="validation">
          <WarehouseERPValidation />
        </TabsContent>

        <TabsContent value="overview">
          <ERPOrdersDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}