-- Phase 1 · Admin Panel
-- Purpose: Track manually-issued comp tickets (staff, press, VIP invites). A comp ticket
-- skips payment, has price = 0, and records which admin issued it and why.

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS issued_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS issue_reason TEXT,
  ADD COLUMN IF NOT EXISTS is_comp      BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_tickets_issued_by ON public.tickets (issued_by) WHERE issued_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_is_comp   ON public.tickets (is_comp)   WHERE is_comp = TRUE;

COMMENT ON COLUMN public.tickets.issued_by    IS 'Admin user who manually issued this ticket (NULL for paid tickets)';
COMMENT ON COLUMN public.tickets.issue_reason IS 'Reason for comp issuance (e.g. "staff", "press", "VIP invite")';
COMMENT ON COLUMN public.tickets.is_comp      IS 'TRUE for tickets issued manually without payment';
