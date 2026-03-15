-- Migration: 013_admin_improvements.sql
-- Purpose: Admin panel reliability improvements — adds transaction_logs table for full
-- Stripe event audit trail, fixes payment_status enum to include fraud_detected,
-- backfills buyer_id on orders/tickets from auth.users by email, adds auto-resolve
-- trigger for future inserts, and backfills stripe_payment_intent_id from metadata.

-- Step 1: Fix payment_status constraint to include fraud_detected
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS chk_orders_payment_status CASCADE;
ALTER TABLE public.orders
ADD CONSTRAINT chk_orders_payment_status
CHECK (payment_status = ANY (ARRAY['pending','processing','completed','paid','failed','refunded','cancelled','fraud_detected']));

-- Step 2: Create transaction_logs table
CREATE TABLE IF NOT EXISTS public.transaction_logs (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type          TEXT        NOT NULL,
  stripe_event_id     TEXT        UNIQUE,
  order_id            TEXT,
  order_uuid          UUID        REFERENCES public.orders(id) ON DELETE SET NULL,
  buyer_email         TEXT,
  amount              BIGINT,
  currency            TEXT        DEFAULT 'usd',
  payment_intent_id   TEXT,
  payment_status      TEXT,
  metadata            JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transaction_logs_event_type
  ON public.transaction_logs (event_type);

CREATE INDEX IF NOT EXISTS idx_transaction_logs_order_id
  ON public.transaction_logs (order_id);

CREATE INDEX IF NOT EXISTS idx_transaction_logs_buyer_email
  ON public.transaction_logs (buyer_email);

CREATE INDEX IF NOT EXISTS idx_transaction_logs_stripe_event_id
  ON public.transaction_logs (stripe_event_id);

CREATE INDEX IF NOT EXISTS idx_transaction_logs_created_at
  ON public.transaction_logs (created_at DESC);

-- Step 3: RLS on transaction_logs
ALTER TABLE public.transaction_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and hosters can view transaction logs" ON public.transaction_logs;
CREATE POLICY "Admins and hosters can view transaction logs"
  ON public.transaction_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'hoster')
    )
  );

DROP POLICY IF EXISTS "Service role can insert transaction logs" ON public.transaction_logs;
CREATE POLICY "Service role can insert transaction logs"
  ON public.transaction_logs
  FOR INSERT
  WITH CHECK (true);

-- Step 4: Backfill buyer_id on orders where email matches auth.users
UPDATE public.orders o
SET buyer_id = u.id
FROM auth.users u
WHERE o.buyer_id IS NULL
  AND lower(o.buyer_email) = lower(u.email);

UPDATE public.tickets t
SET buyer_id = u.id
FROM auth.users u
WHERE t.buyer_id IS NULL
  AND lower(t.buyer_email) = lower(u.email);

-- Step 5: Auto-resolve trigger — sets buyer_id on INSERT when buyer_email matches auth.users
CREATE OR REPLACE FUNCTION public.auto_set_buyer_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.buyer_id IS NULL AND NEW.buyer_email IS NOT NULL THEN
    SELECT id INTO NEW.buyer_id
    FROM auth.users
    WHERE lower(email) = lower(NEW.buyer_email)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_orders_auto_set_buyer_id ON public.orders;
CREATE TRIGGER trg_orders_auto_set_buyer_id
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_buyer_id();

DROP TRIGGER IF EXISTS trg_tickets_auto_set_buyer_id ON public.tickets;
CREATE TRIGGER trg_tickets_auto_set_buyer_id
  BEFORE INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_buyer_id();

-- Step 6: Backfill stripe_payment_intent_id from metadata->>'paymentIntent'
UPDATE public.orders
SET stripe_payment_intent_id = metadata->>'paymentIntent'
WHERE stripe_payment_intent_id IS NULL
  AND metadata->>'paymentIntent' IS NOT NULL;

-- Step 7: Fix RLS policy on orders — use auth.jwt() instead of querying auth.users
-- (authenticated role does not have SELECT on auth.users, causing "permission denied")
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders"
  ON public.orders
  FOR SELECT
  USING (auth.uid() = buyer_id OR buyer_email = (auth.jwt()->>'email'));

-- Step 8: Fix card_fingerprints RLS — use profiles instead of auth.users metadata
DROP POLICY IF EXISTS "Admin can view card fingerprints" ON public.card_fingerprints;
CREATE POLICY "Admin can view card fingerprints"
  ON public.card_fingerprints
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'hoster')
  ));
