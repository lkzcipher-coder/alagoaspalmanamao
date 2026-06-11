-- Add code column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'code') THEN
        ALTER TABLE public.coupons ADD COLUMN code TEXT;
    END IF;
END $$;

-- Update existing coupons with a default code if empty (optional but good for testing)
UPDATE public.coupons SET code = 'VIPALAGOAS' WHERE code IS NULL;

-- Ensure RLS is enabled
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;

-- Create policies
CREATE POLICY "Anyone can view coupons" 
ON public.coupons FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage coupons" 
ON public.coupons FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Grants
GRANT SELECT ON public.coupons TO anon;
GRANT SELECT ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
