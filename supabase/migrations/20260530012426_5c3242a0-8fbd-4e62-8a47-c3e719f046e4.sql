-- Add status column to coupons table
ALTER TABLE public.coupons 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add check constraint for status values
ALTER TABLE public.coupons 
ADD CONSTRAINT coupons_status_check CHECK (status IN ('active', 'inactive'));

-- Ensure existing rows have active status
UPDATE public.coupons SET status = 'active' WHERE status IS NULL;

-- Ensure code column is NOT NULL for future inserts (if desired, but user just said mandatory in UI)
-- The user asked to "inclua um campo obrigatório 'Código do Cupom'" in the Admin panel.
-- We can make it non-nullable in DB too if we want, but let's start with UI validation as requested.
