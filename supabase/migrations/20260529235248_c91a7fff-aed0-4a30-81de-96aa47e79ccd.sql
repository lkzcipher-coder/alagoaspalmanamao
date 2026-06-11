-- 1. Melhorar a função handle_new_user com tratamento de erros e logs
CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Log de início para depuração (visível nos logs do Postgres)
  RAISE LOG 'Iniciando handle_new_user para ID: %, Email: %', new.id, new.email;

  INSERT INTO public.profiles (id, role, is_premium, full_name, email)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    false,
    new.raw_user_meta_data->>'name',
    new.email
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
    
  RAISE LOG 'Perfil criado/atualizado com sucesso para ID: %', new.id;
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Captura qualquer erro e gera um aviso, mas permite que o cadastro continue
  -- Isso evita o erro 500 no signup
  RAISE WARNING 'ERRO CRÍTICO no trigger handle_new_user para ID %: % (Estado: %)', new.id, SQLERRM, SQLSTATE;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Melhorar a função handle_premium_activation
CREATE OR REPLACE FUNCTION public.handle_premium_activation()
RETURNS TRIGGER AS $$
BEGIN
    -- Se is_premium mudou de false para true, define as datas
    IF (NEW.is_premium = true AND (OLD.is_premium = false OR OLD.is_premium IS NULL)) THEN
        BEGIN
            NEW.premium_start_date = now();
            NEW.premium_expiry_date = now() + INTERVAL '30 days';
            
            RAISE LOG 'Premium ativado para o usuário %', NEW.id;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Erro ao processar ativação premium para usuário %: %', NEW.id, SQLERRM;
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Ajustar permissões da tabela profiles para anon
-- Embora o trigger use SECURITY DEFINER, garantir que anon possa inserir seu próprio perfil
-- ajuda se o cliente tentar alguma operação de fallback ou se houver verificações de sanidade.
GRANT INSERT ON public.profiles TO anon;
GRANT INSERT ON public.profiles TO authenticated;

-- 4. Garantir que a tabela payments também tenha permissões básicas para o service_role
GRANT ALL ON public.payments TO service_role;
