-- Migration 006: Fix triggers
-- Created: 2025-11-20
-- Description: Elimina triggers duplicados y recrea correctamente

-- ============================================
-- 1. LIMPIAR TRIGGERS DUPLICADOS EN ORDERS
-- ============================================

-- Eliminar TODOS los triggers en orders
DROP TRIGGER IF EXISTS trigger_update_orders_updated_at ON public.orders;
DROP TRIGGER IF EXISTS set_updated_at ON public.orders;
DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
DROP TRIGGER IF EXISTS update_orders_timestamp ON public.orders;

RAISE NOTICE 'All old triggers on orders removed';

-- ============================================
-- 2. RECREAR TRIGGER CORRECTO EN ORDERS
-- ============================================

-- Verificar que la función existe (debería estar desde migración 002)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'update_orders_updated_at'
  ) THEN
    -- Si no existe, crearla
    CREATE OR REPLACE FUNCTION update_orders_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = NOW();
      
      -- Si el estado cambia a 'completed' y completed_at es NULL, establecerlo
      IF NEW.payment_status = 'completed' AND OLD.payment_status != 'completed' AND NEW.completed_at IS NULL THEN
        NEW.completed_at = NOW();
      END IF;
      
      -- Lo mismo para 'paid'
      IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' AND NEW.completed_at IS NULL THEN
        NEW.completed_at = NOW();
      END IF;
      
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
    
    RAISE NOTICE 'Function update_orders_updated_at created';
  ELSE
    RAISE NOTICE 'Function update_orders_updated_at already exists';
  END IF;
END $$;

-- Crear el trigger
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

RAISE NOTICE 'Trigger orders_updated_at created successfully';

-- ============================================
-- 3. CREAR TRIGGER PARA TICKETS
-- ============================================

-- Eliminar triggers antiguos si existen
DROP TRIGGER IF EXISTS tickets_updated_at ON public.tickets;
DROP TRIGGER IF EXISTS set_updated_at_tickets ON public.tickets;
DROP TRIGGER IF EXISTS update_tickets_timestamp ON public.tickets;

-- Verificar que la función handle_updated_at existe (debería estar desde migración 001)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_updated_at'
  ) THEN
    -- Si no existe, crearla
    CREATE OR REPLACE FUNCTION public.handle_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
    
    RAISE NOTICE 'Function handle_updated_at created';
  ELSE
    RAISE NOTICE 'Function handle_updated_at already exists';
  END IF;
END $$;

-- Crear el trigger para tickets
CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

RAISE NOTICE 'Trigger tickets_updated_at created successfully';

-- ============================================
-- 4. VERIFICAR QUE PROFILES TIENE SU TRIGGER
-- ============================================

-- El trigger debería existir desde migración 001, solo verificamos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'profiles_updated_at'
  ) THEN
    -- Si no existe, crearlo
    CREATE TRIGGER profiles_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
    
    RAISE NOTICE 'Trigger profiles_updated_at created';
  ELSE
    RAISE NOTICE 'Trigger profiles_updated_at already exists';
  END IF;
END $$;

-- ============================================
-- 5. COMENTARIOS
-- ============================================

COMMENT ON TRIGGER orders_updated_at ON public.orders 
  IS 'Actualiza updated_at y completed_at automáticamente cuando el payment_status cambia';

COMMENT ON TRIGGER tickets_updated_at ON public.tickets 
  IS 'Actualiza updated_at automáticamente en cada UPDATE';

COMMENT ON FUNCTION update_orders_updated_at() 
  IS 'Función especial para orders que maneja updated_at y completed_at';

COMMENT ON FUNCTION public.handle_updated_at() 
  IS 'Función genérica para actualizar updated_at en cualquier tabla';


