-- Fix RLS policies for compliance tables

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view compliance documents based on role" ON public.compliance_documents;
DROP POLICY IF EXISTS "Admins can insert compliance documents" ON public.compliance_documents;
DROP POLICY IF EXISTS "Admins can update compliance documents" ON public.compliance_documents;

DROP POLICY IF EXISTS "Users can view compliance validations based on role" ON public.compliance_validations;
DROP POLICY IF EXISTS "System can insert compliance validations" ON public.compliance_validations;

DROP POLICY IF EXISTS "Users can view regulatory reports based on role" ON public.regulatory_reports;
DROP POLICY IF EXISTS "Admins can insert regulatory reports" ON public.regulatory_reports;
DROP POLICY IF EXISTS "Admins can update regulatory reports" ON public.regulatory_reports;

DROP POLICY IF EXISTS "Users can view dispatch compliance checks based on role" ON public.dispatch_compliance_checks;
DROP POLICY IF EXISTS "System can insert dispatch compliance checks" ON public.dispatch_compliance_checks;
DROP POLICY IF EXISTS "Admins can update dispatch compliance checks" ON public.dispatch_compliance_checks;

-- Recreate policies for compliance_documents with proper permissions
CREATE POLICY "Everyone can view compliance documents"
  ON public.compliance_documents FOR SELECT
  USING (true);

CREATE POLICY "Authorized users can insert compliance documents"
  ON public.compliance_documents FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'system_admin') OR 
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'logistics_manager') OR
    has_role(auth.uid(), 'factory_manager') OR
    has_role(auth.uid(), 'technician') OR
    has_role(auth.uid(), 'auditor')
  );

CREATE POLICY "Authorized users can update compliance documents"
  ON public.compliance_documents FOR UPDATE
  USING (
    has_role(auth.uid(), 'system_admin') OR 
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'logistics_manager') OR
    has_role(auth.uid(), 'factory_manager') OR
    has_role(auth.uid(), 'auditor')
  );

CREATE POLICY "Admins can delete compliance documents"
  ON public.compliance_documents FOR DELETE
  USING (
    has_role(auth.uid(), 'system_admin') OR 
    has_role(auth.uid(), 'admin')
  );

-- Recreate policies for compliance_validations
CREATE POLICY "Everyone can view compliance validations"
  ON public.compliance_validations FOR SELECT
  USING (true);

CREATE POLICY "System can insert compliance validations"
  ON public.compliance_validations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update compliance validations"
  ON public.compliance_validations FOR UPDATE
  USING (
    has_role(auth.uid(), 'system_admin') OR 
    has_role(auth.uid(), 'admin')
  );

-- Recreate policies for regulatory_reports
CREATE POLICY "Everyone can view regulatory reports"
  ON public.regulatory_reports FOR SELECT
  USING (true);

CREATE POLICY "Authorized users can insert regulatory reports"
  ON public.regulatory_reports FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'system_admin') OR 
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'auditor') OR
    has_role(auth.uid(), 'logistics_manager')
  );

CREATE POLICY "Authorized users can update regulatory reports"
  ON public.regulatory_reports FOR UPDATE
  USING (
    has_role(auth.uid(), 'system_admin') OR 
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'auditor')
  );

CREATE POLICY "Admins can delete regulatory reports"
  ON public.regulatory_reports FOR DELETE
  USING (
    has_role(auth.uid(), 'system_admin') OR 
    has_role(auth.uid(), 'admin')
  );

-- Recreate policies for dispatch_compliance_checks
CREATE POLICY "Everyone can view dispatch compliance checks"
  ON public.dispatch_compliance_checks FOR SELECT
  USING (true);

CREATE POLICY "System can insert dispatch compliance checks"
  ON public.dispatch_compliance_checks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authorized users can update dispatch compliance checks"
  ON public.dispatch_compliance_checks FOR UPDATE
  USING (
    has_role(auth.uid(), 'system_admin') OR 
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'logistics_manager') OR
    has_role(auth.uid(), 'factory_manager')
  );

CREATE POLICY "Admins can delete dispatch compliance checks"
  ON public.dispatch_compliance_checks FOR DELETE
  USING (
    has_role(auth.uid(), 'system_admin') OR 
    has_role(auth.uid(), 'admin')
  );