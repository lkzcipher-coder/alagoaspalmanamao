-- Add latitude and longitude columns to partners table
ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Comment for clarity
COMMENT ON COLUMN public.partners.latitude IS 'Latitude coordinate for map positioning';
COMMENT ON COLUMN public.partners.longitude IS 'Longitude coordinate for map positioning';
