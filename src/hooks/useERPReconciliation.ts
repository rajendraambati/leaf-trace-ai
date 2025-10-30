import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ReconciliationRecord {
  erp_order: any;
  dispatch_schedule: any;
  shipment: any;
  invoice: any;
  delivery_confirmation: any;
  status: 'matched' | 'partial' | 'missing_data';
  mismatches: string[];
  suggestions: string[];
  gst_compliant: boolean;
  audit_ready: boolean;
}

export function useERPReconciliation() {
  const [records, setRecords] = useState<ReconciliationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    matched: 0,
    partial: 0,
    missing_data: 0,
    gst_compliant: 0,
    audit_ready: 0,
  });

  useEffect(() => {
    fetchReconciliationData();

    const channel = supabase
      .channel('reconciliation-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'erp_procurement_orders' }, fetchReconciliationData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'warehouse_dispatch_schedule' }, fetchReconciliationData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, fetchReconciliationData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, fetchReconciliationData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_confirmations' }, fetchReconciliationData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReconciliationData = async () => {
    setLoading(true);

    try {
      // Fetch all related data
      const [
        { data: erpOrders },
        { data: dispatchSchedules },
        { data: shipments },
        { data: invoices },
        { data: deliveryConfirmations },
      ] = await Promise.all([
        supabase.from('erp_procurement_orders').select('*').order('created_at', { ascending: false }),
        supabase.from('warehouse_dispatch_schedule').select('*'),
        supabase.from('shipments').select('*'),
        supabase.from('invoices').select('*'),
        supabase.from('delivery_confirmations').select('*'),
      ]);

      // Create lookup maps
      const dispatchMap = new Map(dispatchSchedules?.map(d => [d.erp_order_id, d]) || []);
      const shipmentMap = new Map();
      const invoiceMap = new Map();
      const deliveryMap = new Map(deliveryConfirmations?.map(d => [d.shipment_id, d]) || []);

      // Map shipments by batch_id
      shipments?.forEach(shipment => {
        if (shipment.batch_id) {
          if (!shipmentMap.has(shipment.batch_id)) {
            shipmentMap.set(shipment.batch_id, []);
          }
          shipmentMap.get(shipment.batch_id).push(shipment);
        }
      });

      // Map invoices by batch_id
      invoices?.forEach(invoice => {
        if (invoice.batch_id) {
          invoiceMap.set(invoice.batch_id, invoice);
        }
      });

      // Reconcile each ERP order
      const reconciledRecords: ReconciliationRecord[] = (erpOrders || []).map(order => {
        const dispatch = dispatchMap.get(order.id);
        const batchShipments = dispatch?.batch_id ? shipmentMap.get(dispatch.batch_id) || [] : [];
        const shipment = batchShipments[0]; // Take first shipment for the batch
        const invoice = dispatch?.batch_id ? invoiceMap.get(dispatch.batch_id) : null;
        const delivery = shipment ? deliveryMap.get(shipment.id) : null;

        const mismatches: string[] = [];
        const suggestions: string[] = [];

        // Check for missing data
        if (!dispatch) {
          mismatches.push('Missing dispatch schedule');
          suggestions.push('Create dispatch schedule in warehouse validation');
        }

        if (dispatch && dispatch.dispatch_status !== 'completed' && !shipment) {
          mismatches.push('Dispatch scheduled but no shipment created');
          suggestions.push('Ensure shipment is created when dispatch starts');
        }

        if (shipment && shipment.status === 'delivered' && !delivery) {
          mismatches.push('Shipment delivered but no delivery confirmation');
          suggestions.push('Request driver to submit delivery confirmation');
        }

        if (shipment && shipment.status === 'delivered' && !invoice) {
          mismatches.push('Delivered order missing invoice');
          suggestions.push('Generate GST invoice for completed delivery');
        }

        // Check quantity mismatches
        if (order.confirmed_quantity_kg && dispatch?.batch_id) {
          const batch = shipments?.find(s => s.batch_id === dispatch.batch_id);
          if (batch && shipment) {
            // Compare quantities (simplified - should fetch actual batch quantity)
            if (order.confirmed_quantity_kg !== order.quantity_kg) {
              mismatches.push(`Quantity mismatch: Ordered ${order.quantity_kg}kg, confirmed ${order.confirmed_quantity_kg}kg`);
              suggestions.push('Update ERP system with confirmed quantity');
            }
          }
        }

        // Check delivery date mismatches
        if (order.delivery_date && shipment?.actual_arrival) {
          const expectedDate = new Date(order.delivery_date);
          const actualDate = new Date(shipment.actual_arrival);
          const daysDiff = Math.floor((actualDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (Math.abs(daysDiff) > 2) {
            mismatches.push(`Delivery date variance: ${daysDiff > 0 ? 'Late' : 'Early'} by ${Math.abs(daysDiff)} days`);
            suggestions.push('Update ERP with actual delivery date and document reason');
          }
        }

        // Check invoice amount matches
        if (invoice && order.confirmed_quantity_kg) {
          // Simplified calculation - should include actual pricing logic
          const expectedAmount = order.confirmed_quantity_kg * 10; // placeholder rate
          if (invoice.amount && Math.abs(invoice.amount - expectedAmount) > 100) {
            mismatches.push(`Invoice amount discrepancy detected`);
            suggestions.push('Review pricing and recalculate invoice amount');
          }
        }

        // GST compliance check
        const gst_compliant = invoice ? 
          !!(invoice.gst_number && invoice.gst_amount && invoice.invoice_number) :
          false;

        if (shipment?.status === 'delivered' && !gst_compliant) {
          mismatches.push('GST compliance incomplete');
          suggestions.push('Generate GST-compliant invoice with all required fields');
        }

        // Audit readiness check
        const audit_ready = !!(
          order.validation_status === 'accepted' &&
          dispatch &&
          shipment &&
          shipment.status === 'delivered' &&
          delivery &&
          invoice &&
          gst_compliant &&
          mismatches.length === 0
        );

        // Determine overall status
        let status: 'matched' | 'partial' | 'missing_data';
        if (audit_ready) {
          status = 'matched';
        } else if (dispatch && (shipment || invoice)) {
          status = 'partial';
        } else {
          status = 'missing_data';
        }

        return {
          erp_order: order,
          dispatch_schedule: dispatch || null,
          shipment: shipment || null,
          invoice: invoice || null,
          delivery_confirmation: delivery || null,
          status,
          mismatches,
          suggestions,
          gst_compliant,
          audit_ready,
        };
      });

      setRecords(reconciledRecords);

      // Calculate stats
      const newStats = {
        total: reconciledRecords.length,
        matched: reconciledRecords.filter(r => r.status === 'matched').length,
        partial: reconciledRecords.filter(r => r.status === 'partial').length,
        missing_data: reconciledRecords.filter(r => r.status === 'missing_data').length,
        gst_compliant: reconciledRecords.filter(r => r.gst_compliant).length,
        audit_ready: reconciledRecords.filter(r => r.audit_ready).length,
      };
      setStats(newStats);

    } catch (error) {
      console.error('Error fetching reconciliation data:', error);
    } finally {
      setLoading(false);
    }
  };

  return { records, loading, stats, refetch: fetchReconciliationData };
}
