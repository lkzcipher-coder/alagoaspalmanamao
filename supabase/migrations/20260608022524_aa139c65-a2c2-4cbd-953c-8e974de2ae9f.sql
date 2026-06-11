ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS tide_release_time TEXT DEFAULT '00:00';

COMMENT ON COLUMN public.app_settings.tide_release_time IS 'Horário exato (HH:mm) em que a tábua de marés do dia seguinte é liberada para usuários grátis.';