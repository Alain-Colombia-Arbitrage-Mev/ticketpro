-- Migration 005: Fix foreign keys and constraints
-- Created: 2025-11-20
-- Description: Agrega foreign keys faltantes y constraints UNIQUE

-- ============================================
-- 1. AGREGAR FOREIGN KEYS A TICKETS
-- ============================================

-- FK: tickets.event_id → events.id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tickets_event_id_fkey'
  ) THEN
    ALTER TABLE public.tickets
      ADD CONSTRAINT tickets_event_id_fkey 
      FOREIGN KEY (event_id) 
      REFERENCES public.events(id) 
      ON DELETE RESTRICT;
    
    RAISE NOTICE 'Foreign key tickets_event_id_fkey created';
  ELSE
    RAISE NOTICE 'Foreign key tickets_event_id_fkey already exists';
  END IF;
END $$;

-- FK: tickets.buyer_id → auth.users.id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tickets_buyer_id_fkey'
  ) THEN
    ALTER TABLE public.tickets
      ADD CONSTRAINT tickets_buyer_id_fkey 
      FOREIGN KEY (buyer_id) 
      REFERENCES auth.users(id) 
      ON DELETE SET NULL;
    
    RAISE NOTICE 'Foreign key tickets_buyer_id_fkey created';
  ELSE
    RAISE NOTICE 'Foreign key tickets_buyer_id_fkey already exists';
  END IF;
END $$;

-- FK: tickets.used_by → auth.users.id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tickets_used_by_fkey'
  ) THEN
    ALTER TABLE public.tickets
      ADD CONSTRAINT tickets_used_by_fkey 
      FOREIGN KEY (used_by) 
      REFERENCES auth.users(id) 
      ON DELETE SET NULL;
    
    RAISE NOTICE 'Foreign key tickets_used_by_fkey created';
  ELSE
    RAISE NOTICE 'Foreign key tickets_used_by_fkey already exists';
  END IF;
END $$;

-- ============================================
-- 2. AGREGAR UNIQUE CONSTRAINTS A ORDERS
-- ============================================

-- UNIQUE: orders.stripe_session_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_stripe_session_id'
  ) THEN
    -- Primero eliminar valores duplicados si existen
    WITH duplicates AS (
      SELECT stripe_session_id, MIN(id) as keep_id
      FROM public.orders
      WHERE stripe_session_id IS NOT NULL
      GROUP BY stripe_session_id
      HAVING COUNT(*) > 1
    )
    UPDATE public.orders
    SET stripe_session_id = stripe_session_id || '_dup_' || id::text
    WHERE stripe_session_id IN (SELECT stripe_session_id FROM duplicates)
      AND id NOT IN (SELECT keep_id FROM duplicates);
    
    -- Ahora agregar el constraint
    ALTER TABLE public.orders 
      ADD CONSTRAINT unique_stripe_session_id 
      UNIQUE (stripe_session_id);
    
    RAISE NOTICE 'Unique constraint unique_stripe_session_id created';
  ELSE
    RAISE NOTICE 'Unique constraint unique_stripe_session_id already exists';
  END IF;
END $$;

-- UNIQUE: orders.cryptomus_order_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_cryptomus_order_id'
  ) THEN
    -- Primero eliminar valores duplicados si existen
    WITH duplicates AS (
      SELECT cryptomus_order_id, MIN(id) as keep_id
      FROM public.orders
      WHERE cryptomus_order_id IS NOT NULL
      GROUP BY cryptomus_order_id
      HAVING COUNT(*) > 1
    )
    UPDATE public.orders
    SET cryptomus_order_id = cryptomus_order_id || '_dup_' || id::text
    WHERE cryptomus_order_id IN (SELECT cryptomus_order_id FROM duplicates)
      AND id NOT IN (SELECT keep_id FROM duplicates);
    
    -- Ahora agregar el constraint
    ALTER TABLE public.orders 
      ADD CONSTRAINT unique_cryptomus_order_id 
      UNIQUE (cryptomus_order_id);
    
    RAISE NOTICE 'Unique constraint unique_cryptomus_order_id created';
  ELSE
    RAISE NOTICE 'Unique constraint unique_cryptomus_order_id already exists';
  END IF;
END $$;

-- ============================================
-- 3. AGREGAR ÍNDICES ADICIONALES A TICKETS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tickets_buyer_id ON public.tickets(buyer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_buyer_email ON public.tickets(buyer_email);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON public.tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_used_by ON public.tickets(used_by);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_code ON public.tickets(ticket_code);
CREATE INDEX IF NOT EXISTS idx_tickets_purchase_date ON public.tickets(purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_event_date ON public.tickets(event_date);

-- ============================================
-- 4. AGREGAR ÍNDICES ADICIONALES A ORDERS
-- ============================================

-- Nota: Algunos índices ya existen en migración 002, solo agregamos los faltantes
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent ON public.orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_cryptomus_uuid ON public.orders(cryptomus_uuid);
CREATE INDEX IF NOT EXISTS idx_orders_completed_at ON public.orders(completed_at DESC);

-- ============================================
-- 5. COMENTARIOS
-- ============================================

COMMENT ON CONSTRAINT tickets_event_id_fkey ON public.tickets 
  IS 'FK a events - Relaciona cada ticket con su evento correspondiente';

COMMENT ON CONSTRAINT tickets_buyer_id_fkey ON public.tickets 
  IS 'FK a auth.users - Identifica al comprador del ticket (puede ser NULL para usuarios guest)';

COMMENT ON CONSTRAINT tickets_used_by_fkey ON public.tickets 
  IS 'FK a auth.users - Identifica quién validó/usó el ticket';

COMMENT ON CONSTRAINT unique_stripe_session_id ON public.orders 
  IS 'Garantiza que cada sesión de Stripe sea única';

COMMENT ON CONSTRAINT unique_cryptomus_order_id ON public.orders 
  IS 'Garantiza que cada orden de Cryptomus sea única';


