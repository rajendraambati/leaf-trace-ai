-- First, add new enum values
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'farmer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'field_technician';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'compliance_auditor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'system_admin';