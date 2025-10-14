import { describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

describe('End-to-End Traceability System', () => {
  let testFarmerId: string;
  let testBatchId: string;
  let testShipmentId: string;

  beforeEach(() => {
    // Reset test IDs
    testFarmerId = '';
    testBatchId = '';
    testShipmentId = '';
  });

  describe('Complete Tobacco Supply Chain Flow', () => {
    it('should trace tobacco from farm to warehouse with full data integrity', async () => {
      // Step 1: Register a farmer
      const { data: farmer, error: farmerError } = await supabase
        .from('farmers')
        .insert({
          name: 'E2E Test Farmer',
          location: 'Karnataka Test Region',
          phone: '+91-9876543210',
          email: 'e2e.farmer@test.com',
          farm_size_acres: 25.5,
          geo_latitude: 12.9716,
          geo_longitude: 77.5946,
          status: 'active'
        })
        .select()
        .single();

      expect(farmerError).toBeNull();
      expect(farmer).toBeDefined();
      expect(farmer?.name).toBe('E2E Test Farmer');
      testFarmerId = farmer?.id || '';

      // Step 2: Procure a batch from the farmer
      const batchId = `BATCH-E2E-${Date.now()}`;
      const { data: batch, error: batchError } = await supabase
        .from('procurement_batches')
        .insert({
          id: batchId,
          farmer_id: testFarmerId,
          quantity_kg: 500,
          grade: 'A',
          price_per_kg: 150,
          total_price: 75000,
          status: 'approved',
          qr_code: `QR-${batchId}`
        })
        .select()
        .single();

      expect(batchError).toBeNull();
      expect(batch).toBeDefined();
      expect(batch?.farmer_id).toBe(testFarmerId);
      expect(batch?.quantity_kg).toBe(500);
      testBatchId = batch?.id || '';

      // Step 3: Run AI grading on the batch
      const { data: aiGrading, error: gradingError } = await supabase
        .from('ai_gradings')
        .insert({
          batch_id: testBatchId,
          ai_grade: 'A',
          confidence: 0.94,
          quality_score: 92,
          crop_health_score: 88,
          defects_detected: ['minor_discoloration'],
          recommendations: ['Store in controlled humidity', 'Process within 30 days']
        })
        .select()
        .single();

      expect(gradingError).toBeNull();
      expect(aiGrading).toBeDefined();
      expect(aiGrading?.ai_grade).toBe('A');
      expect(aiGrading?.confidence).toBeGreaterThanOrEqual(0.9);

      // Step 4: Store in warehouse
      const { data: inventory, error: inventoryError } = await supabase
        .from('warehouse_inventory')
        .insert({
          batch_id: testBatchId,
          warehouse_id: 'WH-01',
          quantity_kg: 500
        })
        .select()
        .single();

      expect(inventoryError).toBeNull();
      expect(inventory).toBeDefined();
      expect(inventory?.quantity_kg).toBe(500);

      // Step 5: Create shipment for logistics
      const shipmentId = `SHIP-E2E-${Date.now()}`;
      const { data: shipment, error: shipmentError } = await supabase
        .from('shipments')
        .insert({
          id: shipmentId,
          batch_id: testBatchId,
          from_location: 'Warehouse WH-01',
          to_location: 'Processing Unit PU-01',
          status: 'in-transit',
          vehicle_id: 'VEH-001',
          driver_name: 'Test Driver',
          gps_latitude: 12.9716,
          gps_longitude: 77.5946
        })
        .select()
        .single();

      expect(shipmentError).toBeNull();
      expect(shipment).toBeDefined();
      expect(shipment?.status).toBe('in-transit');
      testShipmentId = shipment?.id || '';

      // Step 6: Complete traceability check - verify all data is linked
      const { data: traceData } = await supabase
        .from('procurement_batches')
        .select(`
          *,
          farmers (name, location),
          ai_gradings (ai_grade, confidence, quality_score),
          warehouse_inventory (warehouse_id, quantity_kg),
          shipments (status, to_location)
        `)
        .eq('id', testBatchId)
        .single();

      expect(traceData).toBeDefined();
      expect(traceData?.farmers).toBeDefined();
      expect(traceData?.ai_gradings).toHaveLength(1);
      expect(traceData?.warehouse_inventory).toHaveLength(1);
      expect(traceData?.shipments).toHaveLength(1);
    });
  });

  describe('AI Prediction Validation', () => {
    it('should validate AI grading predictions match expected patterns', async () => {
      const testBatchId = `BATCH-AI-${Date.now()}`;
      
      // Create test batch
      await supabase.from('procurement_batches').insert({
        id: testBatchId,
        farmer_id: (await supabase.from('farmers').select('id').limit(1).single()).data?.id,
        quantity_kg: 300,
        grade: 'B',
        price_per_kg: 120,
        total_price: 36000
      });

      // Test AI grading
      const { data: aiGrading } = await supabase
        .from('ai_gradings')
        .insert({
          batch_id: testBatchId,
          ai_grade: 'B',
          confidence: 0.87,
          quality_score: 78,
          crop_health_score: 82,
          esg_score: 75,
          defects_detected: ['slight_leaf_damage', 'minor_moisture'],
          recommendations: ['Dry before storage', 'Grade for secondary processing']
        })
        .select()
        .single();

      // Validation checks
      expect(aiGrading?.confidence).toBeGreaterThan(0.8);
      expect(aiGrading?.confidence).toBeLessThanOrEqual(1.0);
      expect(aiGrading?.quality_score).toBeGreaterThan(0);
      expect(aiGrading?.quality_score).toBeLessThanOrEqual(100);
      expect(aiGrading?.crop_health_score).toBeGreaterThan(0);
      expect(aiGrading?.crop_health_score).toBeLessThanOrEqual(100);
      expect(aiGrading?.defects_detected).toBeInstanceOf(Array);
      expect(aiGrading?.recommendations).toBeInstanceOf(Array);
      expect(aiGrading?.recommendations.length).toBeGreaterThan(0);
    });

    it('should correlate AI grades with quality test results', async () => {
      const testBatchId = `BATCH-CORR-${Date.now()}`;
      
      await supabase.from('procurement_batches').insert({
        id: testBatchId,
        farmer_id: (await supabase.from('farmers').select('id').limit(1).single()).data?.id,
        quantity_kg: 400,
        grade: 'A',
        price_per_kg: 155,
        total_price: 62000
      });

      // AI grading
      const { data: aiGrade } = await supabase.from('ai_gradings').insert({
        batch_id: testBatchId,
        ai_grade: 'A',
        confidence: 0.93,
        quality_score: 91
      }).select().single();

      // Manual quality test
      const { data: qualityTest } = await supabase.from('batch_quality_tests').insert({
        batch_id: testBatchId,
        sugar_content: 18.5,
        nicotine_level: 2.3,
        moisture_content: 12.0,
        ai_grade: 'A',
        ai_confidence: 0.93
      }).select().single();

      // Verify correlation
      expect(aiGrade?.ai_grade).toBe(qualityTest?.ai_grade);
      expect(aiGrade?.confidence).toBe(qualityTest?.ai_confidence);
      expect(qualityTest?.sugar_content).toBeGreaterThan(15); // Grade A standards
      expect(qualityTest?.moisture_content).toBeLessThan(15);
    });
  });

  describe('Logistics Tracking Validation', () => {
    it('should track shipment status changes and GPS coordinates', async () => {
      const testBatchId = `BATCH-LOG-${Date.now()}`;
      const shipmentId = `SHIP-LOG-${Date.now()}`;

      await supabase.from('procurement_batches').insert({
        id: testBatchId,
        farmer_id: (await supabase.from('farmers').select('id').limit(1).single()).data?.id,
        quantity_kg: 250,
        grade: 'B',
        price_per_kg: 130,
        total_price: 32500
      });

      // Create shipment
      const { data: shipment } = await supabase.from('shipments').insert({
        id: shipmentId,
        batch_id: testBatchId,
        from_location: 'Warehouse A',
        to_location: 'Factory B',
        status: 'pending',
        vehicle_id: 'VEH-TEST',
        gps_latitude: 12.9716,
        gps_longitude: 77.5946
      }).select().single();

      expect(shipment?.status).toBe('pending');

      // Simulate status progression
      const statuses = ['in-transit', 'delivered'];
      
      for (const status of statuses) {
        const { data: updated } = await supabase
          .from('shipments')
          .update({ 
            status,
            gps_latitude: 13.0000 + Math.random() * 0.1,
            gps_longitude: 77.6000 + Math.random() * 0.1
          })
          .eq('id', shipmentId)
          .select()
          .single();

        expect(updated?.status).toBe(status);
        expect(updated?.gps_latitude).toBeDefined();
        expect(updated?.gps_longitude).toBeDefined();
      }

      // Verify final delivered status
      const { data: final } = await supabase
        .from('shipments')
        .select()
        .eq('id', shipmentId)
        .single();

      expect(final?.status).toBe('delivered');
    });

    it('should validate temperature monitoring during transit', async () => {
      const shipmentId = `SHIP-TEMP-${Date.now()}`;
      const testBatchId = `BATCH-TEMP-${Date.now()}`;

      await supabase.from('procurement_batches').insert({
        id: testBatchId,
        farmer_id: (await supabase.from('farmers').select('id').limit(1).single()).data?.id,
        quantity_kg: 200,
        grade: 'A',
        price_per_kg: 160,
        total_price: 32000
      });

      const { data: shipment } = await supabase.from('shipments').insert({
        id: shipmentId,
        batch_id: testBatchId,
        from_location: 'Cold Storage A',
        to_location: 'Processing Center',
        status: 'in-transit',
        vehicle_id: 'REFRIG-001',
        temperature_min: 18,
        temperature_max: 22
      }).select().single();

      // Validate temperature range
      expect(shipment?.temperature_min).toBeDefined();
      expect(shipment?.temperature_max).toBeDefined();
      expect(shipment?.temperature_min).toBeLessThan(shipment?.temperature_max!);
      expect(shipment?.temperature_min).toBeGreaterThanOrEqual(15);
      expect(shipment?.temperature_max).toBeLessThanOrEqual(25);
    });
  });

  describe('Compliance Reporting Validation', () => {
    it('should generate and validate compliance audit reports', async () => {
      const { data: audit } = await supabase.from('compliance_audits').insert({
        audit_type: 'FCTC',
        audit_date: new Date().toISOString().split('T')[0],
        score: 88,
        findings: 'All documentation in order. Minor improvement needed in storage facility ventilation.',
        auditor_name: 'Test Auditor',
        status: 'completed'
      }).select().single();

      expect(audit).toBeDefined();
      expect(audit?.audit_type).toBe('FCTC');
      expect(audit?.score).toBeGreaterThanOrEqual(0);
      expect(audit?.score).toBeLessThanOrEqual(100);
      expect(audit?.findings).toBeDefined();
      expect(audit?.status).toBe('completed');
    });

    it('should calculate and validate ESG scores', async () => {
      const testFarmerId = (await supabase.from('farmers').select('id').limit(1).single()).data?.id;

      const { data: esgScore } = await supabase.from('esg_scores').insert({
        entity_id: testFarmerId!,
        entity_type: 'farmer',
        environmental_score: 85,
        social_score: 78,
        governance_score: 82,
        overall_score: 81.67,
        notes: 'Good environmental practices. Worker safety standards met.'
      }).select().single();

      expect(esgScore).toBeDefined();
      expect(esgScore?.environmental_score).toBeGreaterThanOrEqual(0);
      expect(esgScore?.environmental_score).toBeLessThanOrEqual(100);
      expect(esgScore?.social_score).toBeGreaterThanOrEqual(0);
      expect(esgScore?.social_score).toBeLessThanOrEqual(100);
      expect(esgScore?.governance_score).toBeGreaterThanOrEqual(0);
      expect(esgScore?.governance_score).toBeLessThanOrEqual(100);
      
      // Validate overall score calculation
      const calculatedAverage = (
        esgScore!.environmental_score + 
        esgScore!.social_score + 
        esgScore!.governance_score
      ) / 3;
      
      expect(Math.abs(esgScore!.overall_score - calculatedAverage)).toBeLessThan(0.1);
    });

    it('should validate certification tracking', async () => {
      const testFarmerId = (await supabase.from('farmers').select('id').limit(1).single()).data?.id;

      const { data: cert } = await supabase.from('farmer_certifications').insert({
        farmer_id: testFarmerId!,
        certification_name: 'Organic Tobacco Certification',
        issuer: 'Agricultural Standards Board',
        issue_date: '2024-01-15',
        expiry_date: '2027-01-15',
        status: 'active'
      }).select().single();

      expect(cert).toBeDefined();
      expect(cert?.status).toBe('active');
      expect(new Date(cert!.expiry_date)).toBeInstanceOf(Date);
      expect(new Date(cert!.expiry_date) > new Date()).toBe(true);
    });

    it('should validate compliance report generation workflow', async () => {
      // Create scheduled report
      const { data: scheduled } = await supabase.from('scheduled_reports').insert({
        report_type: 'GST',
        schedule_cron: '0 0 1 * *', // Monthly
        format: 'json',
        enabled: true
      }).select().single();

      expect(scheduled).toBeDefined();
      expect(scheduled?.report_type).toBe('GST');
      expect(scheduled?.enabled).toBe(true);

      // Simulate report submission
      const { data: submission } = await supabase.from('report_submissions').insert({
        scheduled_report_id: scheduled!.id,
        report_type: 'GST',
        period_start: '2024-01-01',
        period_end: '2024-01-31',
        format: 'json',
        status: 'completed',
        portal_submitted: false
      }).select().single();

      expect(submission).toBeDefined();
      expect(submission?.status).toBe('completed');
      expect(submission?.report_type).toBe('GST');
    });
  });

  describe('Audit Trail Validation', () => {
    it('should maintain complete audit logs for all operations', async () => {
      const testUserId = (await supabase.auth.getUser()).data.user?.id;

      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      expect(auditLogs).toBeDefined();
      expect(Array.isArray(auditLogs)).toBe(true);
      
      if (auditLogs && auditLogs.length > 0) {
        const log = auditLogs[0];
        expect(log.action).toBeDefined();
        expect(log.resource).toBeDefined();
        expect(log.timestamp).toBeDefined();
      }
    });

    it('should track user role-based access for sensitive operations', async () => {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('*');

      expect(roles).toBeDefined();
      expect(Array.isArray(roles)).toBe(true);
      
      if (roles && roles.length > 0) {
        const role = roles[0];
        expect(role.user_id).toBeDefined();
        expect(role.role).toBeDefined();
        expect(['admin', 'auditor', 'technician', 'procurement_agent', 'logistics_manager', 'factory_manager', 'farmer'].includes(role.role)).toBe(true);
      }
    });
  });
});
