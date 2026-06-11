-- Revogar execução pública para funções SECURITY DEFINER por segurança
REVOKE EXECUTE ON FUNCTION public.handle_video_like_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_video_comment_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_admins_on_video_activity() FROM PUBLIC;

-- Garantir que as funções possam ser executadas pelo service_role (usado por gatilhos)
GRANT EXECUTE ON FUNCTION public.handle_video_like_change() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_video_comment_change() TO service_role;
GRANT EXECUTE ON FUNCTION public.notify_admins_on_video_activity() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_video_like_change() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_video_comment_change() TO postgres;
GRANT EXECUTE ON FUNCTION public.notify_admins_on_video_activity() TO postgres;
