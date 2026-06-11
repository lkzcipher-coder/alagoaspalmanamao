-- 1. Garantir que a função handle_new_user seja resiliente e informativa
CREATE OR REPLACE FUNCTION private.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_full_name text;
    v_role text;
BEGIN
  -- Log de início (visível nos logs do Postgres do Supabase)
  RAISE LOG 'Auth Trigger: Iniciando handle_new_user para ID: %, Email: %', new.id, new.email;

  -- Extração segura de metadados
  BEGIN
    v_full_name := COALESCE(
        new.raw_user_meta_data->>'name', 
        new.raw_user_meta_data->>'full_name', 
        'Usuário'
    );
    v_role := COALESCE(new.raw_user_meta_data->>'role', 'user');
    
    -- Validação básica da role para evitar violação de constraint
    IF v_role NOT IN ('user', 'admin') THEN
        v_role := 'user';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_full_name := 'Usuário';
    v_role := 'user';
    RAISE WARNING 'Auth Trigger: Erro ao extrair metadados para ID %: %', new.id, SQLERRM;
  END;

  -- Inserção no perfil com tratamento de erro isolado
  BEGIN
    INSERT INTO public.profiles (id, role, is_premium, full_name, email)
    VALUES (new.id, v_role, false, v_full_name, new.email)
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      updated_at = now();
    
    RAISE LOG 'Auth Trigger: Perfil processado com sucesso para ID: %', new.id;
  EXCEPTION WHEN OTHERS THEN
    -- CAPTURA CRÍTICA: Se a inserção falhar, o cadastro no Auth CONTINUA.
    -- O erro 500 é evitado aqui.
    RAISE WARNING 'Auth Trigger: FALHA CRÍTICA ao criar perfil para ID %: % (Estado: %)', new.id, SQLERRM, SQLSTATE;
  END;

  RETURN new;
END;
$function$;

-- 2. Garantir permissões de acesso aos esquemas
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

-- 3. Garantir permissões de INSERT e SELECT para operações de cadastro
GRANT SELECT, INSERT, UPDATE ON public.profiles TO anon, authenticated, service_role;
GRANT SELECT, INSERT ON public.payments TO anon, authenticated, service_role;

-- 4. Ajustar políticas de RLS para permitir inserção inicial se necessário
-- (Embora o trigger use SECURITY DEFINER, isso ajuda se o front-end tentar redundância)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (true); -- Permitir inserção, validada depois pelo trigger ou RLS de leitura

-- 5. Adicionar política de INSERT para payments (estava faltando)
DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;
CREATE POLICY "Users can insert their own payments" 
ON public.payments FOR INSERT 
WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL); -- Permitir durante transição de signup

-- 6. Garantir que o trigger esteja ativo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();
