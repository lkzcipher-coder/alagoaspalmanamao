-- Table for financial configurations
CREATE TABLE IF NOT EXISTS public.configuracoes_financeiras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vip_price DECIMAL(10, 2) NOT NULL DEFAULT 29.90,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure there's at least one config row
INSERT INTO public.configuracoes_financeiras (vip_price)
SELECT 29.90
WHERE NOT EXISTS (SELECT 1 FROM public.configuracoes_financeiras);

-- Enable RLS
ALTER TABLE public.configuracoes_financeiras ENABLE ROW LEVEL SECURITY;

-- Policies for configuracoes_financeiras
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow read access for all authenticated users' AND tablename = 'configuracoes_financeiras') THEN
        CREATE POLICY "Allow read access for all authenticated users" ON public.configuracoes_financeiras
            FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow update for admins' AND tablename = 'configuracoes_financeiras') THEN
        CREATE POLICY "Allow update for admins" ON public.configuracoes_financeiras
            FOR ALL TO authenticated 
            USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;
END $$;

-- Grant access
GRANT SELECT ON public.configuracoes_financeiras TO authenticated;
GRANT ALL ON public.configuracoes_financeiras TO service_role;

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL, -- 'pending', 'approved', 'rejected'
    provider TEXT DEFAULT 'mercadopago',
    external_id TEXT, -- ID from provider (preference_id or payment_id)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Policies for payments
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own payments' AND tablename = 'payments') THEN
        CREATE POLICY "Users can view their own payments" ON public.payments
            FOR SELECT TO authenticated USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all payments' AND tablename = 'payments') THEN
        CREATE POLICY "Admins can view all payments" ON public.payments
            FOR SELECT TO authenticated 
            USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;
END $$;

-- Grant access
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

-- Triggers for updated_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_configuracoes_financeiras_updated_at') THEN
        CREATE TRIGGER update_configuracoes_financeiras_updated_at 
            BEFORE UPDATE ON public.configuracoes_financeiras 
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payments_updated_at') THEN
        CREATE TRIGGER update_payments_updated_at 
            BEFORE UPDATE ON public.payments 
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;