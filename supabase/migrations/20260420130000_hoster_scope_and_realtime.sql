-- Phase 5 · Live validation + hoster scoping
-- Purpose:
--   1. Restrict hosters to tickets/events they are assigned to (event_hosters).
--      Admins keep full access.
--   2. Enable Supabase Realtime publication on tickets so the admin panel can
--      subscribe to live validation events.

-- ─── Tickets: split admin vs hoster-scoped policies ───────────────────────────

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Replace the old permissive "Admins can view all tickets" (role IN admin/hoster)
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can manage all tickets" ON public.tickets;

CREATE POLICY "Admins view all tickets"
  ON public.tickets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins manage all tickets"
  ON public.tickets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Hoster: scoped to event_hosters assignments
CREATE POLICY "Hosters view tickets of assigned events"
  ON public.tickets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'hoster'
    )
    AND EXISTS (
      SELECT 1 FROM public.event_hosters eh
      WHERE eh.user_id = auth.uid()
        AND eh.event_id = tickets.event_id
    )
  );

CREATE POLICY "Hosters update tickets of assigned events"
  ON public.tickets
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'hoster'
    )
    AND EXISTS (
      SELECT 1 FROM public.event_hosters eh
      WHERE eh.user_id = auth.uid()
        AND eh.event_id = tickets.event_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'hoster'
    )
    AND EXISTS (
      SELECT 1 FROM public.event_hosters eh
      WHERE eh.user_id = auth.uid()
        AND eh.event_id = tickets.event_id
    )
  );

-- ─── Index to speed up live validation feed queries ──────────────────────────

CREATE INDEX IF NOT EXISTS idx_tickets_used_at        ON public.tickets (used_at DESC) WHERE used_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_event_used_at  ON public.tickets (event_id, used_at DESC) WHERE used_at IS NOT NULL;

-- ─── Enable Realtime publication on tickets ─────────────────────────────────

DO $$
BEGIN
  -- Add tickets to the realtime publication if not already there
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'tickets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
  END IF;
END $$;

-- Ensure REPLICA IDENTITY FULL so UPDATE payloads include old row (needed for diffs)
ALTER TABLE public.tickets REPLICA IDENTITY FULL;
