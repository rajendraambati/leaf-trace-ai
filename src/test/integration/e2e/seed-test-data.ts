import { supabase } from '@/integrations/supabase/client';

/**
 * Seed test data for E2E testing
 * Creates a complete set of test users and sample data
 */
export async function seedTestData() {
  console.log('Starting test data seeding...');

  try {
    // 1. Create test farmers
    const farmers = [
      {
        name: 'Rajesh Kumar',
        location: 'Karnataka, India',
        phone: '+91-9876543210',
        email: 'rajesh.kumar@test.com',
        farm_size_acres: 15.5,
        geo_latitude: 12.9716,
        geo_longitude: 77.5946,
        status: 'active'
      },
      {
        name: 'Priya Sharma',
        location: 'Andhra Pradesh, India',
        phone: '+91-9876543211',
        email: 'priya.sharma@test.com',
        farm_size_acres: 22.3,
        geo_latitude: 15.9129,
        geo_longitude: 79.7400,
        status: 'active'
      },
      {
        name: 'Amit Patel',
        location: 'Gujarat, India',
        phone: '+91-9876543212',
        email: 'amit.patel@test.com',
        farm_size_acres: 18.7,
        geo_latitude: 23.0225,
        geo_longitude: 72.5714,
        status: 'active'
      }
    ];

    const { data: insertedFarmers, error: farmerError } = await supabase
      .from('farmers')
      .insert(farmers)
      .select();

    if (farmerError) {
      console.error('Error seeding farmers:', farmerError);
      return;
    }

    console.log(`✓ Created ${insertedFarmers?.length} test farmers`);

    // 2. Create procurement batches
    const batches = insertedFarmers?.map((farmer, index) => ({
      id: `BATCH-TEST-${Date.now()}-${index}`,
      farmer_id: farmer.id,
      quantity_kg: 300 + (index * 100),
      grade: ['A', 'B', 'A'][index],
      price_per_kg: [150, 130, 155][index],
      total_price: (300 + (index * 100)) * [150, 130, 155][index],
      status: 'approved',
      qr_code: `QR-TEST-${Date.now()}-${index}`
    }));

    const { data: insertedBatches, error: batchError } = await supabase
      .from('procurement_batches')
      .insert(batches!)
      .select();

    if (batchError) {
      console.error('Error seeding batches:', batchError);
      return;
    }

    console.log(`✓ Created ${insertedBatches?.length} procurement batches`);

    // 3. Create AI gradings
    const aiGradings = insertedBatches?.map((batch, index) => ({
      batch_id: batch.id,
      ai_grade: ['A', 'B', 'A'][index],
      confidence: [0.94, 0.87, 0.91][index],
      quality_score: [92, 78, 88][index],
      crop_health_score: [88, 82, 85][index],
      esg_score: [85, 75, 82][index],
      defects_detected: [
        ['minor_discoloration'],
        ['slight_leaf_damage', 'minor_moisture'],
        ['minor_discoloration']
      ][index],
      recommendations: [
        ['Store in controlled humidity', 'Process within 30 days'],
        ['Dry before storage', 'Grade for secondary processing'],
        ['Maintain optimal storage conditions']
      ][index]
    }));

    const { data: insertedGradings, error: gradingError } = await supabase
      .from('ai_gradings')
      .insert(aiGradings!)
      .select();

    if (gradingError) {
      console.error('Error seeding AI gradings:', gradingError);
      return;
    }

    console.log(`✓ Created ${insertedGradings?.length} AI gradings`);

    // 4. Create warehouse inventory
    const inventory = insertedBatches?.map(batch => ({
      batch_id: batch.id,
      warehouse_id: 'WH-01',
      quantity_kg: batch.quantity_kg
    }));

    const { data: insertedInventory, error: inventoryError } = await supabase
      .from('warehouse_inventory')
      .insert(inventory!)
      .select();

    if (inventoryError) {
      console.error('Error seeding inventory:', inventoryError);
      return;
    }

    console.log(`✓ Created ${insertedInventory?.length} warehouse entries`);

    // 5. Create shipments
    const shipments = insertedBatches?.map((batch, index) => ({
      id: `SHIP-TEST-${Date.now()}-${index}`,
      batch_id: batch.id,
      from_location: 'Warehouse WH-01',
      to_location: 'Processing Unit PU-01',
      status: ['in-transit', 'delivered', 'pending'][index],
      vehicle_id: `VEH-00${index + 1}`,
      driver_name: ['Driver A', 'Driver B', 'Driver C'][index],
      gps_latitude: [12.9716, 15.9129, 23.0225][index],
      gps_longitude: [77.5946, 79.7400, 72.5714][index],
      temperature_min: 18,
      temperature_max: 22
    }));

    const { data: insertedShipments, error: shipmentError } = await supabase
      .from('shipments')
      .insert(shipments!)
      .select();

    if (shipmentError) {
      console.error('Error seeding shipments:', shipmentError);
      return;
    }

    console.log(`✓ Created ${insertedShipments?.length} shipments`);

    // 6. Create compliance audits
    const audits = [
      {
        audit_type: 'FCTC',
        audit_date: new Date().toISOString().split('T')[0],
        score: 88,
        findings: 'All documentation in order. Minor improvement needed in storage facility ventilation.',
        auditor_name: 'Senior Auditor A',
        status: 'completed'
      },
      {
        audit_type: 'GST',
        audit_date: new Date().toISOString().split('T')[0],
        score: 92,
        findings: 'Tax compliance verified. All records maintained properly.',
        auditor_name: 'Tax Auditor B',
        status: 'completed'
      }
    ];

    const { data: insertedAudits, error: auditError } = await supabase
      .from('compliance_audits')
      .insert(audits)
      .select();

    if (auditError) {
      console.error('Error seeding audits:', auditError);
      return;
    }

    console.log(`✓ Created ${insertedAudits?.length} compliance audits`);

    // 7. Create ESG scores for farmers
    const esgScores = insertedFarmers?.map(farmer => ({
      entity_id: farmer.id,
      entity_type: 'farmer',
      environmental_score: 80 + Math.floor(Math.random() * 15),
      social_score: 75 + Math.floor(Math.random() * 15),
      governance_score: 78 + Math.floor(Math.random() * 15),
      overall_score: 0, // Will be calculated
      notes: 'Regular ESG assessment completed. Good compliance with standards.'
    }));

    // Calculate overall scores
    esgScores?.forEach(score => {
      score.overall_score = Number(
        ((score.environmental_score + score.social_score + score.governance_score) / 3).toFixed(2)
      );
    });

    const { data: insertedESG, error: esgError } = await supabase
      .from('esg_scores')
      .insert(esgScores!)
      .select();

    if (esgError) {
      console.error('Error seeding ESG scores:', esgError);
      return;
    }

    console.log(`✓ Created ${insertedESG?.length} ESG scores`);

    // 8. Create farmer certifications
    const certifications = insertedFarmers?.map(farmer => ({
      farmer_id: farmer.id,
      certification_name: 'Organic Tobacco Certification',
      issuer: 'Agricultural Standards Board',
      issue_date: '2024-01-15',
      expiry_date: '2027-01-15',
      status: 'active'
    }));

    const { data: insertedCerts, error: certError } = await supabase
      .from('farmer_certifications')
      .insert(certifications!)
      .select();

    if (certError) {
      console.error('Error seeding certifications:', certError);
      return;
    }

    console.log(`✓ Created ${insertedCerts?.length} certifications`);

    console.log('\n✅ Test data seeding completed successfully!');
    console.log('\nSummary:');
    console.log(`- Farmers: ${insertedFarmers?.length}`);
    console.log(`- Batches: ${insertedBatches?.length}`);
    console.log(`- AI Gradings: ${insertedGradings?.length}`);
    console.log(`- Warehouse Entries: ${insertedInventory?.length}`);
    console.log(`- Shipments: ${insertedShipments?.length}`);
    console.log(`- Audits: ${insertedAudits?.length}`);
    console.log(`- ESG Scores: ${insertedESG?.length}`);
    console.log(`- Certifications: ${insertedCerts?.length}`);

    return {
      farmers: insertedFarmers,
      batches: insertedBatches,
      shipments: insertedShipments
    };
  } catch (error) {
    console.error('Fatal error during seeding:', error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTestData();
}
