-- Fix: events RLS was effectively bypassed (anon key could INSERT/UPDATE/DELETE).
-- Force RLS, drop every prior policy on public.events, then re-create the
-- correct set: public reads active rows; admins (and hosters for read) get
-- elevated access; writes are admin-only.

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events FORCE ROW LEVEL SECURITY;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'events'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.events', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "events_select_public_active"
  ON public.events
  FOR SELECT
  USING (
    is_active = TRUE
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'hoster')
    )
  );

CREATE POLICY "events_insert_admin"
  ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

CREATE POLICY "events_update_admin"
  ON public.events
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

CREATE POLICY "events_delete_admin"
  ON public.events
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));
