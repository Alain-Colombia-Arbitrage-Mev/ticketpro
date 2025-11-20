-- Migration: Change default currency from MXN to USD
-- Created: 2025-01-20
-- Description: Updates the default currency in the orders table and existing records

-- 1. Alterar la columna para cambiar el DEFAULT de MXN a USD
ALTER TABLE public.orders
  ALTER COLUMN currency SET DEFAULT 'USD';

-- 2. OPCIONAL: Actualizar registros existentes de MXN a USD
-- Comentar la siguiente línea si NO quieres actualizar registros existentes
-- UPDATE public.orders SET currency = 'USD' WHERE currency = 'MXN';

-- Comentario para documentación
COMMENT ON COLUMN public.orders.currency IS 'Currency used for the payment. Default: USD';
