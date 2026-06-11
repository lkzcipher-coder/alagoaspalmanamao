-- Garantir que não haja nulos antes de aplicar a restrição
UPDATE public.videos SET likes_count = 0 WHERE likes_count IS NULL;
UPDATE public.videos SET comments_count = 0 WHERE comments_count IS NULL;

-- Aplicar restrição NOT NULL e garantir default 0
ALTER TABLE public.videos ALTER COLUMN likes_count SET DEFAULT 0;
ALTER TABLE public.videos ALTER COLUMN likes_count SET NOT NULL;

ALTER TABLE public.videos ALTER COLUMN comments_count SET DEFAULT 0;
ALTER TABLE public.videos ALTER COLUMN comments_count SET NOT NULL;
