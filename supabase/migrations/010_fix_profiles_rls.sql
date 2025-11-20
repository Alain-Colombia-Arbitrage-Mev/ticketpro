-- Clean up duplicate RLS policies on profiles table
BEGIN;

-- Drop existing policies (both sets of names seen in inspection)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Recreate simplified and correct policies
-- 1. SELECT: Users can view their own profile
CREATE POLICY "profiles_select_own" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- 2. INSERT: Users can insert their own profile
CREATE POLICY "profiles_insert_self" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 3. UPDATE: Users can update their own profile
CREATE POLICY "profiles_update_own" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

COMMIT;

