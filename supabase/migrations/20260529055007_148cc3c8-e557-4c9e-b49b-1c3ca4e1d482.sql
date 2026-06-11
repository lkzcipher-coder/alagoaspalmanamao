-- Add is_test column
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false;

-- Allow NULL values for category to support incomplete registrations
ALTER TABLE public.partners ALTER COLUMN category DROP NOT NULL;
ALTER TABLE public.partners ALTER COLUMN location DROP NOT NULL;

-- Update RLS to ensure anyone can see test items too (already true with current policies but good to be explicit if we were changing them)
-- No changes needed to policies since they are already 'true'
