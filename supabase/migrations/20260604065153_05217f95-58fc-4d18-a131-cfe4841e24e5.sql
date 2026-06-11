-- Remover políticas antigas restritivas
DROP POLICY IF EXISTS "Admins can delete their own notifications" ON public.notificacoes;
DROP POLICY IF EXISTS "Admins can update their own notifications" ON public.notificacoes;
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notificacoes;

-- Nova política de visualização: Admins veem tudo, usuários veem as suas
CREATE POLICY "Admins can manage all notifications" ON public.notificacoes
FOR ALL
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
);

-- Garantir permissões de exclusão total para admins na tabela de notificações
GRANT ALL ON public.notificacoes TO authenticated;
GRANT ALL ON public.notificacoes TO service_role;