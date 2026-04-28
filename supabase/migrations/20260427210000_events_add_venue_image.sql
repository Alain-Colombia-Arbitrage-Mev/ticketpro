-- Add venue_image_url for the "Información del Lugar" section on the event detail page.
-- Optional, nullable; pages should fall back to image_detail_url or a generic placeholder.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS venue_image_url TEXT;
