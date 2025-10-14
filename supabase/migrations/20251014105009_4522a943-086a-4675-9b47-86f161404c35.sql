-- 1) Create trigger to auto-create profile and assign default role on signup
create extension if not exists pgcrypto; -- ensure gen_random_uuid exists

-- Drop existing trigger if any to avoid duplicates
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users to call handle_new_user
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 2) Backfill profiles for existing users missing a profile
INSERT INTO public.profiles (id, full_name)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'full_name', 'User')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- 3) Backfill a default 'technician' role for users without any role
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'technician'::app_role
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE r.user_id IS NULL;
