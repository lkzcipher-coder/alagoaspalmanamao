-- Add cover image to roteiros_vip if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roteiros_vip' AND column_name = 'image_url') THEN
        ALTER TABLE public.roteiros_vip ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- Create roteiro_passos table
CREATE TABLE IF NOT EXISTS public.roteiro_passos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    roteiro_id UUID NOT NULL REFERENCES public.roteiros_vip(id) ON DELETE CASCADE,
    horario TEXT NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    image_url TEXT,
    ordem INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roteiro_passos TO authenticated;
GRANT ALL ON public.roteiro_passos TO service_role;
GRANT SELECT ON public.roteiro_passos TO anon;

-- Enable RLS
ALTER TABLE public.roteiro_passos ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Enable read access for all users" ON public.roteiro_passos FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.roteiro_passos FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_roteiro_passos_updated_at 
BEFORE UPDATE ON public.roteiro_passos 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
