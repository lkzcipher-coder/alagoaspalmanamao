ALTER TABLE public.roteiro_passos ADD COLUMN IF NOT EXISTS google_maps_url TEXT;

-- Update the existing type definition or ensure the application knows about this change
COMMENT ON COLUMN public.roteiro_passos.google_maps_url IS 'URL for Google Maps navigation for this specific step.';