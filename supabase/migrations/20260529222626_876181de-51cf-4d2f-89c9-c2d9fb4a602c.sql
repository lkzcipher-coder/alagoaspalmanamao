-- Create tide_destinations table
CREATE TABLE public.tide_destinations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Grant permissions
GRANT SELECT ON public.tide_destinations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tide_destinations TO authenticated;
GRANT ALL ON public.tide_destinations TO service_role;

-- Enable RLS
ALTER TABLE public.tide_destinations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Destinations are viewable by everyone" 
ON public.tide_destinations 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can modify destinations" 
ON public.tide_destinations 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tide_destinations_updated_at
    BEFORE UPDATE ON public.tide_destinations
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();

-- Insert default destination (Maceió)
INSERT INTO public.tide_destinations (name, latitude, longitude)
VALUES ('Maceió, AL', -9.6658, -35.7350);