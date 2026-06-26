CREATE TABLE public.tides_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tide_date DATE NOT NULL UNIQUE,
  tide_time TIME NOT NULL,
  height NUMERIC(4,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tides_data TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tides_data TO authenticated;
GRANT ALL ON public.tides_data TO service_role;

ALTER TABLE public.tides_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tide data"
  ON public.tides_data FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage tide data"
  ON public.tides_data FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE TRIGGER update_tides_data_updated_at
  BEFORE UPDATE ON public.tides_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();