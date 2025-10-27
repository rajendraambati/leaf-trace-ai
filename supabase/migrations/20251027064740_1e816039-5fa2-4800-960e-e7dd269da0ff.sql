-- Revoke public access to materialized view to prevent API exposure
REVOKE ALL ON public.vehicle_trip_statistics FROM anon, authenticated;

-- Only allow service role to access it (for backend functions)
GRANT SELECT ON public.vehicle_trip_statistics TO service_role;