-- Add price column to partners table
ALTER TABLE public.partners ADD COLUMN price TEXT;

-- Update existing partners with a default value if needed, 
-- but the user wants to set it, so we'll leave it null or set to 'R$ 45' if they want a transition.
-- Given the hardcoded value was 'R$ 45+', let's set it to 'R$ 45' for existing records so they don't break.
UPDATE public.partners SET price = 'R$ 45' WHERE price IS NULL;
