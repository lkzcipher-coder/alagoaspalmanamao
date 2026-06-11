-- Adicionar política para permitir que usuários excluam suas próprias notificações
CREATE POLICY "Admins can delete their own notifications" 
ON public.notificacoes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Garantir que a tabela tenha RLS habilitado (já deve ter, mas por segurança)
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
