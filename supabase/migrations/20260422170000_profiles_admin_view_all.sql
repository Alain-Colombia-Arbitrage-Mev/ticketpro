-- Admin visibility on public.profiles.
--
-- The existing SELECT policy only lets a user read their own row. The admin
-- panel (RolesTab) needs to list every profile, so we add a second policy
-- that lets admins see all rows.
--
-- Writing `role = 'admin'` directly in the policy would cause infinite
-- recursion (checking the policy requires reading profiles, which triggers
-- the policy again). We solve it with a SECURITY DEFINER helper that reads
-- the caller's role with RLS bypassed.

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;

-- SELECT-all for admins. Stacks on top of the existing `profiles_select_own`
-- policy, so non-admins still only see their own row.
DROP POLICY IF EXISTS "profiles_select_admin_all" ON public.profiles;

CREATE POLICY "profiles_select_admin_all"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.current_user_role() = 'admin');
