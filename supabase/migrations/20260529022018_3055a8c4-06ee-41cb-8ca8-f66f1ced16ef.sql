-- Create the VIP configurations table
CREATE TABLE public.configuracoes_vip (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    preco_anual TEXT NOT NULL DEFAULT '29,90',
    link_checkout TEXT NOT NULL DEFAULT 'https://google.com',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Use GRANT to set permissions for different roles
GRANT SELECT ON public.configuracoes_vip TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.configuracoes_vip TO authenticated;
GRANT ALL ON public.configuracoes_vip TO service_role;

-- Enable Row Level Security
ALTER TABLE public.configuracoes_vip ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Anyone can view VIP configurations" 
ON public.configuracoes_vip 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage VIP configurations" 
ON public.configuracoes_vip 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Insert a default row
INSERT INTO public.configuracoes_vip (preco_anual, link_checkout)
VALUES ('29,90', 'https://loja.alagoasvip.com.br');

-- Add trigger for updated_at
CREATE TRIGGER update_configuracoes_vip_updated_at
BEFORE UPDATE ON public.configuracoes_vip
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();