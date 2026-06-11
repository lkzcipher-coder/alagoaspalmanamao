-- Adicionar política para permitir que administradores excluam qualquer comentário
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'comentarios' 
        AND policyname = 'Admins can delete any comment'
    ) THEN
        CREATE POLICY "Admins can delete any comment" ON public.comentarios
        FOR DELETE
        USING (
            auth.uid() IN (
                SELECT id FROM public.profiles WHERE role = 'admin'
            )
        );
    END IF;
END $$;
