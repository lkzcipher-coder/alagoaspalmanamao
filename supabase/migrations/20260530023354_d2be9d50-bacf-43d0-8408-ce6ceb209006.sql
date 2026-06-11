-- Add new columns to partners table
ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS reservation_options JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS show_reservation_button BOOLEAN DEFAULT false;

-- Grant permissions (if needed, though already granted for the table)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partners TO authenticated;
GRANT ALL ON public.partners TO service_role;
