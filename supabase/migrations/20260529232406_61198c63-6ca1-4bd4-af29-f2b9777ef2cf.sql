-- Revogar execução pública para funções sensíveis
REVOKE EXECUTE ON FUNCTION public.check_premium_expiry() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_premium_expiry() FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_premium_expiry() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_premium_activation() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_premium_activation() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_premium_activation() FROM authenticated;

-- Garantir que o service_role e cron (que roda como postgres) possam executar
GRANT EXECUTE ON FUNCTION public.check_premium_expiry() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_premium_activation() TO service_role;
