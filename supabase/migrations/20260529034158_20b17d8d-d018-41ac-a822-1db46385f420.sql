ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS google_maps_link TEXT;

COMMENT ON COLUMN public.partners.google_maps_link IS 'External link to Google Maps for navigation';