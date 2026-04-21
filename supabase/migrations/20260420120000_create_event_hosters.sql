-- Phase 1 · Admin Panel
-- Purpose: Assignment table between hosters and events. A hoster only sees/validates
-- events they are assigned to. Admins bypass this table.

CREATE TABLE IF NOT EXISTS public.event_hosters (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     INTEGER     NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_hosters_user_id  ON public.event_hosters (user_id);
CREATE INDEX IF NOT EXISTS idx_event_hosters_event_id ON public.event_hosters (event_id);

ALTER TABLE public.event_hosters ENABLE ROW LEVEL SECURITY;

-- Admins manage all assignments
DROP POLICY IF EXISTS "Admins manage event_hosters" ON public.event_hosters;
CREATE POLICY "Admins manage event_hosters"
  ON public.event_hosters
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- Hosters can read their own assignments (to resolve which events they access)
DROP POLICY IF EXISTS "Hosters read own assignments" ON public.event_hosters;
CREATE POLICY "Hosters read own assignments"
  ON public.event_hosters
  FOR SELECT
  USING (user_id = auth.uid());

-- Helper function: returns true if current user is admin OR assigned hoster for a given event
CREATE OR REPLACE FUNCTION public.is_admin_or_event_hoster(p_event_id INTEGER)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.event_hosters
    WHERE user_id = auth.uid() AND event_id = p_event_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin_or_event_hoster(INTEGER) TO authenticated;
