-- Add 'farmer' role to app_role enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    WHERE t.typname = 'app_role' AND e.enumlabel = 'farmer'
  ) THEN
    ALTER TYPE app_role ADD VALUE 'farmer';
  END IF;
END $$;

-- Clear existing permissions to rebuild the matrix
TRUNCATE TABLE role_permissions;

-- Admin permissions (full access to everything)
INSERT INTO role_permissions (role, resource, action, allowed) VALUES
('admin', 'farmers', 'create', true),
('admin', 'farmers', 'read', true),
('admin', 'farmers', 'update', true),
('admin', 'farmers', 'delete', true),
('admin', 'procurement', 'create', true),
('admin', 'procurement', 'read', true),
('admin', 'procurement', 'update', true),
('admin', 'procurement', 'delete', true),
('admin', 'logistics', 'create', true),
('admin', 'logistics', 'read', true),
('admin', 'logistics', 'update', true),
('admin', 'logistics', 'delete', true),
('admin', 'warehouse', 'create', true),
('admin', 'warehouse', 'read', true),
('admin', 'warehouse', 'update', true),
('admin', 'warehouse', 'delete', true),
('admin', 'processing', 'create', true),
('admin', 'processing', 'read', true),
('admin', 'processing', 'update', true),
('admin', 'processing', 'delete', true),
('admin', 'ai_grading', 'create', true),
('admin', 'ai_grading', 'read', true),
('admin', 'ai_grading', 'update', true),
('admin', 'ai_grading', 'delete', true),
('admin', 'compliance', 'create', true),
('admin', 'compliance', 'read', true),
('admin', 'compliance', 'update', true),
('admin', 'compliance', 'delete', true),
('admin', 'iot_devices', 'create', true),
('admin', 'iot_devices', 'read', true),
('admin', 'iot_devices', 'update', true),
('admin', 'iot_devices', 'delete', true),
('admin', 'analytics', 'read', true),
('admin', 'audit_logs', 'read', true),
('admin', 'user_management', 'create', true),
('admin', 'user_management', 'read', true),
('admin', 'user_management', 'update', true),
('admin', 'user_management', 'delete', true);

-- Auditor permissions (read all, manage compliance)
INSERT INTO role_permissions (role, resource, action, allowed) VALUES
('auditor', 'farmers', 'read', true),
('auditor', 'procurement', 'read', true),
('auditor', 'logistics', 'read', true),
('auditor', 'warehouse', 'read', true),
('auditor', 'processing', 'read', true),
('auditor', 'ai_grading', 'read', true),
('auditor', 'compliance', 'create', true),
('auditor', 'compliance', 'read', true),
('auditor', 'compliance', 'update', true),
('auditor', 'compliance', 'delete', true),
('auditor', 'iot_devices', 'read', true),
('auditor', 'analytics', 'read', true),
('auditor', 'audit_logs', 'read', true);

-- Technician permissions (manage farmers, procurement, AI grading)
INSERT INTO role_permissions (role, resource, action, allowed) VALUES
('technician', 'farmers', 'create', true),
('technician', 'farmers', 'read', true),
('technician', 'farmers', 'update', true),
('technician', 'procurement', 'create', true),
('technician', 'procurement', 'read', true),
('technician', 'procurement', 'update', true),
('technician', 'ai_grading', 'create', true),
('technician', 'ai_grading', 'read', true),
('technician', 'logistics', 'read', true),
('technician', 'iot_devices', 'read', true),
('technician', 'analytics', 'read', true);

-- Farmer permissions (view own data, create procurement)
INSERT INTO role_permissions (role, resource, action, allowed) VALUES
('farmer', 'farmers', 'read', true),
('farmer', 'farmers', 'update', true),
('farmer', 'procurement', 'create', true),
('farmer', 'procurement', 'read', true),
('farmer', 'ai_grading', 'read', true),
('farmer', 'analytics', 'read', true);

-- Procurement Agent permissions
INSERT INTO role_permissions (role, resource, action, allowed) VALUES
('procurement_agent', 'farmers', 'read', true),
('procurement_agent', 'procurement', 'create', true),
('procurement_agent', 'procurement', 'read', true),
('procurement_agent', 'procurement', 'update', true),
('procurement_agent', 'ai_grading', 'read', true),
('procurement_agent', 'analytics', 'read', true);

-- Logistics Manager permissions
INSERT INTO role_permissions (role, resource, action, allowed) VALUES
('logistics_manager', 'logistics', 'create', true),
('logistics_manager', 'logistics', 'read', true),
('logistics_manager', 'logistics', 'update', true),
('logistics_manager', 'warehouse', 'read', true),
('logistics_manager', 'procurement', 'read', true),
('logistics_manager', 'iot_devices', 'read', true),
('logistics_manager', 'analytics', 'read', true);

-- Factory Manager permissions
INSERT INTO role_permissions (role, resource, action, allowed) VALUES
('factory_manager', 'warehouse', 'create', true),
('factory_manager', 'warehouse', 'read', true),
('factory_manager', 'warehouse', 'update', true),
('factory_manager', 'processing', 'create', true),
('factory_manager', 'processing', 'read', true),
('factory_manager', 'processing', 'update', true),
('factory_manager', 'procurement', 'read', true),
('factory_manager', 'iot_devices', 'read', true),
('factory_manager', 'analytics', 'read', true);