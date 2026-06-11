-- Conceder permissão de execução para usuários autenticados nas funções de gatilho
GRANT EXECUTE ON FUNCTION public.handle_video_like_change() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_video_comment_change() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_admins_on_video_activity() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_video_activity_deletion() TO authenticated;

-- Também para anon, caso existam gatilhos que possam ser disparados por eles (embora improvável neste app)
GRANT EXECUTE ON FUNCTION public.handle_video_like_change() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_video_comment_change() TO anon;
GRANT EXECUTE ON FUNCTION public.notify_admins_on_video_activity() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_video_activity_deletion() TO anon;
