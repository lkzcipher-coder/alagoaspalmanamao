-- Update roteiros_vip
ALTER TABLE public.roteiros_vip ADD COLUMN IF NOT EXISTS localizacao_nome TEXT;
ALTER TABLE public.roteiros_vip ADD COLUMN IF NOT EXISTS google_maps_link TEXT;

-- Update eventos_vip
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eventos_vip' AND column_name = 'data_categoria' AND data_type = 'text') THEN
        ALTER TABLE public.eventos_vip RENAME COLUMN data_categoria TO data_categoria_old;
        ALTER TABLE public.eventos_vip ADD COLUMN data_categoria TIMESTAMP WITH TIME ZONE;
        ALTER TABLE public.eventos_vip DROP COLUMN data_categoria_old;
    END IF;
END $$;

ALTER TABLE public.eventos_vip ADD COLUMN IF NOT EXISTS localizacao_nome TEXT;
ALTER TABLE public.eventos_vip ADD COLUMN IF NOT EXISTS google_maps_link TEXT;

-- Ensure RLS is enabled
ALTER TABLE public.roteiros_vip ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_vip ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can manage roteiros_vip" ON public.roteiros_vip;
DROP POLICY IF EXISTS "Anyone can view roteiros_vip" ON public.roteiros_vip;
DROP POLICY IF EXISTS "Admin can manage eventos_vip" ON public.eventos_vip;
DROP POLICY IF EXISTS "Anyone can view eventos_vip" ON public.eventos_vip;

-- Create policies using role column
CREATE POLICY "Admin can manage roteiros_vip" ON public.roteiros_vip 
    FOR ALL 
    TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Anyone can view roteiros_vip" ON public.roteiros_vip 
    FOR SELECT 
    USING (true);

CREATE POLICY "Admin can manage eventos_vip" ON public.eventos_vip 
    FOR ALL 
    TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Anyone can view eventos_vip" ON public.eventos_vip 
    FOR SELECT 
    USING (true);

-- Grant permissions
GRANT ALL ON public.roteiros_vip TO authenticated;
GRANT ALL ON public.roteiros_vip TO service_role;
GRANT ALL ON public.eventos_vip TO authenticated;
GRANT ALL ON public.eventos_vip TO service_role;
