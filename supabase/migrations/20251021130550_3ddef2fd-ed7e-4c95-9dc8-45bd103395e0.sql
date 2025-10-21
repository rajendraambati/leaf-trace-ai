-- Fix 1: Update profiles RLS policy to restrict access to owner only
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'auditor'::app_role));

-- Fix 2: Remove password_hash column from pending_registrations
-- First, update the table to add user_id column to link to auth.users
ALTER TABLE public.pending_registrations 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Remove the password_hash column as passwords will be handled by Supabase Auth
ALTER TABLE public.pending_registrations 
DROP COLUMN IF EXISTS password_hash;