ALTER TABLE public.configuracoes_financeiras 
ADD COLUMN IF NOT EXISTS max_parcelas_mensal INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_parcelas_anual INTEGER DEFAULT 12,
ADD COLUMN IF NOT EXISTS vip_price_annual NUMERIC DEFAULT 299.00;

-- Ensure constraints (1 to 12)
ALTER TABLE public.configuracoes_financeiras 
ADD CONSTRAINT check_max_parcelas_mensal CHECK (max_parcelas_mensal >= 1 AND max_parcelas_mensal <= 12),
ADD CONSTRAINT check_max_parcelas_anual CHECK (max_parcelas_anual >= 1 AND max_parcelas_anual <= 12);
