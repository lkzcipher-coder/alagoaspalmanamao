-- Create general settings table
CREATE TABLE public.configuracoes_gerais (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    whatsapp_link TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Use GRANT to set permissions for different roles.
GRANT SELECT ON public.configuracoes_gerais TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracoes_gerais TO authenticated;
GRANT ALL ON public.configuracoes_gerais TO service_role;

-- Enable Row Level Security
ALTER TABLE public.configuracoes_gerais ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Public can view general configurations" 
ON public.configuracoes_gerais 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can update general configurations" 
ON public.configuracoes_gerais 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

CREATE POLICY "Only admins can insert general configurations" 
ON public.configuracoes_gerais 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Insert a default row
INSERT INTO public.configuracoes_gerais (whatsapp_link)
VALUES ('https://wa.me/5582999999999');

-- Add trigger for updated_at
CREATE TRIGGER update_configuracoes_gerais_updated_at
BEFORE UPDATE ON public.configuracoes_gerais
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();