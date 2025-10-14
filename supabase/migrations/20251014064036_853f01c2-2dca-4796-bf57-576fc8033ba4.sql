-- Fix the handle_new_user function to auto-assign a default role (technician)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'));
  
  -- Auto-assign technician role to new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'technician');
  
  RETURN NEW;
END;
$function$;

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.farmers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.procurement_batches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shipments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.warehouse_inventory;