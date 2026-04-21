-- Phase 1 · Admin Panel
-- Purpose: Append-only audit trail for privileged admin actions (role changes,
-- comp ticket issuance, refunds, event CRUD). Required for traceability.

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email  TEXT,
  action       TEXT        NOT NULL,        -- e.g. 'role.update', 'ticket.issue_comp', 'event.create'
  target_type  TEXT,                        -- e.g. 'user', 'ticket', 'event', 'order'
  target_id    TEXT,                        -- UUID/int as text for heterogeneous FKs
  before_data  JSONB,
  after_data   JSONB,
  ip_address   INET,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_actor_id    ON public.admin_audit_log (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_action      ON public.admin_audit_log (action);
CREATE INDEX IF NOT EXISTS idx_audit_target      ON public.admin_audit_log (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at  ON public.admin_audit_log (created_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins read audit log
DROP POLICY IF EXISTS "Admins read audit log" ON public.admin_audit_log;
CREATE POLICY "Admins read audit log"
  ON public.admin_audit_log
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- Only service_role inserts (edge functions); no client INSERT
DROP POLICY IF EXISTS "Service role inserts audit log" ON public.admin_audit_log;
CREATE POLICY "Service role inserts audit log"
  ON public.admin_audit_log
  FOR INSERT
  WITH CHECK (true);

-- No UPDATE/DELETE policies → append-only by default under RLS
