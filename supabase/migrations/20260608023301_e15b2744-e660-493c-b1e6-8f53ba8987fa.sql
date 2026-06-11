ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS tide_open_time TEXT DEFAULT '00:00',
ADD COLUMN IF NOT EXISTS tide_close_time TEXT DEFAULT '23:59';

COMMENT ON COLUMN public.app_settings.tide_open_time IS 'Horário de abertura (HH:mm) para liberação da maré do dia seguinte.';
COMMENT ON COLUMN public.app_settings.tide_close_time IS 'Horário de fechamento (HH:mm) para bloqueio da maré do dia seguinte.';