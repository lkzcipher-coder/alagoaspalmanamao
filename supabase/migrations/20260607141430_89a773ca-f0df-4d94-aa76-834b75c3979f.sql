ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS hero_title TEXT DEFAULT 'Descubra Alagoas.',
ADD COLUMN IF NOT EXISTS hero_subtitle TEXT DEFAULT 'Economize em cada saída.';