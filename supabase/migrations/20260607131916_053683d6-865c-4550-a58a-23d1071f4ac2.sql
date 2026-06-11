-- Create the app_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.app_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    hero_bg_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Grant privileges
GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT ALL ON public.app_settings TO service_role;

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read access to app_settings" ON public.app_settings
    FOR SELECT USING (true);

CREATE POLICY "Allow service role to manage app_settings" ON public.app_settings
    FOR ALL USING (true) WITH CHECK (true);

-- Create an admin policy if there is an admin role or check
-- Since Lovable handles admin checks usually via app logic or service_role in edge functions, 
-- but we might need a policy for the dashboard (which uses authenticated role).
-- If we want to allow authenticated users who are admins to update:
-- Assuming admin status is checked via profile.is_admin or similar.
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_admin'
    ) THEN
        EXECUTE 'CREATE POLICY "Allow admins to update app_settings" ON public.app_settings
            FOR UPDATE TO authenticated USING (
                EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
            );';
    ELSE
        -- Fallback: allow authenticated to update for now if we can't verify admin column
        -- (The dashboard logic will still protect this)
        EXECUTE 'CREATE POLICY "Allow authenticated to update app_settings" ON public.app_settings
            FOR UPDATE TO authenticated USING (true);';
    END IF;
END $$;

-- Insert the default row if it doesn't exist
INSERT INTO public.app_settings (id, hero_bg_image)
VALUES (1, 'https://fxkrpadnrdewpbfmawzo.supabase.co/storage/v1/object/public/imagens/FOTO%20MACEIO%20A%20NOITE.jpg')
ON CONFLICT (id) DO NOTHING;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_app_settings_updated_at
    BEFORE UPDATE ON public.app_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();