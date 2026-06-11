-- Create avaliacoes table
CREATE TABLE public.avaliacoes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    parceiro_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
    comentario TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(parceiro_id, usuario_id)
);

-- Use GRANT to set permissions
GRANT SELECT ON public.avaliacoes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.avaliacoes TO authenticated;
GRANT ALL ON public.avaliacoes TO service_role;

-- Enable Row Level Security
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view ratings" 
ON public.avaliacoes FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own ratings" 
ON public.avaliacoes FOR INSERT 
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own ratings" 
ON public.avaliacoes FOR UPDATE 
USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their own ratings" 
ON public.avaliacoes FOR DELETE 
USING (auth.uid() = usuario_id);

-- Create a view for partner statistics
CREATE OR REPLACE VIEW public.partner_stats AS
SELECT 
    parceiro_id,
    COUNT(*) as total_avaliacoes,
    ROUND(AVG(nota)::numeric, 1) as media_nota
FROM public.avaliacoes
GROUP BY parceiro_id;

GRANT SELECT ON public.partner_stats TO anon, authenticated;
GRANT ALL ON public.partner_stats TO service_role;
