-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins and auditors can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users can create audit logs" ON public.audit_logs;

-- Only admins and auditors can view audit logs
CREATE POLICY "Admins and auditors can view audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'auditor'::app_role));

-- System can insert audit logs (via service role or authenticated users)
CREATE POLICY "Authenticated users can create audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');