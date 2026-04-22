-- Auto-provision a profile row whenever a new auth user is created.
--
-- When we invite someone via the admin API we pass the target role in
-- raw_user_meta_data.default_role ('admin' | 'hoster' | 'user'). This trigger
-- reads that value and seeds public.profiles accordingly so the invite lands
-- already elevated — no second round-trip needed.
--
-- For regular signups (no default_role set) it falls back to 'user'.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_role text;
  v_name text;
BEGIN
  v_role := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'default_role', ''),
    'user'
  );

  -- Sanitize — only accept known roles, fall back to 'user' otherwise.
  IF v_role NOT IN ('admin', 'hoster', 'user') THEN
    v_role := 'user';
  END IF;

  v_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'name', ''),
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
  VALUES (NEW.id, NEW.email, v_name, v_role, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE
    SET email      = EXCLUDED.email,
        name       = COALESCE(public.profiles.name, EXCLUDED.name),
        role       = CASE
                       WHEN public.profiles.role IS NULL OR public.profiles.role = 'user'
                         THEN EXCLUDED.role
                       ELSE public.profiles.role
                     END,
        updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user IS
  'Seeds public.profiles on new auth.users, honoring raw_user_meta_data.default_role for invites.';
