-- Migration: Fix payment_status constraint to include 'paid'
-- Created: 2025-11-19 19:00:00
-- Problem: Original constraint 'valid_payment_status' doesn't include 'paid' status

-- Eliminar constraint antiguo si existe
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS valid_payment_status CASCADE;

-- Eliminar constraint duplicado si existe
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check CASCADE;

-- Crear constraint correcto con 'paid' incluido
ALTER TABLE public.orders
ADD CONSTRAINT orders_payment_status_check 
CHECK (payment_status IN ('pending', 'processing', 'completed', 'paid', 'failed', 'refunded', 'cancelled'));

-- Comentario para documentación
COMMENT ON CONSTRAINT orders_payment_status_check ON public.orders IS 'Valida que payment_status tenga un valor permitido, incluyendo paid para pagos de Stripe';

