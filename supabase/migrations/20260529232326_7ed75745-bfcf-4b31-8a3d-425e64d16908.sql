-- Habilitar a extensão pg_cron se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Adicionar colunas de validade VIP na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS premium_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS premium_expiry_date TIMESTAMP WITH TIME ZONE;

-- Criar tabela de pagamentos para histórico financeiro
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Grants para a tabela payments
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

-- Políticas de RLS para payments
CREATE POLICY "Usuários podem ver seus próprios pagamentos" 
ON public.payments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins podem ver todos os pagamentos" 
ON public.payments 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Função para verificar e processar expiração de assinaturas
CREATE OR REPLACE FUNCTION public.check_premium_expiry()
RETURNS void AS $$
BEGIN
    -- Atualizar is_premium para false se a data atual for maior que a data de expiração
    UPDATE public.profiles
    SET is_premium = false
    WHERE is_premium = true 
      AND premium_expiry_date < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Agendar a verificação diária (executa todo dia à meia-noite)
-- Nota: O nome do job 'check_premium_expiry_job' ajuda a evitar duplicatas
SELECT cron.schedule('check_premium_expiry_job', '0 0 * * *', 'SELECT public.check_premium_expiry()');

-- Trigger para definir automaticamente a data de expiração ao ativar o premium (opcional, mas útil)
CREATE OR REPLACE FUNCTION public.handle_premium_activation()
RETURNS TRIGGER AS $$
BEGIN
    -- Se is_premium mudou de false para true, define as datas
    IF (NEW.is_premium = true AND (OLD.is_premium = false OR OLD.is_premium IS NULL)) THEN
        NEW.premium_start_date = now();
        NEW.premium_expiry_date = now() + INTERVAL '30 days';
        
        -- Opcional: Registrar um pagamento fictício se for uma ativação manual de teste
        -- INSERT INTO public.payments (user_id, amount) VALUES (NEW.id, 99.90);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_premium_activation ON public.profiles;
CREATE TRIGGER on_premium_activation
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_premium_activation();
