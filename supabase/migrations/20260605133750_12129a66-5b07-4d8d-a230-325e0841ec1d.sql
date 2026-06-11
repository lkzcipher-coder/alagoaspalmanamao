CREATE TABLE public.payment_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL,
    plan_type TEXT NOT NULL,
    mp_payment_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Grants
GRANT SELECT ON public.payment_history TO authenticated;
GRANT ALL ON public.payment_history TO service_role;

-- RLS
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Política para admins verem todas as transações (assumindo que profiles tem coluna 'role')
CREATE POLICY "Admins can view all payment history" ON public.payment_history
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));

-- Política para usuários verem seu próprio histórico (opcional mas bom ter)
CREATE POLICY "Users can view their own payment history" ON public.payment_history
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
