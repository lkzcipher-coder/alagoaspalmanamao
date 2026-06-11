-- Create roteiros_vip table
CREATE TABLE public.roteiros_vip (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT NOT NULL,
    subtitulo TEXT,
    descricao_completa TEXT NOT NULL,
    icone_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create eventos_vip table
CREATE TABLE public.eventos_vip (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT NOT NULL,
    data_categoria TEXT NOT NULL,
    descricao_completa TEXT NOT NULL,
    icone_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Grant access to the tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roteiros_vip TO authenticated;
GRANT ALL ON public.roteiros_vip TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.eventos_vip TO authenticated;
GRANT ALL ON public.eventos_vip TO service_role;

-- Enable RLS
ALTER TABLE public.roteiros_vip ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_vip ENABLE ROW LEVEL SECURITY;

-- Policies for roteiros_vip
CREATE POLICY "Admins can manage roteiros_vip" ON public.roteiros_vip
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "VIP users can view roteiros_vip" ON public.roteiros_vip
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_premium = true OR role = 'admin')));

-- Policies for eventos_vip
CREATE POLICY "Admins can manage eventos_vip" ON public.eventos_vip
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "VIP users can view eventos_vip" ON public.eventos_vip
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_premium = true OR role = 'admin')));

-- Triggers for updated_at
CREATE TRIGGER update_roteiros_vip_updated_at BEFORE UPDATE ON public.roteiros_vip FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_eventos_vip_updated_at BEFORE UPDATE ON public.eventos_vip FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();