-- Fix RLS policies: restrict service_role-only operations
-- Previously these policies used WITH CHECK (true) / USING (true) which allowed
-- any authenticated user to insert/update tickets and orders.

-- === TICKETS ===

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Service role can insert tickets" ON public.tickets;
DROP POLICY IF EXISTS "Service role can update tickets" ON public.tickets;

-- Recreate with proper service_role restriction
CREATE POLICY "Service role can insert tickets"
  ON public.tickets FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update tickets"
  ON public.tickets FOR UPDATE
  USING (auth.role() = 'service_role');

-- === ORDERS ===

DROP POLICY IF EXISTS "Service role can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Service role can update orders" ON public.orders;

CREATE POLICY "Service role can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update orders"
  ON public.orders FOR UPDATE
  USING (auth.role() = 'service_role');
