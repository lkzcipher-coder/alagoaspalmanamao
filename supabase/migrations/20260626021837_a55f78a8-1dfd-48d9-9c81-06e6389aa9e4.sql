GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;

DROP POLICY IF EXISTS "Allow authenticated to update app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Allow admins to update app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admins can update app_settings" ON public.app_settings;

CREATE POLICY "Admins can update app_settings"
  ON public.app_settings
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

GRANT SELECT ON public.tides_data TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tides_data TO authenticated;
GRANT ALL ON public.tides_data TO service_role;
