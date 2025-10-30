import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format } from 'date-fns';

export interface BIFilters {
  region?: string;
  clientId?: string;
  productType?: string;
  startDate: Date;
  endDate: Date;
}

export interface BIMetrics {
  dispatchSuccessRate: number;
  complianceScore: number;
  inventoryTurnover: number;
  fleetUtilization: number;
  totalShipments: number;
  onTimeDeliveries: number;
  avgDeliveryTime: number;
  complianceReports: number;
  totalInventory: number;
  activeVehicles: number;
  reconciliationRate: number;
  gstCompliance: number;
  auditReadiness: number;
  dataIntegrity: number;
}

export function useBIReports(filters: BIFilters) {
  return useQuery({
    queryKey: ['bi-reports', filters],
    queryFn: async () => {
      const { startDate, endDate, region, clientId, productType } = filters;

      // Fetch shipments data
      let shipmentsQuery = supabase
        .from('shipments')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (region) {
        shipmentsQuery = shipmentsQuery.or(`from_location.ilike.%${region}%,to_location.ilike.%${region}%`);
      }

      const { data: shipments, error: shipmentsError } = await shipmentsQuery;
      if (shipmentsError) throw shipmentsError;

      // Fetch compliance reports
      const { data: complianceReports, error: complianceError } = await supabase
        .from('compliance_reports')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      
      if (complianceError) throw complianceError;

      // Fetch warehouse inventory
      let inventoryQuery = supabase
        .from('warehouse_inventory')
        .select('*, warehouses(name, location)');

      const { data: inventory, error: inventoryError } = await inventoryQuery;
      if (inventoryError) throw inventoryError;

      // Fetch vehicles
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*');
      
      if (vehiclesError) throw vehiclesError;

      // Fetch ERP data for reconciliation
      const { data: erpOrders, error: erpError } = await supabase
        .from('erp_procurement_orders')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      
      if (erpError) throw erpError;

      const { data: dispatchSchedules, error: dispatchError } = await supabase
        .from('warehouse_dispatch_schedule')
        .select('*');
      
      if (dispatchError) throw dispatchError;

      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*');
      
      if (invoicesError) throw invoicesError;

      const { data: deliveryConfirmations, error: deliveryError } = await supabase
        .from('delivery_confirmations')
        .select('*');
      
      if (deliveryError) throw deliveryError;

      // Calculate metrics
      const totalShipments = shipments?.length || 0;
      const deliveredShipments = shipments?.filter(s => s.status === 'delivered') || [];
      const onTimeDeliveries = deliveredShipments.filter(s => {
        if (!s.eta || !s.actual_arrival) return false;
        return new Date(s.actual_arrival) <= new Date(s.eta);
      }).length;

      const dispatchSuccessRate = totalShipments > 0 ? (deliveredShipments.length / totalShipments) * 100 : 0;

      // Compliance score based on report status
      const submittedReports = complianceReports?.filter(r => r.submission_status === 'submitted').length || 0;
      const totalReports = complianceReports?.length || 1;
      const complianceScore = (submittedReports / totalReports) * 100;

      // Inventory turnover (simplified calculation)
      const totalInventory = inventory?.reduce((sum, inv) => sum + Number(inv.quantity_kg), 0) || 0;
      const inventoryTurnover = totalShipments > 0 ? 
        (deliveredShipments.reduce((sum, s) => sum + Number(s.batch_id?.split(',').length || 1), 0) / totalInventory * 365) : 0;

      // Fleet utilization
      const activeVehicles = vehicles?.filter(v => v.status === 'active').length || 0;
      const totalVehicles = vehicles?.length || 1;
      const fleetUtilization = (activeVehicles / totalVehicles) * 100;

      // Average delivery time
      const avgDeliveryTime = deliveredShipments.length > 0 ?
        deliveredShipments.reduce((sum, s) => {
          if (!s.departure_time || !s.actual_arrival) return sum;
          const diff = new Date(s.actual_arrival).getTime() - new Date(s.departure_time).getTime();
          return sum + (diff / (1000 * 60 * 60)); // hours
        }, 0) / deliveredShipments.length : 0;

      // Calculate reconciliation metrics
      const totalErpOrders = erpOrders?.length || 0;
      let fullyReconciled = 0;
      let gstCompliant = 0;
      let auditReady = 0;

      erpOrders?.forEach(order => {
        const dispatch = dispatchSchedules?.find(d => d.erp_order_id === order.id);
        const shipment = shipments?.find(s => s.batch_id === dispatch?.batch_id);
        const invoice = invoices?.find(i => i.batch_id === dispatch?.batch_id);
        const delivery = deliveryConfirmations?.find(d => d.shipment_id === shipment?.id);

        if (dispatch && shipment && invoice && delivery) {
          fullyReconciled++;
        }

        if (invoice?.invoice_number && invoice?.tax_amount) {
          gstCompliant++;
        }

        if (order.validation_status === 'accepted' && dispatch && shipment?.status === 'delivered' && invoice && delivery) {
          auditReady++;
        }
      });

      const reconciliationRate = totalErpOrders > 0 ? (fullyReconciled / totalErpOrders) * 100 : 0;
      const gstComplianceRate = totalErpOrders > 0 ? (gstCompliant / totalErpOrders) * 100 : 0;
      const auditReadinessRate = totalErpOrders > 0 ? (auditReady / totalErpOrders) * 100 : 0;
      const dataIntegrityScore = (reconciliationRate + gstComplianceRate + auditReadinessRate) / 3;

      const metrics: BIMetrics = {
        dispatchSuccessRate,
        complianceScore,
        inventoryTurnover,
        fleetUtilization,
        totalShipments,
        onTimeDeliveries,
        avgDeliveryTime,
        complianceReports: totalReports,
        totalInventory,
        activeVehicles,
        reconciliationRate,
        gstCompliance: gstComplianceRate,
        auditReadiness: auditReadinessRate,
        dataIntegrity: dataIntegrityScore
      };

      // Get trend data for charts
      const dailyData = shipments?.reduce((acc: any, shipment) => {
        const date = format(new Date(shipment.created_at), 'MMM dd');
        if (!acc[date]) {
          acc[date] = { date, shipments: 0, delivered: 0, delayed: 0 };
        }
        acc[date].shipments += 1;
        if (shipment.status === 'delivered') acc[date].delivered += 1;
        if (shipment.status === 'delayed' || 
            (shipment.eta && new Date(shipment.eta) < new Date())) {
          acc[date].delayed += 1;
        }
        return acc;
      }, {});

      const trendData = Object.values(dailyData || {});

      return { metrics, trendData, shipments, complianceReports, inventory, vehicles };
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });
}

export function useCreateReportShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      reportName: string;
      reportConfig: any;
      expiresInDays: number;
    }) => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + data.expiresInDays);

      const shareToken = `share_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

      const { data: shareData, error } = await supabase
        .from('bi_report_shares')
        .insert({
          share_token: shareToken,
          report_name: data.reportName,
          report_config: data.reportConfig,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return shareData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bi-report-shares'] });
    },
  });
}

export function useReportShares() {
  return useQuery({
    queryKey: ['bi-report-shares'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bi_report_shares')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}
