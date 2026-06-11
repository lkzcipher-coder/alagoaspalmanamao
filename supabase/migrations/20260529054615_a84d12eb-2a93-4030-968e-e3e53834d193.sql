CREATE OR REPLACE VIEW public.partner_stats 
WITH (security_invoker = true)
AS
SELECT 
    parceiro_id,
    COUNT(*) as total_avaliacoes,
    ROUND(AVG(nota)::numeric, 1) as media_nota
FROM public.avaliacoes
GROUP BY parceiro_id;
