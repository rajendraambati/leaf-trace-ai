-- Fix client_portal_access.client_id to use TEXT instead of UUID
-- Step 1: Drop policies that depend on client_id
DROP POLICY IF EXISTS "Users can manage their client access" ON public.client_portal_access;
DROP POLICY IF EXISTS "Users can view their client notifications" ON public.client_notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON public.client_notifications;
DROP POLICY IF EXISTS "Users can view invoices for their clients" ON public.invoices;
DROP POLICY IF EXISTS "Finance managers and admins can manage all invoices" ON public.invoices;

-- Step 2: Alter column type
ALTER TABLE public.client_portal_access
ALTER COLUMN client_id TYPE TEXT;

ALTER TABLE public.client_notifications
ALTER COLUMN client_id TYPE TEXT;

ALTER TABLE public.invoices
ALTER COLUMN client_id TYPE TEXT;

-- Step 3: Recreate policies
CREATE POLICY "Users can manage their client access"
ON public.client_portal_access FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their client notifications"
ON public.client_notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications"
ON public.client_notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view invoices for their clients"
ON public.invoices FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.client_portal_access
    WHERE user_id = auth.uid()
      AND client_type = invoices.client_type
      AND client_id = invoices.client_id
      AND is_active = true
      AND 'invoices' = ANY(allowed_modules)
  )
);

CREATE POLICY "Admins can manage all invoices"
ON public.invoices FOR ALL
USING (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'system_admin')
);