-- Migration: Update tickets table to reference orders
-- Created: 2025-01-19

-- Agregar columna order_uuid para referenciar la tabla orders
-- Nota: purchase_id sigue siendo TEXT para compatibilidad, pero order_uuid es la referencia real
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS order_uuid UUID REFERENCES public.orders(id) ON DELETE SET NULL;

-- Crear índice para búsquedas rápidas por orden
CREATE INDEX IF NOT EXISTS idx_tickets_order_uuid ON public.tickets(order_uuid);
CREATE INDEX IF NOT EXISTS idx_tickets_purchase_id ON public.tickets(purchase_id);
CREATE INDEX IF NOT EXISTS idx_tickets_payment_method_id ON public.tickets(payment_method_id);

-- Comentarios para documentación
COMMENT ON COLUMN public.tickets.order_uuid IS 'Referencia UUID a la tabla orders para relacionar tickets con su orden de compra';
COMMENT ON COLUMN public.tickets.purchase_id IS 'ID de compra en formato texto (legacy), usar order_uuid para nueva funcionalidad';

