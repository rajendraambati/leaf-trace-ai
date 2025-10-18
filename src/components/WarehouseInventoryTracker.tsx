import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { toast } from "sonner";

interface InventoryEntry {
  id: string;
  warehouse_id: string;
  batch_id: string;
  quantity_kg: number;
  entry_date: string;
  exit_date: string | null;
  created_at: string;
}

interface WarehouseInfo {
  id: string;
  name: string;
}

export default function WarehouseInventoryTracker() {
  const [inventory, setInventory] = useState<InventoryEntry[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('inventory-tracking')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'warehouse_inventory' }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const [inventoryResponse, warehouseResponse] = await Promise.all([
      supabase
        .from('warehouse_inventory')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('warehouses')
        .select('id, name')
    ]);

    if (inventoryResponse.error) {
      toast.error('Failed to fetch inventory data');
      console.error(inventoryResponse.error);
    } else {
      setInventory(inventoryResponse.data || []);
    }

    if (warehouseResponse.error) {
      console.error(warehouseResponse.error);
    } else {
      setWarehouses(warehouseResponse.data || []);
    }

    setLoading(false);
  };

  const getWarehouseName = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : warehouseId;
  };

  const getTransactionType = (item: InventoryEntry) => {
    if (item.exit_date) {
      return {
        type: 'exit',
        label: 'Inventory Shipped to Processing Unit',
        icon: <ArrowUpCircle className="w-4 h-4 text-destructive" />,
        variant: 'destructive' as const
      };
    }
    return {
      type: 'entry',
      label: 'Inventory Stored',
      icon: <ArrowDownCircle className="w-4 h-4 text-success" />,
      variant: 'default' as const
    };
  };

  const exportToExcel = () => {
    const headers = ['Transaction Type', 'Warehouse', 'Batch ID', 'Quantity (kg)', 'Entry Date', 'Exit Date', 'Status'];
    const rows = inventory.map(item => {
      const transaction = getTransactionType(item);
      return [
        transaction.label,
        getWarehouseName(item.warehouse_id),
        item.batch_id,
        item.quantity_kg,
        new Date(item.entry_date).toLocaleString(),
        item.exit_date ? new Date(item.exit_date).toLocaleString() : 'N/A',
        item.exit_date ? 'Exited' : 'In Stock'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `warehouse_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Inventory data exported successfully');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading inventory data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Warehouse Inventory Tracker</CardTitle>
            <CardDescription>
              Complete history of inventory entries and exits
            </CardDescription>
          </div>
          <Button onClick={exportToExcel} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export to Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Transaction Type</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Batch ID</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Entry Date</TableHead>
                <TableHead>Exit Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No inventory movements recorded yet
                  </TableCell>
                </TableRow>
              ) : (
                inventory.map((item) => {
                  const transaction = getTransactionType(item);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{transaction.icon}</TableCell>
                      <TableCell className="font-medium">{transaction.label}</TableCell>
                      <TableCell>{getWarehouseName(item.warehouse_id)}</TableCell>
                      <TableCell className="font-mono text-sm">{item.batch_id}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {item.quantity_kg.toLocaleString()} kg
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(item.entry_date).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.exit_date ? new Date(item.exit_date).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.exit_date ? 'secondary' : 'default'}>
                          {item.exit_date ? 'Exited' : 'In Stock'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
