# Security Documentation

## Authentication

- JWT-based authentication via Supabase Auth
- Email/password login with auto-confirm enabled
- Session management with refresh tokens

## Authorization (RBAC)

### Roles
- `admin`: Full system access
- `auditor`: Read-all + compliance management
- `technician`: Farmer/procurement management
- `procurement_agent`: Procurement operations
- `logistics_manager`: Shipment tracking
- `factory_manager`: Processing/warehouse

### Role Assignment
```sql
INSERT INTO user_roles (user_id, role) VALUES (auth.uid(), 'technician');
```

## Row-Level Security

All tables have RLS enabled. Policies use `has_role()` security definer function to prevent infinite recursion.

**Example Policy:**
```sql
CREATE POLICY "Technicians can manage farmers"
  ON farmers FOR ALL
  USING (has_role(auth.uid(), 'technician'::app_role));
```

## Data Protection

- Encrypted at rest and in transit
- Secrets stored in Lovable Cloud
- No sensitive data in frontend
- Audit logging for all critical operations

## Best Practices

1. Never store API keys in code
2. Use RLS policies for all tables
3. Validate input on client and server
4. Log security events to audit_logs
5. Review permissions regularly
