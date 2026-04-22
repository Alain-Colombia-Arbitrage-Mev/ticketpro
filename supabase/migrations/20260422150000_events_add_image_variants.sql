-- Adds dedicated image variant columns for events.
-- The existing `image_url` stays as a fallback so the UI keeps working for
-- events that don't have the new variants populated yet.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS image_slider_url text,
  ADD COLUMN IF NOT EXISTS image_card_url   text,
  ADD COLUMN IF NOT EXISTS image_detail_url text;

COMMENT ON COLUMN public.events.image_slider_url IS '1920x800 hero/slider variant uploaded to R2 (imagenes.veltlix.com)';
COMMENT ON COLUMN public.events.image_card_url   IS '800x600 card/grid variant uploaded to R2 (imagenes.veltlix.com)';
COMMENT ON COLUMN public.events.image_detail_url IS '1200x800 event-detail variant uploaded to R2 (imagenes.veltlix.com)';
