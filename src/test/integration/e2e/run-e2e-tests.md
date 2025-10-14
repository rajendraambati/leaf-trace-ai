# End-to-End Traceability Testing Guide

## Overview
This guide explains how to run comprehensive end-to-end tests for the tobacco supply chain traceability system.

## Prerequisites
1. Authenticated user session (login to the app first)
2. Appropriate user roles configured in the database
3. Backend (Supabase) connection active

## Running Tests

### 1. Seed Test Data
First, populate the database with test data:

```bash
npm run test:seed
```

This will create:
- 3 test farmers with realistic profiles
- 3 procurement batches with varying grades
- AI grading results for each batch
- Warehouse inventory entries
- Shipment records with GPS tracking
- Compliance audit records
- ESG scores for farmers
- Active certifications

### 2. Run E2E Tests
Execute the full test suite:

```bash
npm run test:e2e
```

Or run with UI:

```bash
npm run test:ui
```

Then navigate to the E2E tests in the Vitest UI.

### 3. Run Specific Test Suites

**Complete Supply Chain Flow:**
```bash
npm test -- src/test/integration/e2e/traceability.test.ts -t "Complete Tobacco Supply Chain Flow"
```

**AI Predictions Validation:**
```bash
npm test -- src/test/integration/e2e/traceability.test.ts -t "AI Prediction Validation"
```

**Logistics Tracking:**
```bash
npm test -- src/test/integration/e2e/traceability.test.ts -t "Logistics Tracking Validation"
```

**Compliance Reporting:**
```bash
npm test -- src/test/integration/e2e/traceability.test.ts -t "Compliance Reporting Validation"
```

## Test Coverage

### 1. End-to-End Traceability
- ✅ Farmer registration
- ✅ Batch procurement
- ✅ AI grading analysis
- ✅ Warehouse storage
- ✅ Logistics tracking
- ✅ Full data linkage validation

### 2. AI Prediction Validation
- ✅ Confidence score validation (0.8 - 1.0)
- ✅ Quality score ranges (0-100)
- ✅ Defect detection
- ✅ Recommendation generation
- ✅ Correlation with manual tests

### 3. Logistics Tracking
- ✅ Status progression (pending → in-transit → delivered)
- ✅ GPS coordinate tracking
- ✅ Temperature monitoring (15-25°C)
- ✅ Real-time updates

### 4. Compliance Reporting
- ✅ Audit report generation (FCTC, GST)
- ✅ ESG score calculation and validation
- ✅ Certification tracking
- ✅ Scheduled report workflow

### 5. Audit Trail
- ✅ Complete operation logging
- ✅ Role-based access tracking
- ✅ Timestamp verification

## Expected Results

All tests should pass with green checkmarks:

```
✓ End-to-End Traceability System
  ✓ Complete Tobacco Supply Chain Flow
  ✓ AI Prediction Validation
    ✓ validate AI grading predictions match expected patterns
    ✓ correlate AI grades with quality test results
  ✓ Logistics Tracking Validation
    ✓ track shipment status changes and GPS coordinates
    ✓ validate temperature monitoring during transit
  ✓ Compliance Reporting Validation
    ✓ generate and validate compliance audit reports
    ✓ calculate and validate ESG scores
    ✓ validate certification tracking
    ✓ validate compliance report generation workflow
  ✓ Audit Trail Validation
    ✓ maintain complete audit logs for all operations
    ✓ track user role-based access for sensitive operations
```

## Troubleshooting

### Authentication Issues
If tests fail with auth errors:
1. Login to the application first
2. Ensure your user has the required roles
3. Check RLS policies are correctly configured

### Data Integrity Failures
If validation tests fail:
1. Check database constraints
2. Verify RLS policies allow test operations
3. Review audit logs for detailed error messages

### Network Issues
If API calls timeout:
1. Check Supabase connection
2. Verify edge functions are deployed
3. Check network connectivity

## Manual Verification

After running tests, verify in the application:

1. **Dashboard**: Check if test batches appear
2. **Farmers Page**: Verify test farmers are listed
3. **Procurement**: Confirm batches are linked to farmers
4. **Logistics**: Check shipment tracking data
5. **Compliance**: Review generated audit reports

## Cleanup

To remove test data after testing:

```sql
-- Run in Supabase SQL Editor
DELETE FROM shipments WHERE id LIKE 'SHIP-TEST-%' OR id LIKE 'SHIP-E2E-%';
DELETE FROM warehouse_inventory WHERE batch_id LIKE 'BATCH-TEST-%' OR batch_id LIKE 'BATCH-E2E-%';
DELETE FROM ai_gradings WHERE batch_id LIKE 'BATCH-TEST-%' OR batch_id LIKE 'BATCH-E2E-%';
DELETE FROM procurement_batches WHERE id LIKE 'BATCH-TEST-%' OR id LIKE 'BATCH-E2E-%';
DELETE FROM farmer_certifications WHERE farmer_id IN (
  SELECT id FROM farmers WHERE email LIKE '%@test.com'
);
DELETE FROM esg_scores WHERE entity_id IN (
  SELECT id FROM farmers WHERE email LIKE '%@test.com'
);
DELETE FROM farmers WHERE email LIKE '%@test.com';
```

## Continuous Integration

Add to your CI/CD pipeline:

```yaml
- name: Run E2E Tests
  run: |
    npm run test:seed
    npm run test:e2e
```

## Notes

- Tests use real database operations (not mocked)
- Each test creates and validates actual data
- Tests are designed to be idempotent
- Cleanup may be needed between test runs
