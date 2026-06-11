CREATE OR REPLACE FUNCTION private.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  caller_is_admin boolean;
  caller_role text;
BEGIN
  -- Bypass when called by service_role (Edge Functions admin client)
  BEGIN
    caller_role := current_setting('request.jwt.claims', true)::json->>'role';
  EXCEPTION WHEN OTHERS THEN
    caller_role := NULL;
  END;

  IF caller_role = 'service_role' OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT (role = 'admin') INTO caller_is_admin FROM public.profiles WHERE id = auth.uid();

  IF COALESCE(caller_is_admin, false) = false THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Not allowed to change role';
    END IF;
    IF NEW.is_premium IS DISTINCT FROM OLD.is_premium THEN
      RAISE EXCEPTION 'Not allowed to change premium status';
    END IF;
    IF NEW.favorites_limit IS DISTINCT FROM OLD.favorites_limit THEN
      RAISE EXCEPTION 'Not allowed to change favorites limit';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;