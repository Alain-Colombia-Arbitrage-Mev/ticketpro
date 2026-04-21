-- Phase 1 · Admin Panel
-- Purpose: RLS policies for admin CRUD on events (create, update, delete from UI).
-- Public SELECT policy is assumed to already exist; this adds admin write access.

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Public read: active events visible to everyone. Keep existing policy if present.
DROP POLICY IF EXISTS "Public read active events" ON public.events;
CREATE POLICY "Public read active events"
  ON public.events
  FOR SELECT
  USING (is_active = TRUE OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'hoster')
  ));

-- Admin-only writes
DROP POLICY IF EXISTS "Admins insert events" ON public.events;
CREATE POLICY "Admins insert events"
  ON public.events
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

DROP POLICY IF EXISTS "Admins update events" ON public.events;
CREATE POLICY "Admins update events"
  ON public.events
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

DROP POLICY IF EXISTS "Admins delete events" ON public.events;
CREATE POLICY "Admins delete events"
  ON public.events
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));
