-- Migration: Create orders table for payment tracking
-- Created: 2025-01-19

-- Tabla de órdenes/compras para centralizar información de pagos
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT UNIQUE NOT NULL, -- ID único de la orden (ej: order_123456_xyz)
  
  -- Información del comprador
  buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  buyer_email TEXT NOT NULL,
  buyer_name TEXT,
  buyer_address TEXT,
  
  -- Información del pago
  payment_method TEXT NOT NULL, -- 'stripe', 'cryptomus', 'ach', 'card', 'free'
  payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'
  total_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD', -- 'USD', 'MXN', 'BTC', etc.
  
  -- IDs de proveedores de pago
  stripe_session_id TEXT, -- ID de sesión de Stripe
  stripe_payment_intent_id TEXT, -- ID de intención de pago de Stripe
  cryptomus_order_id TEXT, -- ID de orden de Cryptomus
  cryptomus_uuid TEXT, -- UUID de Cryptomus
  
  -- Detalles de la compra
  items JSONB NOT NULL, -- Array de items comprados
  metadata JSONB, -- Información adicional
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ, -- Fecha de completación del pago
  
  -- Constraints
  CONSTRAINT valid_payment_method CHECK (payment_method IN ('stripe', 'cryptomus', 'ach', 'card', 'free', 'crypto'))
  -- NOTA: payment_status constraint se maneja con ALTER TABLE después de crear la tabla
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON public.orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_email ON public.orders(buyer_email);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON public.orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON public.orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_cryptomus_order_id ON public.orders(cryptomus_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- Si el estado cambia a 'completed' y completed_at es NULL, establecerlo
  IF NEW.payment_status = 'completed' AND OLD.payment_status != 'completed' AND NEW.completed_at IS NULL THEN
    NEW.completed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- RLS (Row Level Security) Policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Service role can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Service role can update orders" ON public.orders;

-- Política: Los usuarios pueden ver sus propias órdenes
CREATE POLICY "Users can view their own orders"
  ON public.orders
  FOR SELECT
  USING (
    auth.uid() = buyer_id 
    OR 
    buyer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Política: Los admins pueden ver todas las órdenes
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

-- Política: Los servicios pueden insertar órdenes (usando service_role)
CREATE POLICY "Service role can insert orders"
  ON public.orders
  FOR INSERT
  WITH CHECK (true);

-- Política: Los servicios pueden actualizar órdenes
CREATE POLICY "Service role can update orders"
  ON public.orders
  FOR UPDATE
  USING (true);

-- Comentarios para documentación
COMMENT ON TABLE public.orders IS 'Tabla de órdenes/compras para rastrear todos los pagos del sistema';
COMMENT ON COLUMN public.orders.order_id IS 'ID único de la orden generado por el sistema';
COMMENT ON COLUMN public.orders.payment_status IS 'Estado del pago: pending, processing, completed, failed, refunded, cancelled';
COMMENT ON COLUMN public.orders.payment_method IS 'Método de pago utilizado: stripe, cryptomus, ach, card, free';
COMMENT ON COLUMN public.orders.items IS 'Array JSON de items comprados con detalles de cada ticket';
COMMENT ON COLUMN public.orders.metadata IS 'Información adicional del pago (dirección, teléfono, etc.)';

