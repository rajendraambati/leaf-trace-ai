# Tobacco Serialization & Traceability System

## Overview

The serialization system provides comprehensive unit-level tracking for tobacco products from manufacturing through distribution, with full EU TPD and GCC traceability compliance.

## Features

### 1. Multi-Level Serialization
- **Pack Level**: Individual consumer packages
- **Carton Level**: Aggregated packs
- **Pallet Level**: Bulk shipments

### 2. Aggregation Management
- **Hierarchical Relationships**: Track pack → carton → pallet chains
- **Flexible De-aggregation**: Support for returns and rework
- **Parent-Child Tracking**: Complete aggregation audit trail

### 3. Movement Tracking
- **Automatic Logging**: All location changes recorded
- **Real-time Updates**: GPS coordinates and timestamps
- **Status Changes**: Track through lifecycle (active, shipped, delivered, etc.)

### 4. Compliance Integration

#### EU TPD (Tobacco Products Directive)
- Unique identifier assignment
- Track-and-trace data synchronization
- Manufacturing and movement history
- Aggregation/disaggregation events

#### GCC Traceability
- Gulf region compliance
- Customs integration ready
- Multi-jurisdiction support
- Real-time sync capabilities

### 5. Rework & Quality Management
- **Rework Actions**: Repackaging, relabeling, quality corrections
- **Approval Workflows**: Multi-level authorization
- **Before/After Tracking**: Complete state preservation
- **Audit Compliance**: Full rework history

## Database Schema

### serialized_units
Primary table for all serialized items:
- `serial_number`: Unique identifier (format: TYPE-BATCH-TIMESTAMP-SEQUENCE)
- `unit_type`: pack, carton, or pallet
- `batch_id`: Link to procurement batch
- `parent_serial`: For aggregated units
- `status`: active, aggregated, shipped, sold, destroyed, reworked
- `eu_tpd_id`: EU compliance identifier
- `gcc_traceability_id`: GCC compliance identifier
- Location tracking (current_location, current_warehouse_id, current_shipment_id)

### serial_movements
Complete movement history:
- All status and location changes
- GPS coordinates
- User attribution
- Metadata for context

### aggregation_relationships
Parent-child tracking:
- Aggregation date and user
- Disaggregation date and user
- Status (active/disaggregated)

### compliance_sync_logs
Audit trail for regulatory syncs:
- Sync type (EU TPD or GCC)
- Request/response payloads
- Status tracking
- Error logging

### rework_actions
Quality and rework management:
- Rework type and reason
- Before/after state capture
- Approval chain
- Metadata preservation

## API Endpoints

### Serialization Management
`POST /functions/v1/serialization-management?action=generate`
```json
{
  "batchId": "BATCH-001",
  "unitType": "pack",
  "count": 1000,
  "productCode": "TOB-GRADE-A-2024"
}
```

`POST /functions/v1/serialization-management?action=aggregate`
```json
{
  "parentSerial": "CARTON-001-...",
  "childSerials": ["PACK-001-...", "PACK-002-..."],
  "aggregatedBy": "user-uuid"
}
```

`POST /functions/v1/serialization-management?action=disaggregate`
```json
{
  "parentSerial": "CARTON-001-...",
  "disaggregatedBy": "user-uuid"
}
```

`POST /functions/v1/serialization-management?action=move`
```json
{
  "serialNumbers": ["PACK-001-...", "PACK-002-..."],
  "toLocation": "Warehouse A",
  "toLocationType": "warehouse",
  "shipmentId": "SHP-001",
  "userId": "user-uuid"
}
```

`POST /functions/v1/serialization-management?action=rework`
```json
{
  "serialNumber": "PACK-001-...",
  "reworkType": "repackaging",
  "reason": "Damaged label",
  "performedBy": "user-uuid",
  "notes": "Re-labeled and verified"
}
```

`GET /functions/v1/serialization-management?action=history&serial=PACK-001-...`
Returns complete history including:
- Unit details
- All movements
- Aggregation relationships
- Rework actions

### Compliance Sync
`POST /functions/v1/compliance-sync`
```json
{
  "syncType": "eu_tpd",  // or "gcc_traceability"
  "serialNumbers": ["PACK-001-...", "PACK-002-..."],
  "initiatedBy": "user-uuid"
}
```

## Integration Points

### Procurement
- Batches can enable serialization
- Track total units serialized
- Link serials to batch origin

### Warehousing
- Inventory tracking by serial number
- Entry/exit recording
- Stock verification

### Logistics
- Shipments include serial number arrays
- Verification at delivery
- Real-time location updates

### Processing
- Track transformation (if applicable)
- Quality checks by serial
- Output tracking

## QR Code Support

Each serialized unit has QR code containing:
- Serial number
- Product code
- Batch reference
- Verification URL

## Usage Example

### 1. Generate Serial Numbers
```typescript
const { data } = await supabase.functions.invoke('serialization-management', {
  body: {
    batchId: 'BATCH-2024-001',
    unitType: 'pack',
    count: 5000,
    productCode: 'TOB-PREMIUM-A'
  }
});
```

### 2. Aggregate Packs into Carton
```typescript
// First create parent carton serial
const cartonSerial = 'CARTON-2024-001-000001';

// Then aggregate child packs
await supabase.functions.invoke('serialization-management?action=aggregate', {
  body: {
    parentSerial: cartonSerial,
    childSerials: ['PACK-001', 'PACK-002', ...], // 20 packs
    aggregatedBy: userId
  }
});
```

### 3. Ship and Track
```typescript
// Move to shipment
await supabase.functions.invoke('serialization-management?action=move', {
  body: {
    serialNumbers: [cartonSerial],
    toLocation: 'In Transit to Customer',
    toLocationType: 'transit',
    shipmentId: 'SHP-2024-001',
    userId: driverId
  }
});
```

### 4. Sync with Regulators
```typescript
// Sync to EU TPD
await supabase.functions.invoke('compliance-sync', {
  body: {
    syncType: 'eu_tpd',
    serialNumbers: allShippedSerials,
    initiatedBy: userId
  }
});

// Sync to GCC
await supabase.functions.invoke('compliance-sync', {
  body: {
    syncType: 'gcc_traceability',
    serialNumbers: allShippedSerials,
    initiatedBy: userId
  }
});
```

## Security & Access Control

### RLS Policies
- **View**: Everyone can view serialized units and movements
- **Create**: Technicians, procurement agents, logistics managers
- **Update**: Technicians, logistics managers, admins
- **Compliance**: Auditors and admins only

### Audit Trails
- All operations logged with user attribution
- Timestamp and location tracking
- Complete state preservation
- Tamper-evident design

## Best Practices

1. **Generate serials early**: Ideally at manufacturing/packaging
2. **Aggregate progressively**: Pack → Carton → Pallet as needed
3. **Sync regularly**: Daily compliance syncs recommended
4. **Verify at checkpoints**: Scan and verify at each transfer
5. **Handle exceptions**: Document all rework and returns
6. **Archive properly**: Maintain records per regulatory requirements

## Compliance Requirements

### EU TPD
- Unique identifiers per unit
- Manufacturing facility recording
- Complete movement history
- 5-year data retention

### GCC Traceability
- Cross-border movement tracking
- Customs documentation
- Real-time reporting capability
- Multi-language support

## Future Enhancements

- [ ] Blockchain integration for immutability
- [ ] Mobile scanning apps
- [ ] Automated compliance reporting
- [ ] Predictive analytics for supply chain
- [ ] Integration with tax stamp systems
- [ ] Consumer verification portal