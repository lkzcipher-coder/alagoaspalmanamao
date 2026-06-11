ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS tide_release_hour INTEGER DEFAULT 0;

COMMENT ON COLUMN public.app_settings.tide_release_hour IS 'Horário (0-23) em que a tábua de marés do dia seguinte é liberada para usuários grátis.';