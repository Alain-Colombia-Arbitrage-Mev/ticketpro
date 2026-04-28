-- Add a configurable capacity (aforo / total tickets to issue) per event.
-- NULL = unlimited / not set.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS total_capacity INTEGER;

COMMENT ON COLUMN public.events.total_capacity
  IS 'Total tickets to issue for this event. NULL means unlimited / not set. Enforcement at checkout time is a separate concern.';
