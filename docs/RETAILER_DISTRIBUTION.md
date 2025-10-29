# Retailer Distribution & Sales Management System

## Overview

This document describes the retailer onboarding, sales representative tracking, promotional campaign management, and wholesaler ERP synchronization modules for comprehensive supply chain visibility from manufacturer to retail point-of-sale.

## Architecture

### Database Schema

#### Sales Representatives
Tracks sales team members and their performance metrics.

```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to auth.users) - Links to user account
- employee_id (TEXT, Unique) - Employee identification number
- full_name (TEXT) - Representative's full name
- email (TEXT) - Contact email
- phone (TEXT) - Contact phone
- territory (TEXT) - Assigned sales territory
- region (TEXT) - Geographic region
- performance_metrics (JSONB) - Sales performance data
- is_active (BOOLEAN) - Active status
- hired_date (DATE) - Employment start date
```

#### Retailers
Manages retail partner information and onboarding status.

```sql
- id (UUID, Primary Key)
- retailer_code (TEXT, Unique) - Unique retailer identifier
- business_name (TEXT) - Legal business name
- contact_person (TEXT) - Primary contact
- email (TEXT) - Contact email
- phone (TEXT) - Contact phone
- address, city, state, postal_code (TEXT) - Physical location
- country_id (UUID, Foreign Key) - Operating country
- license_number (TEXT) - Business license
- tax_id (TEXT) - Tax identification
- business_type (TEXT) - Type of retail operation
- onboarding_status (TEXT) - pending/approved/active/rejected
- approved_by (UUID) - Admin who approved
- approved_at (TIMESTAMPTZ) - Approval timestamp
- credit_limit (NUMERIC) - Credit limit amount
- payment_terms (TEXT) - Payment terms (Net 30, etc.)
- assigned_sales_rep_id (UUID, Foreign Key) - Assigned representative
```

#### Retailer Orders
Tracks orders from retailers to wholesalers/manufacturers.

```sql
- id (UUID, Primary Key)
- order_number (TEXT, Unique) - Order reference number
- retailer_id (UUID, Foreign Key) - Ordering retailer
- sales_rep_id (UUID, Foreign Key) - Sales representative
- order_date (DATE) - Order placement date
- delivery_date (DATE) - Expected/actual delivery
- total_quantity_kg (NUMERIC) - Total weight ordered
- total_amount (NUMERIC) - Total order value
- currency (TEXT) - Currency code
- order_items (JSONB) - Line items array
- order_status (TEXT) - pending/confirmed/shipped/delivered
- payment_status (TEXT) - pending/paid/overdue
- erp_order_id (TEXT) - ERP system reference
- erp_synced_at (TIMESTAMPTZ) - Last sync timestamp
```

#### Promotional Campaigns
Manages marketing campaigns and promotions for retailers.

```sql
- id (UUID, Primary Key)
- campaign_code (TEXT, Unique) - Campaign identifier
- campaign_name (TEXT) - Display name
- campaign_type (TEXT) - discount/volume_incentive/seasonal/loyalty
- description (TEXT) - Campaign details
- start_date (DATE) - Campaign start
- end_date (DATE) - Campaign end
- status (TEXT) - draft/active/completed/cancelled
- target_audience (TEXT) - Target retailer segment
- discount_percentage (NUMERIC) - Discount rate
- discount_amount (NUMERIC) - Fixed discount amount
- budget (NUMERIC) - Total campaign budget
- spent_amount (NUMERIC) - Amount spent
- performance_data (JSONB) - Campaign metrics
- terms_conditions (TEXT) - Campaign terms
```

#### Campaign Participants
Links retailers to promotional campaigns.

```sql
- id (UUID, Primary Key)
- campaign_id (UUID, Foreign Key) - Associated campaign
- retailer_id (UUID, Foreign Key) - Participating retailer
- enrollment_date (TIMESTAMPTZ) - Join date
- orders_count (INTEGER) - Orders during campaign
- total_purchases (NUMERIC) - Total purchase value
- total_discount_applied (NUMERIC) - Discounts received
- status (TEXT) - active/completed/suspended
```

#### Wholesaler ERP Sync Logs
Tracks synchronization with external wholesaler ERP systems.

```sql
- id (UUID, Primary Key)
- sync_type (TEXT) - pull/push/bidirectional
- entity_type (TEXT) - retailers/orders/campaigns/all
- entity_ids (TEXT[]) - Specific entity IDs synced
- direction (TEXT) - Sync direction
- status (TEXT) - pending/in_progress/completed/failed
- request_payload (JSONB) - Sync request data
- response_payload (JSONB) - Sync response data
- error_message (TEXT) - Error details if failed
- records_processed (INTEGER) - Successfully synced records
- records_failed (INTEGER) - Failed records
- sync_started_at (TIMESTAMPTZ) - Sync start time
- sync_completed_at (TIMESTAMPTZ) - Sync completion time
- initiated_by (UUID) - User who started sync
```

## API Endpoints

### Wholesaler ERP Sync
**POST** `/functions/v1/wholesaler-erp-sync`

Synchronizes data between the platform and wholesaler ERP systems.

**Request Body:**
```json
{
  "sync_type": "pull|push|bidirectional",
  "entity_type": "retailers|orders|campaigns|all",
  "entity_ids": ["id1", "id2"],  // Optional: specific entities
  "erp_endpoint": "https://erp-api.example.com"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "sync_id": "uuid",
  "records_processed": 150,
  "records_failed": 2,
  "synced_data": {
    "retailers": 50,
    "orders": 100,
    "campaigns": 0
  }
}
```

**Sync Types:**
- **pull**: Import data from ERP to platform
- **push**: Export data from platform to ERP
- **bidirectional**: Two-way synchronization

**Entity Types:**
- **retailers**: Retail partner information
- **orders**: Order data
- **campaigns**: Marketing campaigns
- **all**: All entity types

## User Interfaces

### 1. Retailer Onboarding (`/retailer-onboarding`)
**Purpose:** Register new retail partners and manage onboarding process.

**Features:**
- Complete retailer registration form
- Business license and tax ID collection
- Credit limit and payment terms setup
- Sales representative assignment
- Approval workflow
- Onboarding status tracking

**User Roles:**
- Sales representatives can register retailers
- Admins can approve/reject registrations
- View retailer details and status

### 2. Sales Rep Tracking (`/sales-rep-tracking`)
**Purpose:** Monitor sales team performance and retail relationships.

**Features:**
- Active sales representatives list
- Performance metrics dashboard
- Territory and region assignments
- Retailer assignments per rep
- Order and revenue tracking
- Performance analytics

**Statistics Displayed:**
- Active sales reps count
- Total retailers managed
- Total orders placed
- Total revenue generated

### 3. Promotional Campaigns (`/promotional-campaigns`)
**Purpose:** Create and manage marketing campaigns for retailers.

**Features:**
- Campaign creation form
- Campaign type selection (discount, volume, seasonal, loyalty)
- Target audience configuration
- Budget and discount management
- Date range setting
- Campaign status tracking
- Performance monitoring

**Campaign Types:**
- **Discount**: Percentage or fixed amount discounts
- **Volume Incentive**: Bulk purchase rewards
- **Seasonal**: Holiday and seasonal promotions
- **Loyalty**: Repeat customer programs

### 4. Wholesaler Sync (`/wholesaler-sync`)
**Purpose:** Synchronize data with external wholesaler ERP systems.

**Features:**
- Sync configuration
- Direction selection (pull/push/bidirectional)
- Entity type selection
- Manual sync trigger
- Sync history and logs
- Error reporting
- Success/failure statistics

**Sync Statistics:**
- Total sync operations
- Completed syncs
- Failed syncs
- In-progress syncs

## Security & Permissions

### Row-Level Security (RLS) Policies

#### Sales Representatives
- Admins and system admins: Full access
- Sales reps: View own profile only

#### Retailers
- View: Admins, system admins, logistics managers, assigned sales reps
- Create: Admins, system admins, active sales reps
- Update: Admins, system admins only

#### Retailer Orders
- View: Admins, system admins, logistics managers, assigned sales reps
- Create: Admins, system admins, active sales reps
- Update: Admins, system admins only

#### Promotional Campaigns
- View: Active campaigns visible to all; admins see all
- Manage: Admins and system admins only

#### Campaign Participants
- View: Admins, system admins, sales reps for their retailers
- Manage: Admins and system admins only

#### Wholesaler ERP Sync Logs
- View: Admins and system admins only
- Create: System (automatic)
- Update: Admins and system admins only

## Integration Workflow

### 1. Retailer Onboarding Flow
```
1. Sales rep registers new retailer
2. Retailer information stored with "pending" status
3. Admin reviews application
4. Admin approves/rejects retailer
5. If approved, retailer status → "active"
6. Sales rep assigned to retailer
7. Credit limit and payment terms established
8. Retailer can begin placing orders
```

### 2. Order Processing Flow
```
1. Sales rep creates order on behalf of retailer
2. Order stored with "pending" status
3. System validates inventory availability
4. Admin confirms order
5. Order status → "confirmed"
6. ERP sync pushes order to wholesaler system
7. Wholesaler fulfills order
8. ERP sync pulls delivery confirmation
9. Order status → "delivered"
10. Payment processing tracked
```

### 3. Campaign Enrollment Flow
```
1. Admin creates promotional campaign
2. Campaign status set to "draft"
3. Admin defines target audience and terms
4. Admin activates campaign
5. Eligible retailers auto-enrolled or manually added
6. Campaign participants tracked
7. Orders during campaign period linked to campaign
8. Discounts automatically applied
9. Campaign performance monitored
10. Campaign ends, status → "completed"
```

### 4. ERP Synchronization Flow
```
PULL (Import from ERP):
1. User initiates sync
2. System connects to ERP API
3. Fetches new/updated records
4. Validates data format
5. Upserts records in platform
6. Logs sync results

PUSH (Export to ERP):
1. User initiates sync
2. System queries unsynced records
3. Formats data for ERP
4. Sends to ERP API
5. Receives confirmation
6. Updates sync status
7. Logs sync results

BIDIRECTIONAL:
1. Performs PULL first
2. Then performs PUSH
3. Resolves conflicts (ERP takes precedence)
4. Logs complete sync results
```

## Best Practices

### Retailer Management
1. **Thorough Vetting**: Review all licenses and documentation before approval
2. **Credit Management**: Set appropriate credit limits based on business size
3. **Regular Reviews**: Periodically review retailer performance and adjust terms
4. **Communication**: Keep retailers informed about campaigns and promotions

### Sales Team Management
1. **Territory Assignment**: Balance territories for fair opportunity
2. **Performance Tracking**: Monitor KPIs regularly
3. **Training**: Provide product and system training
4. **Support**: Assist with retailer onboarding and issues

### Campaign Management
1. **Clear Terms**: Define terms and conditions explicitly
2. **Budget Tracking**: Monitor spending against budget
3. **Performance Analysis**: Review campaign effectiveness
4. **Timing**: Align campaigns with seasonal demand

### ERP Integration
1. **Regular Syncs**: Schedule automatic syncs for current data
2. **Error Monitoring**: Review sync logs for failures
3. **Data Validation**: Verify data integrity after syncs
4. **Backup Strategy**: Maintain data backups before major syncs

## Troubleshooting

### Common Issues

**Retailer Onboarding Issues:**
- Missing required fields → Complete all mandatory fields
- Duplicate retailer code → System auto-generates unique codes
- Country not found → Ensure country is active in system

**Order Creation Issues:**
- Retailer not active → Verify retailer onboarding status
- Credit limit exceeded → Review and adjust credit limit
- Invalid order items → Verify product availability

**Campaign Issues:**
- Retailers not enrolling → Check target audience criteria
- Discounts not applying → Verify campaign is active and dates valid
- Budget exceeded → Review campaign spending and adjust

**ERP Sync Issues:**
- Connection failures → Verify ERP endpoint and credentials
- Data format errors → Check data mapping configuration
- Partial sync failures → Review error logs for specific records
- Timeout errors → Reduce batch size or increase timeout

## Monitoring & Analytics

### Key Metrics

**Retailer Metrics:**
- Total active retailers
- New retailer onboarding rate
- Retailer churn rate
- Average order value by retailer
- Payment performance

**Sales Rep Metrics:**
- Retailers per sales rep
- Orders per sales rep
- Revenue per sales rep
- Territory coverage
- Customer satisfaction scores

**Campaign Metrics:**
- Campaign participation rate
- Average discount per order
- ROI per campaign
- Budget utilization
- Repeat participation rate

**Sync Metrics:**
- Sync success rate
- Average sync duration
- Records processed per sync
- Error frequency by entity type
- Data latency

## Future Enhancements

1. **Mobile App**: Retailer-facing mobile app for order placement
2. **Automated Reordering**: AI-based inventory prediction and auto-ordering
3. **Advanced Analytics**: Predictive analytics for retailer behavior
4. **Multi-ERP Support**: Integrate with multiple wholesaler systems
5. **Real-time Sync**: Event-driven real-time synchronization
6. **Campaign Analytics**: Advanced ROI and performance analysis
7. **Loyalty Programs**: Points-based rewards system
8. **Territory Optimization**: AI-powered territory assignment
9. **Price Management**: Dynamic pricing based on volume/loyalty
10. **Invoice Management**: Automated invoice generation and tracking

## Related Documentation

- [Multi-Country Compliance](./MULTI_COUNTRY_COMPLIANCE.md)
- [Customer Management](./CUSTOMER_MANAGEMENT.md)
- [ERP Integration](./ERP_INTEGRATION.md)
- [Database Schema](./DATABASE.md)
- [Security Guidelines](./SECURITY.md)
