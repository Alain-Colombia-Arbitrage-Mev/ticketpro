-- Migration: Fix payment_status constraint DEFINITIVO
-- Created: 2025-11-19 FINAL
-- Elimina todos los constraints problemáticos y crea uno limpio

-- Eliminar TODOS los constraints de payment_status existentes
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS valid_payment_status CASCADE;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check CASCADE;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check_v2 CASCADE;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_final_check CASCADE;

-- Crear constraint DEFINITIVO con nombre único
ALTER TABLE public.orders
ADD CONSTRAINT chk_orders_payment_status 
CHECK (payment_status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'paid'::text, 'failed'::text, 'refunded'::text, 'cancelled'::text]));

-- Comentario
COMMENT ON CONSTRAINT chk_orders_payment_status ON public.orders 
IS 'FINAL - Incluye paid para Stripe. NO MODIFICAR.';

