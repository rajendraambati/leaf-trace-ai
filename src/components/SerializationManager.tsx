import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Package, 
  Box, 
  Boxes, 
  QrCode, 
  Link as LinkIcon, 
  Unlink,
  Wrench,
  Globe,
  History,
  AlertCircle
} from 'lucide-react';

export function SerializationManager() {
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [unitType, setUnitType] = useState('pack');
  const [count, setCount] = useState(1);
  const [productCode, setProductCode] = useState('');
  const [serializedUnits, setSerializedUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    const { data } = await supabase
      .from('procurement_batches')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setBatches(data);
  };

  const fetchSerializedUnits = async (batchId?: string) => {
    let query = supabase
      .from('serialized_units')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (batchId) {
      query = query.eq('batch_id', batchId);
    }

    const { data } = await query;
    if (data) setSerializedUnits(data);
  };

  const generateSerialNumbers = async () => {
    if (!selectedBatch || !productCode) {
      toast({ title: 'Error', description: 'Please select batch and enter product code', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('serialization-management', {
        body: {
          batchId: selectedBatch,
          unitType,
          count,
          productCode
        }
      });

      if (error) throw error;

      toast({ title: 'Success', description: `Generated ${count} serial numbers` });
      fetchSerializedUnits(selectedBatch);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const syncToCompliance = async (syncType: 'eu_tpd' | 'gcc_traceability') => {
    if (serializedUnits.length === 0) {
      toast({ title: 'Error', description: 'No units to sync', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const serialNumbers = serializedUnits.map(u => u.serial_number);
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.functions.invoke('compliance-sync', {
        body: {
          syncType,
          serialNumbers,
          initiatedBy: user?.id
        }
      });

      if (error) throw error;

      toast({ 
        title: 'Success', 
        description: `Synced ${serialNumbers.length} units to ${syncType === 'eu_tpd' ? 'EU TPD' : 'GCC Traceability'}`
      });
      fetchSerializedUnits(selectedBatch);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getUnitIcon = (type: string) => {
    switch (type) {
      case 'pack': return <Package className="h-4 w-4" />;
      case 'carton': return <Box className="h-4 w-4" />;
      case 'pallet': return <Boxes className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'aggregated': return 'secondary';
      case 'shipped': return 'outline';
      case 'reworked': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Serialization & Traceability Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="generate">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="generate">Generate</TabsTrigger>
              <TabsTrigger value="aggregate">Aggregate</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Batch</Label>
                  <Select value={selectedBatch} onValueChange={(value) => {
                    setSelectedBatch(value);
                    fetchSerializedUnits(value);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {batches.map(batch => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.id} - {batch.quantity_kg}kg
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Unit Type</Label>
                  <Select value={unitType} onValueChange={setUnitType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pack">Pack</SelectItem>
                      <SelectItem value="carton">Carton</SelectItem>
                      <SelectItem value="pallet">Pallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Product Code</Label>
                  <Input
                    value={productCode}
                    onChange={(e) => setProductCode(e.target.value)}
                    placeholder="e.g., TOB-GRADE-A-2024"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <Button 
                onClick={generateSerialNumbers} 
                disabled={loading}
                className="w-full"
              >
                Generate Serial Numbers
              </Button>
            </TabsContent>

            <TabsContent value="aggregate" className="space-y-4">
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Aggregate Units
                </Button>
                <Button variant="outline" className="flex-1">
                  <Unlink className="mr-2 h-4 w-4" />
                  Disaggregate
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Select parent unit and child units to create aggregation relationships
              </p>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={() => syncToCompliance('eu_tpd')}
                  disabled={loading}
                  variant="outline"
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Sync to EU TPD
                </Button>
                <Button 
                  onClick={() => syncToCompliance('gcc_traceability')}
                  disabled={loading}
                  variant="outline"
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Sync to GCC
                </Button>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Compliance Sync Status</p>
                    <p className="text-muted-foreground mt-1">
                      {serializedUnits.length} units ready for sync
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="space-y-2">
                <Label>Search Serial Number</Label>
                <Input placeholder="Enter serial number to view history" />
              </div>
              <Button variant="outline" className="w-full">
                <History className="mr-2 h-4 w-4" />
                View Complete History
              </Button>
            </TabsContent>
          </Tabs>

          {serializedUnits.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-lg font-semibold">Serialized Units</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {serializedUnits.map(unit => (
                  <Card key={unit.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getUnitIcon(unit.unit_type)}
                          <span className="text-sm font-medium">{unit.unit_type}</span>
                        </div>
                        <Badge variant={getStatusColor(unit.status)}>
                          {unit.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-xs">
                        <p className="font-mono truncate">{unit.serial_number}</p>
                        <p className="text-muted-foreground">{unit.product_code}</p>
                        {unit.eu_tpd_id && (
                          <p className="text-green-600">EU TPD: {unit.eu_tpd_id.substring(0, 12)}...</p>
                        )}
                        {unit.gcc_traceability_id && (
                          <p className="text-blue-600">GCC: {unit.gcc_traceability_id.substring(0, 12)}...</p>
                        )}
                      </div>
                      <div className="mt-2 flex justify-center">
                        <QRCodeSVG value={unit.serial_number} size={80} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}