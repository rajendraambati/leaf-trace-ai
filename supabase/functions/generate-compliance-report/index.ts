import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportRequest {
  reportType: 'gst' | 'fctc' | 'esg' | 'all';
  startDate: string;
  endDate: string;
  format?: 'json' | 'csv' | 'xml';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { reportType, startDate, endDate, format = 'json' }: ReportRequest = await req.json();
    
    console.log(`Generating ${reportType} report from ${startDate} to ${endDate}`);

    let reportData: any = {};

    // Generate GST Report
    if (reportType === 'gst' || reportType === 'all') {
      const { data: procurementData } = await supabase
        .from('procurement_batches')
        .select('*, farmers(*)')
        .gte('procurement_date', startDate)
        .lte('procurement_date', endDate);

      const gstReport = {
        reportType: 'GST',
        period: { startDate, endDate },
        generatedAt: new Date().toISOString(),
        summary: {
          totalTransactions: procurementData?.length || 0,
          totalValue: procurementData?.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0) || 0,
          totalQuantity: procurementData?.reduce((sum, b) => sum + (Number(b.quantity_kg) || 0), 0) || 0,
        },
        transactions: procurementData?.map(batch => ({
          batchId: batch.id,
          date: batch.procurement_date,
          farmerName: batch.farmers?.name,
          farmerGSTIN: batch.farmers?.phone, // Should be actual GSTIN field
          quantity: batch.quantity_kg,
          pricePerKg: batch.price_per_kg,
          totalAmount: batch.total_price,
          taxableValue: Number(batch.total_price) * 0.85, // Example calculation
          gstAmount: Number(batch.total_price) * 0.15,
          grade: batch.grade,
        })),
      };
      reportData.gst = gstReport;
    }

    // Generate FCTC Report (Framework Convention on Tobacco Control)
    if (reportType === 'fctc' || reportType === 'all') {
      const { data: farmersData } = await supabase
        .from('farmers')
        .select('*, farmer_certifications(*), procurement_batches(*)');

      const { data: complianceData } = await supabase
        .from('compliance_audits')
        .select('*')
        .gte('audit_date', startDate)
        .lte('audit_date', endDate);

      const { data: certifications } = await supabase
        .from('compliance_certifications')
        .select('*')
        .eq('status', 'active');

      const fctcReport = {
        reportType: 'FCTC',
        period: { startDate, endDate },
        generatedAt: new Date().toISOString(),
        farmersCompliance: {
          totalFarmers: farmersData?.length || 0,
          certifiedFarmers: farmersData?.filter(f => 
            f.farmer_certifications?.some((c: any) => c.status === 'active')
          ).length || 0,
          totalLandArea: farmersData?.reduce((sum, f) => sum + (Number(f.farm_size_acres) || 0), 0) || 0,
        },
        complianceAudits: {
          totalAudits: complianceData?.length || 0,
          averageScore: complianceData?.reduce((sum, a) => sum + (Number(a.score) || 0), 0) / (complianceData?.length || 1),
          auditsByType: complianceData?.reduce((acc: any, audit) => {
            acc[audit.audit_type] = (acc[audit.audit_type] || 0) + 1;
            return acc;
          }, {}),
        },
        activeCertifications: certifications?.length || 0,
        traceabilityMetrics: {
          batchesTracked: farmersData?.reduce((sum, f) => 
            sum + (f.procurement_batches?.length || 0), 0
          ) || 0,
          farmersWithQRCodes: farmersData?.filter(f => 
            f.procurement_batches?.some((b: any) => b.qr_code)
          ).length || 0,
        },
      };
      reportData.fctc = fctcReport;
    }

    // Generate ESG Report
    if (reportType === 'esg' || reportType === 'all') {
      const { data: esgScores } = await supabase
        .from('esg_scores')
        .select('*')
        .gte('assessment_date', startDate)
        .lte('assessment_date', endDate);

      const { data: iotData } = await supabase
        .from('warehouse_inventory')
        .select('*, warehouses(*)')
        .gte('entry_date', startDate)
        .lte('entry_date', endDate);

      const esgReport = {
        reportType: 'ESG',
        period: { startDate, endDate },
        generatedAt: new Date().toISOString(),
        overallScores: {
          environmental: esgScores?.reduce((sum, s) => sum + (Number(s.environmental_score) || 0), 0) / (esgScores?.length || 1),
          social: esgScores?.reduce((sum, s) => sum + (Number(s.social_score) || 0), 0) / (esgScores?.length || 1),
          governance: esgScores?.reduce((sum, s) => sum + (Number(s.governance_score) || 0), 0) / (esgScores?.length || 1),
          overall: esgScores?.reduce((sum, s) => sum + (Number(s.overall_score) || 0), 0) / (esgScores?.length || 1),
        },
        assessmentCount: esgScores?.length || 0,
        byEntityType: esgScores?.reduce((acc: any, score) => {
          if (!acc[score.entity_type]) {
            acc[score.entity_type] = { count: 0, avgScore: 0, totalScore: 0 };
          }
          acc[score.entity_type].count += 1;
          acc[score.entity_type].totalScore += Number(score.overall_score) || 0;
          acc[score.entity_type].avgScore = acc[score.entity_type].totalScore / acc[score.entity_type].count;
          return acc;
        }, {}),
        sustainabilityMetrics: {
          warehousesMonitored: iotData?.reduce((acc: any, inv) => {
            if (inv.warehouses?.id && !acc.includes(inv.warehouses.id)) {
              acc.push(inv.warehouses.id);
            }
            return acc;
          }, []).length || 0,
          totalInventoryManaged: iotData?.reduce((sum, i) => sum + (Number(i.quantity_kg) || 0), 0) || 0,
        },
      };
      reportData.esg = esgReport;
    }

    // Convert to requested format
    let responseBody: string;
    let contentType: string;

    if (format === 'csv') {
      // Simple CSV conversion for GST report
      if (reportData.gst) {
        const headers = ['Batch ID', 'Date', 'Farmer', 'Quantity (kg)', 'Price/kg', 'Total', 'GST'];
        const rows = reportData.gst.transactions.map((t: any) => 
          [t.batchId, t.date, t.farmerName, t.quantity, t.pricePerKg, t.totalAmount, t.gstAmount].join(',')
        );
        responseBody = [headers.join(','), ...rows].join('\n');
        contentType = 'text/csv';
      } else {
        responseBody = 'Report type not available in CSV format';
        contentType = 'text/plain';
      }
    } else if (format === 'xml') {
      // Simple XML conversion
      responseBody = `<?xml version="1.0" encoding="UTF-8"?>
<ComplianceReport>
  <Type>${reportType}</Type>
  <Period>
    <Start>${startDate}</Start>
    <End>${endDate}</End>
  </Period>
  <GeneratedAt>${new Date().toISOString()}</GeneratedAt>
  <Data>${JSON.stringify(reportData)}</Data>
</ComplianceReport>`;
      contentType = 'application/xml';
    } else {
      responseBody = JSON.stringify(reportData, null, 2);
      contentType = 'application/json';
    }

    // Log the report generation
    await supabase.from('audit_logs').insert({
      action: 'GENERATE_REPORT',
      resource: 'compliance_reports',
      resource_id: reportType,
      data_snapshot: { reportType, startDate, endDate, format },
      status: 'success',
    });

    console.log(`Report generated successfully: ${reportType}`);

    return new Response(responseBody, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="report-${reportType}-${Date.now()}.${format}"`,
      },
    });

  } catch (error: any) {
    console.error('Error generating report:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
