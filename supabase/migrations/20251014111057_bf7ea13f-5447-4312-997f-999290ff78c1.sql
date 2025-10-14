-- Create permissions table to store granular permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  allowed BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(role, resource, action)
);

-- Enable RLS on role_permissions
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Only admins can manage permissions
CREATE POLICY "Only admins can view permissions"
  ON public.role_permissions
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can manage permissions"
  ON public.role_permissions
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Create helper function to check specific permissions
CREATE OR REPLACE FUNCTION public.has_permission(
  _user_id uuid,
  _resource text,
  _action text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = _user_id
      AND rp.resource = _resource
      AND rp.action = _action
      AND rp.allowed = true
  )
$$;

COMMENT ON FUNCTION public.has_permission IS 'Check if a user has a specific permission based on their role';