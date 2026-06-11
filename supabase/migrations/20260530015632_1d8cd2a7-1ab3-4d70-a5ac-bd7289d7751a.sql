ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS nightlife_type TEXT,
ADD COLUMN IF NOT EXISTS operating_hours TEXT;

-- Update the type to include these fields in case they are missing from existing rows
COMMENT ON COLUMN public.partners.nightlife_type IS 'Type of nightlife establishment (Bar, Show, Evento)';
COMMENT ON COLUMN public.partners.operating_hours IS 'Operating hours of the establishment';