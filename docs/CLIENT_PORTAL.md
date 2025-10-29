# Client Portal

A secure, role-based portal system for processing units, distributors, retailers, and warehouses to track orders, shipments, compliance documents, and invoices in real-time.

## Features

### Role-Based Access Control
- **Processing Units**: View procurement orders, incoming shipments, and compliance documents
- **Distributors**: Track customer orders, manage invoices, view shipment status
- **Retailers**: Monitor order status, access invoices, receive notifications
- **Warehouses**: Track incoming/outgoing shipments, inventory updates

### Real-Time Updates
- Live notifications for order updates, shipment status changes, and document availability
- WebSocket-based real-time data synchronization
- Auto-refresh every 30 seconds for latest data

### Module Access
Each client can be granted access to specific modules:
- **Orders**: View and track order status
- **Tracking**: Real-time shipment tracking with GPS
- **Documents**: Access compliance documents and certificates
- **Invoices**: View, download, and track payment status

## Database Schema

### `client_portal_access`
Manages user access to the portal:
- `user_id`: Reference to authenticated user
- `client_type`: Type of client (processing_unit, distributor, retailer, warehouse)
- `client_id`: Reference to the specific client entity
- `access_level`: Access permissions (read_only, read_write, admin)
- `allowed_modules`: Array of accessible modules
- `is_active`: Status of portal access

### `invoices`
Stores client invoices:
- `invoice_number`: Unique invoice identifier
- `client_type` & `client_id`: Links to specific client
- `order_id`, `shipment_id`, `batch_id`: Related entities
- `invoice_date`, `due_date`: Payment timeline
- `subtotal`, `tax_amount`, `discount_amount`, `total_amount`: Amounts
- `payment_status`: pending, paid, overdue, cancelled
- `line_items`: JSON array of invoice items
- `pdf_url`: Link to downloadable invoice PDF

### `client_notifications`
Real-time notification system:
- `notification_type`: order_update, shipment_update, document_ready, invoice_generated, payment_reminder, compliance_alert
- `title` & `message`: Notification content
- `priority`: low, medium, high, critical
- `is_read`: Read status
- `related_entity_type` & `related_entity_id`: Links to related data

## API Endpoints

### Edge Function: `client-portal-data`
**Route**: `/functions/v1/client-portal-data`  
**Authentication**: Required (JWT)  
**Method**: GET

**Response**:
```json
{
  "access": {
    "client_type": "processing_unit",
    "client_id": "uuid",
    "allowed_modules": ["orders", "tracking", "documents", "invoices"]
  },
  "orders": [...],
  "shipments": [...],
  "documents": [...],
  "invoices": [...],
  "notifications": [...],
  "stats": {
    "total_orders": 45,
    "pending_orders": 12,
    "active_shipments": 8,
    "pending_invoices": 5,
    "unread_notifications": 3
  }
}
```

## Security Features

### Row-Level Security (RLS)
All tables have RLS policies enforcing:
- Users can only view data for their assigned client
- Admins have full access for management
- Notifications are user-specific

### Access Control
- Portal access is validated at the database level
- Client type and ID verification on every query
- Module-based permissions restrict data access

## User Interface

### Dashboard Overview
- Statistics cards showing key metrics
- Quick access to all modules
- Real-time notification badge

### Orders View
- List of all orders with status
- Filtering by status and date
- Order details with line items
- Total amounts and payment status

### Tracking View
- Active shipments with real-time status
- GPS coordinates and location
- Driver information
- Estimated arrival times
- Route visualization

### Documents View
- Compliance documents library
- Document type and status
- Issue and expiry dates
- Download and view options

### Invoices View
- Invoice listing with payment status
- Overdue invoice highlighting
- Download invoice PDFs
- Payment history

### Notifications
- Real-time notification feed
- Priority-based sorting
- Mark as read functionality
- Related entity quick links

## Real-Time Features

### WebSocket Subscriptions
The portal automatically subscribes to:
```typescript
supabase
  .channel('client-notifications')
  .on('INSERT', { table: 'client_notifications' }, (payload) => {
    // Show toast notification
    // Refresh portal data
  })
  .subscribe()
```

### Auto-Refresh
- Portal data refreshes every 30 seconds
- Ensures users always see current information
- Configurable refresh interval

## Usage Example

### Granting Portal Access (Admin)
```sql
INSERT INTO client_portal_access (
  user_id,
  client_type,
  client_id,
  access_level,
  allowed_modules
) VALUES (
  'user-uuid',
  'processing_unit',
  'processing-unit-uuid',
  'read_write',
  ARRAY['orders', 'tracking', 'documents', 'invoices']
);
```

### Creating an Invoice (System)
```sql
INSERT INTO invoices (
  invoice_number,
  client_type,
  client_id,
  order_id,
  invoice_date,
  due_date,
  subtotal,
  tax_amount,
  total_amount,
  payment_status,
  line_items
) VALUES (
  'INV-2025-001',
  'retailer',
  'retailer-uuid',
  'order-uuid',
  '2025-01-15',
  '2025-02-15',
  1000.00,
  100.00,
  1100.00,
  'pending',
  '[{"product": "Tobacco Grade A", "quantity": 100, "unit_price": 10.00}]'::jsonb
);
```

### Sending a Notification
```sql
INSERT INTO client_notifications (
  user_id,
  client_type,
  client_id,
  notification_type,
  title,
  message,
  priority,
  related_entity_type,
  related_entity_id
) VALUES (
  'user-uuid',
  'processing_unit',
  'processing-unit-uuid',
  'shipment_update',
  'Shipment Arrived',
  'Your shipment SHP-12345 has been delivered to your facility.',
  'high',
  'shipment',
  'SHP-12345'
);
```

## Integration Points

### With Order Management
- Orders automatically appear in client portals
- Status updates trigger notifications
- Order history and tracking

### With Logistics
- Real-time shipment tracking
- GPS location updates
- ETA calculations
- Driver information

### With Compliance
- Document availability notifications
- Expiry alerts
- Certificate downloads

### With Finance
- Automated invoice generation
- Payment tracking
- Overdue payment reminders

## Mobile Responsiveness
- Fully responsive design
- Touch-optimized interface
- Works on tablets and smartphones
- Progressive Web App (PWA) ready

## Best Practices

### For Administrators
1. Grant minimal necessary module access
2. Use `read_only` access by default
3. Regularly audit portal access
4. Monitor notification priorities

### For Developers
1. Always check `allowed_modules` before showing content
2. Use the `client-portal-data` edge function for data fetching
3. Subscribe to real-time channels for notifications
4. Implement proper error handling for access denied scenarios

### For Users
1. Check notifications regularly for important updates
2. Download invoices for record-keeping
3. Track shipments proactively
4. Report access issues to administrators

## Future Enhancements
- Multi-language support
- Custom dashboard layouts
- Advanced analytics and reporting
- Mobile app with offline capabilities
- Two-factor authentication
- Export data to Excel/CSV
- Custom notification preferences
