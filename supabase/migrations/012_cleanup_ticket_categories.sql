-- Migration 012: Cleanup ticket_categories — only GENERAL for Open Salinas
-- Created: 2026-02-26
-- Description: Deactivate all ticket categories except GENERAL.
--   Open Salinas (event 9999) has a single ticket type: Entrada General $20 USD.

-- Ensure the GENERAL category exists and is active
INSERT INTO public.ticket_categories (name, display_name, is_active, display_order)
VALUES ('GENERAL', 'Entrada General', true, 1)
ON CONFLICT (name) DO UPDATE
  SET display_name = 'Entrada General',
      is_active    = true,
      display_order = 1;

-- Deactivate every other category
UPDATE public.ticket_categories
SET is_active = false
WHERE name != 'GENERAL';
