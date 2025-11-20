-- Migration 007: Complete RLS policies
-- Created: 2025-11-20
-- Description: Completa las políticas de seguridad RLS para todos los usuarios

-- ============================================
-- 1. RLS POLICIES PARA TICKETS
-- ============================================

-- Asegurar que RLS está habilitado
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can manage all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Service role can insert tickets" ON public.tickets;
DROP POLICY IF EXISTS "Service role can update tickets" ON public.tickets;

-- POLÍTICA 1: Usuarios pueden ver solo sus propios tickets
CREATE POLICY "Users can view their own tickets"
  ON public.tickets
  FOR SELECT
  USING (
    auth.uid() = buyer_id 
    OR 
    buyer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- POLÍTICA 2: Admins y hosters pueden ver todos los tickets
CREATE POLICY "Admins can view all tickets"
  ON public.tickets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'hoster')
    )
  );

-- POLÍTICA 3: Usuarios pueden actualizar sus propios tickets
-- (útil para transferencias o actualización de información)
CREATE POLICY "Users can update their own tickets"
  ON public.tickets
  FOR UPDATE
  USING (
    auth.uid() = buyer_id 
    OR 
    buyer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = buyer_id 
    OR 
    buyer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- POLÍTICA 4: Admins y hosters pueden gestionar todos los tickets
CREATE POLICY "Admins can manage all tickets"
  ON public.tickets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'hoster')
    )
  );

-- POLÍTICA 5: Service role puede insertar tickets (para webhooks y creación)
CREATE POLICY "Service role can insert tickets"
  ON public.tickets
  FOR INSERT
  WITH CHECK (true);

-- POLÍTICA 6: Service role puede actualizar tickets (para validación, etc.)
CREATE POLICY "Service role can update tickets"
  ON public.tickets
  FOR UPDATE
  USING (true);

-- ============================================
-- 2. MEJORAR RLS POLICIES PARA ORDERS
-- ============================================

-- Asegurar que RLS está habilitado
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Service role can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Service role can update orders" ON public.orders;

-- POLÍTICA 1: Usuarios pueden ver sus propias órdenes
CREATE POLICY "Users can view their own orders"
  ON public.orders
  FOR SELECT
  USING (
    auth.uid() = buyer_id 
    OR 
    buyer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- POLÍTICA 2: Admins y hosters pueden ver todas las órdenes
CREATE POLICY "Admins can view all orders"
  ON public.orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'hoster')
    )
  );

-- POLÍTICA 3: Admins pueden gestionar todas las órdenes
CREATE POLICY "Admins can manage all orders"
  ON public.orders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'hoster')
    )
  );

-- POLÍTICA 4: Service role puede insertar órdenes (webhooks)
CREATE POLICY "Service role can insert orders"
  ON public.orders
  FOR INSERT
  WITH CHECK (true);

-- POLÍTICA 5: Service role puede actualizar órdenes (webhooks)
CREATE POLICY "Service role can update orders"
  ON public.orders
  FOR UPDATE
  USING (true);

-- ============================================
-- 3. VERIFICAR RLS EN PROFILES
-- ============================================

-- Asegurar que RLS está habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Las políticas deberían existir desde migración 001, solo verificamos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile"
      ON public.profiles
      FOR SELECT
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON public.profiles
      FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile"
      ON public.profiles
      FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- ============================================
-- 4. VERIFICAR RLS EN PAYMENT_METHODS
-- ============================================

-- Los payment_methods deberían ser de solo lectura para usuarios
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Admins can manage payment methods" ON public.payment_methods;

-- POLÍTICA 1: Cualquiera puede ver métodos de pago activos
CREATE POLICY "Anyone can view payment methods"
  ON public.payment_methods
  FOR SELECT
  USING (is_active = true);

-- POLÍTICA 2: Solo admins pueden gestionar métodos de pago
CREATE POLICY "Admins can manage payment methods"
  ON public.payment_methods
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 5. VERIFICAR RLS EN TICKET_CATEGORIES
-- ============================================

-- Las categorías deberían ser visibles para todos
ALTER TABLE public.ticket_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view ticket categories" ON public.ticket_categories;
DROP POLICY IF EXISTS "Admins can manage ticket categories" ON public.ticket_categories;

-- POLÍTICA 1: Cualquiera puede ver categorías activas
CREATE POLICY "Anyone can view ticket categories"
  ON public.ticket_categories
  FOR SELECT
  USING (is_active = true);

-- POLÍTICA 2: Solo admins pueden gestionar categorías
CREATE POLICY "Admins can manage ticket categories"
  ON public.ticket_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'hoster')
    )
  );

-- ============================================
-- 6. COMENTARIOS
-- ============================================

COMMENT ON POLICY "Users can view their own tickets" ON public.tickets 
  IS 'Los usuarios pueden ver sus propios tickets por buyer_id o buyer_email';

COMMENT ON POLICY "Admins can view all tickets" ON public.tickets 
  IS 'Los administradores y hosters pueden ver todos los tickets del sistema';

COMMENT ON POLICY "Service role can insert tickets" ON public.tickets 
  IS 'El service role (webhooks, funciones edge) puede crear tickets';

COMMENT ON POLICY "Users can view their own orders" ON public.orders 
  IS 'Los usuarios pueden ver sus propias órdenes de compra';

COMMENT ON POLICY "Admins can view all orders" ON public.orders 
  IS 'Los administradores pueden ver todas las órdenes del sistema';


