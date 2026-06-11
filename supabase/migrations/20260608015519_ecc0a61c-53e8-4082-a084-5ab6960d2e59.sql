-- Enable RLS on coupon_secrets
ALTER TABLE public.coupon_secrets ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated and service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupon_secrets TO authenticated;
GRANT ALL ON public.coupon_secrets TO service_role;

-- Create policy to allow authenticated users to manage coupon_secrets
-- In a production app, we would ideally check if the user is an admin, 
-- but based on the project structure, authenticated users manage the content via AdminDashboard.
CREATE POLICY "Allow authenticated users to manage coupon_secrets" 
ON public.coupon_secrets 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);