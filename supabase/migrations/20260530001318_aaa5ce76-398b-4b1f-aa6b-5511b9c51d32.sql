-- Simplificar o trigger ao máximo para teste
CREATE OR REPLACE FUNCTION private.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Retorna imediatamente sem fazer nada
  -- Isso isola o erro 500 caso ele venha do trigger
  RETURN new;
END;
$function$;
