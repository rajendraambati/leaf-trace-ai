import { useState } from 'react';
import { useERPReconciliation } from '@/hooks/useERPReconciliation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FileCheck, 
  Receipt, 
  Truck, 
  Package, 
  Download,
  RefreshCw,
  Filter,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

export function ERPReconciliation() {
  const { records, loading, stats, refetch } = useERPReconciliation();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCompliance, setFilterCompliance] = useState<string>('all');

  const filteredRecords = records.filter(record => {
    if (filterStatus !== 'all' && record.status !== filterStatus) return false;
    if (filterCompliance === 'compliant' && !record.gst_compliant) return false;
    if (filterCompliance === 'non_compliant' && record.gst_compliant) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      matched: { variant: 'default', icon: CheckCircle2, label: 'Fully Matched' },
      partial: { variant: 'secondary', icon: AlertTriangle, label: 'Partial Match' },
      missing_data: { variant: 'destructive', icon: XCircle, label: 'Missing Data' },
    };

    const config = variants[status] || variants.missing_data;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const exportReconciliationReport = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      // Title
      doc.setFontSize(18);
      doc.text('ERP Reconciliation Report', pageWidth / 2, 20, { align: 'center' });
      
      // Date
      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), 'PPpp')}`, pageWidth / 2, 28, { align: 'center' });
      
      // Summary Stats
      doc.setFontSize(12);
      doc.text('Summary Statistics', 14, 40);
      doc.setFontSize(10);
      let yPos = 48;
      doc.text(`Total Records: ${stats.total}`, 14, yPos);
      doc.text(`Fully Matched: ${stats.matched}`, 14, yPos + 6);
      doc.text(`Partial Matches: ${stats.partial}`, 14, yPos + 12);
      doc.text(`Missing Data: ${stats.missing_data}`, 14, yPos + 18);
      doc.text(`GST Compliant: ${stats.gst_compliant}`, 14, yPos + 24);
      doc.text(`Audit Ready: ${stats.audit_ready}`, 14, yPos + 30);
      
      // Detailed records
      yPos = 90;
      doc.setFontSize(12);
      doc.text('Reconciliation Details', 14, yPos);
      yPos += 10;
      
      filteredRecords.slice(0, 10).forEach((record, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. PO #${record.erp_order.po_number}`, 14, yPos);
        doc.setFont('helvetica', 'normal');
        yPos += 6;
        
        doc.text(`Status: ${record.status}`, 20, yPos);
        yPos += 5;
        doc.text(`GST Compliant: ${record.gst_compliant ? 'Yes' : 'No'}`, 20, yPos);
        yPos += 5;
        
        if (record.mismatches.length > 0) {
          doc.setFont('helvetica', 'italic');
          doc.text(`Issues: ${record.mismatches.join(', ')}`, 20, yPos);
          yPos += 5;
        }
        
        yPos += 8;
      });
      
      // Save the PDF
      doc.save(`reconciliation-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Reconciliation report exported successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to export report');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">ERP Reconciliation</h2>
          <p className="text-muted-foreground">
            Match orders with dispatch, delivery, and invoice records
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportReconciliationReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Fully Matched
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.matched}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.matched / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Partial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.partial}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Missing Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.missing_data}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Receipt className="h-4 w-4 text-blue-500" />
              GST Compliant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.gst_compliant}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-purple-500" />
              Audit Ready
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.audit_ready}</div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {stats.missing_data > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Action Required</AlertTitle>
          <AlertDescription>
            {stats.missing_data} orders have missing dispatch or delivery data. Review and complete missing records.
          </AlertDescription>
        </Alert>
      )}

      {stats.gst_compliant < stats.total && (
        <Alert>
          <Receipt className="h-4 w-4" />
          <AlertTitle>GST Compliance</AlertTitle>
          <AlertDescription>
            {stats.total - stats.gst_compliant} orders are not GST compliant. Generate invoices with proper GST details.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Match Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="matched">Fully Matched</SelectItem>
                  <SelectItem value="partial">Partial Match</SelectItem>
                  <SelectItem value="missing_data">Missing Data</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">GST Compliance</label>
              <Select value={filterCompliance} onValueChange={setFilterCompliance}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Records</SelectItem>
                  <SelectItem value="compliant">GST Compliant</SelectItem>
                  <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reconciliation Records */}
      <Card>
        <CardHeader>
          <CardTitle>Reconciliation Records</CardTitle>
          <CardDescription>
            Showing {filteredRecords.length} of {records.length} records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {filteredRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No records match the selected filters</p>
                </div>
              ) : (
                filteredRecords.map((record) => (
                  <Card key={record.erp_order.id} className="border-2">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-xl">PO #{record.erp_order.po_number}</CardTitle>
                          <CardDescription>
                            {record.erp_order.source_system} • {record.erp_order.product_type} • {record.erp_order.quantity_kg}kg
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(record.status)}
                          {record.gst_compliant && (
                            <Badge variant="outline" className="gap-1">
                              <Receipt className="h-3 w-3" />
                              GST ✓
                            </Badge>
                          )}
                          {record.audit_ready && (
                            <Badge variant="outline" className="gap-1">
                              <FileCheck className="h-3 w-3" />
                              Audit Ready
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Record Status Indicators */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="flex items-center gap-2">
                          <Package className={`h-4 w-4 ${record.erp_order ? 'text-green-500' : 'text-gray-300'}`} />
                          <span className="text-sm">ERP Order</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className={`h-4 w-4 ${record.dispatch_schedule ? 'text-green-500' : 'text-gray-300'}`} />
                          <span className="text-sm">Dispatch</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Truck className={`h-4 w-4 ${record.shipment ? 'text-green-500' : 'text-gray-300'}`} />
                          <span className="text-sm">Shipment</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className={`h-4 w-4 ${record.delivery_confirmation ? 'text-green-500' : 'text-gray-300'}`} />
                          <span className="text-sm">Delivery</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Receipt className={`h-4 w-4 ${record.invoice ? 'text-green-500' : 'text-gray-300'}`} />
                          <span className="text-sm">Invoice</span>
                        </div>
                      </div>

                      {/* Mismatches */}
                      {record.mismatches.length > 0 && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Issues Detected ({record.mismatches.length})</AlertTitle>
                          <AlertDescription>
                            <ul className="mt-2 space-y-1 list-disc list-inside">
                              {record.mismatches.map((mismatch, index) => (
                                <li key={index} className="text-sm">{mismatch}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Suggestions */}
                      {record.suggestions.length > 0 && (
                        <Alert>
                          <TrendingUp className="h-4 w-4" />
                          <AlertTitle>Suggested Actions</AlertTitle>
                          <AlertDescription>
                            <ul className="mt-2 space-y-1 list-disc list-inside">
                              {record.suggestions.map((suggestion, index) => (
                                <li key={index} className="text-sm">{suggestion}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
                        {record.dispatch_schedule && (
                          <div>
                            <p className="text-sm text-muted-foreground">Dispatch Status</p>
                            <p className="font-medium">{record.dispatch_schedule.dispatch_status}</p>
                          </div>
                        )}
                        {record.shipment && (
                          <div>
                            <p className="text-sm text-muted-foreground">Shipment Status</p>
                            <p className="font-medium">{record.shipment.status}</p>
                          </div>
                        )}
                        {record.invoice && (
                          <div>
                            <p className="text-sm text-muted-foreground">Invoice Amount</p>
                            <p className="font-medium">₹{record.invoice.amount?.toLocaleString()}</p>
                          </div>
                        )}
                        {record.invoice?.gst_amount && (
                          <div>
                            <p className="text-sm text-muted-foreground">GST Amount</p>
                            <p className="font-medium">₹{record.invoice.gst_amount.toLocaleString()}</p>
                          </div>
                        )}
                        {record.delivery_confirmation && (
                          <div>
                            <p className="text-sm text-muted-foreground">Delivered At</p>
                            <p className="font-medium">
                              {format(new Date(record.delivery_confirmation.confirmed_at), 'PPp')}
                            </p>
                          </div>
                        )}
                        {record.shipment?.actual_arrival && (
                          <div>
                            <p className="text-sm text-muted-foreground">Arrival Date</p>
                            <p className="font-medium">
                              {format(new Date(record.shipment.actual_arrival), 'PP')}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
