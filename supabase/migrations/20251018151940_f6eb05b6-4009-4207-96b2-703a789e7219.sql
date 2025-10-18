-- Add INSERT policy for processing_units to allow authenticated users to create processing units
CREATE POLICY "Authenticated users can create processing units"
ON public.processing_units
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Also allow technicians and procurement agents to manage processing units
CREATE POLICY "Technicians can manage processing units"
ON public.processing_units
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'technician'::app_role) OR has_role(auth.uid(), 'procurement_agent'::app_role));