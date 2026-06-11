UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email = 'helioalvesbsa@hotmail.com';

UPDATE public.profiles 
SET role = 'admin' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'helioalvesbsa@hotmail.com');