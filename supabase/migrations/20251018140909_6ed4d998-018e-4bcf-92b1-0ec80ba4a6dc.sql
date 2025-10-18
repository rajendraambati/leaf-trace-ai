-- Drop all existing policies on warehouses table
DROP POLICY IF EXISTS "Everyone can view warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Factory managers can manage warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Factory managers can update warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Factory managers can delete warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Authenticated users can create warehouses" ON public.warehouses;

-- Create new policies
-- Allow everyone to view warehouses
CREATE POLICY "Allow public read warehouses"
  ON public.warehouses FOR SELECT
  USING (true);

-- Allow authenticated users to create warehouses
CREATE POLICY "Allow authenticated insert warehouses"
  ON public.warehouses FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow factory managers and auditors to update warehouses
CREATE POLICY "Allow managers update warehouses"
  ON public.warehouses FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'factory_manager'::app_role) OR has_role(auth.uid(), 'auditor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Allow factory managers and auditors to delete warehouses
CREATE POLICY "Allow managers delete warehouses"
  ON public.warehouses FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'factory_manager'::app_role) OR has_role(auth.uid(), 'auditor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));