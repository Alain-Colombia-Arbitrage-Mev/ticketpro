-- Security audit fixes (2026-04-28)
--
-- Fix 1: handle_new_user must NEVER trust client-supplied default_role.
--   The previous version read raw_user_meta_data ->> 'default_role' and
--   inserted that into public.profiles.role, sanitising only against the
--   {admin,hoster,user} allowlist. Since raw_user_meta_data is settable by
--   the caller during supabase.auth.signUp({ options: { data: ... } }),
--   any anonymous visitor could promote themselves to admin by passing
--   default_role: 'admin'. This rewrite hard-codes 'user' on insert and
--   never touches role on conflict — privileged roles must be assigned
--   exclusively via the admin panel (which uses service_role).
--
-- Fix 2: validate_ticket SECURITY DEFINER overloads should not have the
--   default PUBLIC EXECUTE grant. Mitigated today because PostgREST didn't
--   expose them (no RPCs in the OpenAPI spec), but this is defence-in-depth:
--   a future intentional-but-incorrect GRANT can no longer expose the
--   function to authenticated/anon callers.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_name text;
BEGIN
  v_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'name', ''),
    split_part(NEW.email, '@', 1)
  );

  -- Always 'user'. Privileged roles are assigned only through the admin
  -- panel via the worker (which uses service_role to update profiles.role).
  INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
  VALUES (NEW.id, NEW.email, v_name, 'user', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        name  = COALESCE(public.profiles.name, EXCLUDED.name);
    -- role intentionally NOT updated on conflict.
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_ticket(uuid, uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_ticket(text, uuid) FROM PUBLIC;
